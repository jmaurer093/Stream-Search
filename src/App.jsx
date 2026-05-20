import { useState, useRef, useCallback } from "react";

const IMG_BASE = "https://image.tmdb.org/t/p/";

const COUNTRY_NAMES = {
  US:"United States",GB:"United Kingdom",CA:"Canada",AU:"Australia",DE:"Germany",
  FR:"France",ES:"Spain",IT:"Italy",JP:"Japan",KR:"South Korea",IN:"India",
  BR:"Brazil",MX:"Mexico",NL:"Netherlands",SE:"Sweden",NO:"Norway",DK:"Denmark",
  FI:"Finland",PL:"Poland",PT:"Portugal",BE:"Belgium",CH:"Switzerland",AT:"Austria",
  NZ:"New Zealand",ZA:"South Africa",AR:"Argentina",CL:"Chile",CO:"Colombia",
  TR:"Turkey",SG:"Singapore",HK:"Hong Kong",TH:"Thailand",PH:"Philippines",
  ID:"Indonesia",RU:"Russia",IL:"Israel",AE:"UAE",SA:"Saudi Arabia",CZ:"Czech Republic",
  HU:"Hungary",RO:"Romania",GR:"Greece",SK:"Slovakia",BG:"Bulgaria",HR:"Croatia",
  RS:"Serbia",UA:"Ukraine",EE:"Estonia",LV:"Latvia",LT:"Lithuania",SI:"Slovenia",
  MY:"Malaysia",TW:"Taiwan",VN:"Vietnam",PK:"Pakistan",NG:"Nigeria",EG:"Egypt",
  MA:"Morocco",KE:"Kenya",GH:"Ghana",PE:"Peru",VE:"Venezuela",EC:"Ecuador",
  IE:"Ireland",CY:"Cyprus",MT:"Malta",LU:"Luxembourg",IS:"Iceland",
};

const flag = code => code.toUpperCase().replace(/./g, c =>
  String.fromCodePoint(c.charCodeAt(0) + 127397)
);

const countryName = code => COUNTRY_NAMES[code] || code;

const POPULAR = ["Severance","The Bear","Inception","Breaking Bad","Oppenheimer","Shogun","Interstellar","The Office"];

// Build a map: { flatrate: { providerName: { logo, id, countries[] } }, free: {}, ads: {}, rent: {}, buy: {} }
function buildProviderMap(rawProviders) {
  const types = ["flatrate","free","ads","rent","buy"];
  const map = {};
  types.forEach(t => map[t] = {});

  Object.entries(rawProviders).forEach(([countryCode, data]) => {
    if (countryCode === "link") return;
    types.forEach(type => {
      (data[type] || []).forEach(p => {
        if (!map[type][p.provider_name]) {
          map[type][p.provider_name] = { logo: p.logo_path, id: p.provider_id, countries: [] };
        }
        map[type][p.provider_name].countries.push(countryCode);
      });
    });
  });

  // Sort each type by number of countries desc
  types.forEach(type => {
    const sorted = Object.entries(map[type])
      .sort((a, b) => b[1].countries.length - a[1].countries.length);
    map[type] = Object.fromEntries(sorted);
  });

  return map;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0A0A0F; --surface: #13131A; --surface2: #1A1A24;
    --border: rgba(255,255,255,0.07); --gold: #E8B84B; --gold2: #C9962A;
    --text: #F0EBE3; --muted: #6B6575; --dim: #2A2830;
  }
  body { background: var(--bg); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--dim); border-radius: 2px; }

  .app { min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif; color:var(--text); }
  .main { max-width:860px; margin:0 auto; padding:0 20px 80px; }

  /* KEY SCREEN */
  .key-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; padding:40px 24px; text-align:center; }
  .key-icon { font-size:48px; margin-bottom:24px; }
  .key-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(2.5rem,8vw,5rem); letter-spacing:0.05em; color:var(--text); line-height:1; margin-bottom:8px; }
  .key-sub { color:var(--muted); font-size:15px; margin-bottom:40px; line-height:1.6; max-width:420px; }
  .key-box { width:100%; max-width:480px; }
  .key-input-wrap { display:flex; background:var(--surface); border:1px solid var(--border); border-radius:6px 6px 0 0; overflow:hidden; }
  .key-input { flex:1; background:transparent; border:none; outline:none; color:var(--text); font-size:15px; padding:16px 20px; font-family:'DM Sans',sans-serif; }
  .key-input::placeholder { color:var(--muted); }
  .key-btn { background:linear-gradient(135deg,var(--gold),var(--gold2)); border:none; color:#1A0F00; font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:0.1em; padding:16px 28px; cursor:pointer; }
  .key-note { font-size:12px; color:var(--muted); margin-top:12px; }
  .key-note a { color:var(--gold); text-decoration:none; }

  /* HEADER */
  .header { padding:48px 0 32px; }
  .header-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; }
  .logo { display:flex; align-items:baseline; gap:4px; }
  .logo-dot { width:8px; height:8px; background:var(--gold); border-radius:50%; margin-bottom:5px; flex-shrink:0; }
  .logo-a { font-family:'Bebas Neue',sans-serif; font-size:clamp(1.8rem,5vw,3rem); letter-spacing:0.08em; color:var(--text); }
  .logo-b { font-family:'Bebas Neue',sans-serif; font-size:clamp(1.8rem,5vw,3rem); letter-spacing:0.08em; color:var(--gold); }
  .api-badge { font-size:11px; color:var(--muted); border:1px solid var(--border); padding:4px 10px; border-radius:20px; cursor:pointer; transition:all 0.2s; background:transparent; }
  .api-badge:hover { color:var(--gold); border-color:rgba(232,184,75,0.3); }

  /* SEARCH */
  .search-input-row { display:flex; background:var(--surface); border:1px solid var(--border); border-radius:8px 8px 0 0; overflow:hidden; transition:border-color 0.2s; }
  .search-input-row:focus-within { border-color:rgba(232,184,75,0.4); }
  .search-input { flex:1; background:transparent; border:none; outline:none; color:var(--text); font-size:17px; padding:18px 20px; font-family:'DM Sans',sans-serif; }
  .search-input::placeholder { color:var(--muted); }
  .search-btn { display:block; width:100%; background:linear-gradient(135deg,var(--gold),var(--gold2)); border:none; color:#1A0F00; font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:0.15em; padding:14px; cursor:pointer; border-radius:0 0 8px 8px; transition:opacity 0.2s; }
  .search-btn:disabled { opacity:0.3; cursor:not-allowed; }
  .search-btn:not(:disabled):hover { opacity:0.9; }

  /* CHIPS */
  .chips-label { font-size:11px; color:var(--muted); letter-spacing:0.25em; text-transform:uppercase; margin:24px 0 10px; }
  .chips { display:flex; flex-wrap:wrap; gap:8px; }
  .chip { background:transparent; border:1px solid var(--border); color:var(--muted); font-size:13px; padding:6px 14px; border-radius:20px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
  .chip:hover { border-color:rgba(232,184,75,0.4); color:var(--gold); }

  /* RESULTS GRID */
  .results-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(145px,1fr)); gap:12px; margin-top:28px; animation:fadeUp 0.3s ease; }
  .result-card { background:var(--surface); border:1px solid var(--border); border-radius:8px; overflow:hidden; cursor:pointer; transition:all 0.2s; position:relative; }
  .result-card:hover { border-color:rgba(232,184,75,0.45); transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.5); }
  .result-card:hover .card-overlay { opacity:1; }
  .card-poster { width:100%; aspect-ratio:2/3; object-fit:cover; display:block; background:#1A1A24; }
  .card-no-poster { width:100%; aspect-ratio:2/3; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#1A1A24,#0F0F18); font-size:36px; }
  .card-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.92) 0%,transparent 55%); opacity:0; transition:opacity 0.2s; display:flex; align-items:flex-end; padding:10px; }
  .card-play { font-size:10px; color:var(--gold); letter-spacing:0.15em; text-transform:uppercase; font-family:'Bebas Neue',sans-serif; }
  .card-info { padding:10px; }
  .card-title { font-size:12px; font-weight:500; color:var(--text); line-height:1.3; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .card-meta { font-size:11px; color:var(--muted); display:flex; gap:6px; }
  .card-type { background:var(--dim); padding:2px 6px; border-radius:3px; text-transform:uppercase; letter-spacing:0.05em; font-size:9px; }

  /* DETAIL */
  .detail { animation:fadeUp 0.3s ease; }
  .back-btn { background:transparent; border:none; color:var(--muted); font-size:13px; cursor:pointer; padding:0 0 0 0; font-family:'DM Sans',sans-serif; display:inline-flex; align-items:center; gap:6px; margin-bottom:24px; transition:color 0.15s; }
  .back-btn:hover { color:var(--gold); }
  .detail-hero { display:flex; gap:24px; margin-bottom:36px; align-items:flex-start; }
  .detail-poster-wrap { width:130px; flex-shrink:0; border-radius:8px; overflow:hidden; border:1px solid var(--border); }
  .detail-poster-wrap img { width:100%; display:block; }
  .detail-no-poster { width:130px; height:195px; background:linear-gradient(135deg,#1A1A24,#0F0F18); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:36px; border:1px solid var(--border); }
  .detail-badge { display:inline-block; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold); border:1px solid rgba(232,184,75,0.3); padding:3px 8px; border-radius:3px; margin-bottom:8px; }
  .detail-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(1.6rem,5vw,2.8rem); letter-spacing:0.04em; line-height:1; color:var(--text); margin-bottom:8px; }
  .detail-meta-row { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:10px; }
  .detail-year { font-size:13px; color:var(--muted); }
  .detail-rating { font-size:13px; color:var(--gold); }
  .detail-overview { font-size:13px; color:var(--muted); line-height:1.65; }

  /* WHERE TO WATCH */
  .wtw-header { font-size:11px; letter-spacing:0.25em; text-transform:uppercase; color:var(--muted); padding-bottom:12px; border-bottom:1px solid var(--border); margin-bottom:20px; }
  .wtw-section { margin-bottom:32px; }
  .wtw-section-title { font-size:11px; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:14px; display:flex; align-items:center; gap:10px; font-weight:500; }
  .wtw-section-title::after { content:''; flex:1; height:1px; background:var(--border); }
  .wtw-section-title.stream { color:#4ADE80; }
  .wtw-section-title.free { color:#A78BFA; }
  .wtw-section-title.rent { color:#60A5FA; }
  .wtw-section-title.buy { color:#F59E0B; }

  .service-card { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:14px 16px; margin-bottom:10px; transition:border-color 0.15s; }
  .service-card:hover { border-color:rgba(232,184,75,0.2); }
  .service-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
  .service-logo { width:32px; height:32px; border-radius:6px; object-fit:cover; flex-shrink:0; }
  .service-logo-placeholder { width:32px; height:32px; border-radius:6px; background:var(--dim); display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
  .service-name { font-size:15px; font-weight:500; color:var(--text); }
  .service-country-count { font-size:11px; color:var(--muted); margin-left:auto; letter-spacing:0.05em; }
  .country-flags { display:flex; flex-wrap:wrap; gap:6px; }
  .country-tag { display:inline-flex; align-items:center; gap:4px; background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:3px 8px; font-size:12px; color:var(--muted); white-space:nowrap; }
  .country-flag { font-size:14px; line-height:1; }
  .country-tag-name { font-size:11px; }

  .no-streaming { text-align:center; padding:56px 20px; }
  .no-streaming-icon { font-size:40px; margin-bottom:16px; opacity:0.35; }
  .no-streaming-text { font-size:15px; color:var(--muted); margin-bottom:6px; }
  .no-streaming-sub { font-size:13px; color:var(--dim); line-height:1.6; }

  .justwatch-credit { font-size:11px; color:var(--dim); margin-top:20px; }

  /* LOADING */
  .loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:72px 20px; gap:14px; }
  .spinner { width:28px; height:28px; border:2px solid var(--border); border-top-color:var(--gold); border-radius:50%; animation:spin 0.75s linear infinite; }
  .loading-text { font-size:12px; color:var(--muted); letter-spacing:0.2em; text-transform:uppercase; }
  .no-results { text-align:center; padding:56px 20px; color:var(--muted); font-size:15px; }

  @keyframes spin { to { transform:rotate(360deg) } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
`;

export default function StreamFinder() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState(import.meta?.env?.VITE_TMDB_KEY || "5ee7fc70df94b20e745e775aaab33997");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [providerMap, setProviderMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [searched, setSearched] = useState(false);
  const searchRef = useRef(null);

  const api = useCallback(async (path) => {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`https://api.themoviedb.org/3${path}${sep}api_key=${savedKey}`);
    if (!res.ok) throw new Error("TMDB error");
    return res.json();
  }, [savedKey]);

  const search = async (q = query) => {
    if (!q.trim() || !savedKey) return;
    setLoading(true); setResults([]); setSelected(null); setProviderMap(null); setSearched(true);
    try {
      const data = await api(`/search/multi?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`);
      setResults((data.results || []).filter(r => r.media_type === "movie" || r.media_type === "tv").slice(0, 12));
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const selectTitle = async (item) => {
    setSelected(item); setLoadingProviders(true); setProviderMap(null);
    try {
      const type = item.media_type === "movie" ? "movie" : "tv";
      const data = await api(`/${type}/${item.id}/watch/providers?`);
      const raw = data.results || {};
      setProviderMap(buildProviderMap(raw));
    } catch { setProviderMap({}); }
    finally { setLoadingProviders(false); }
  };

  const handleKey = e => { if (e.key === "Enter") search(); };
  const saveKey = () => { if (apiKey.trim()) setSavedKey(apiKey.trim()); };
  const handleKeyKey = e => { if (e.key === "Enter") saveKey(); };

  const ServiceCard = ({ name, data }) => (
    <div className="service-card">
      <div className="service-header">
        {data.logo
          ? <img className="service-logo" src={`${IMG_BASE}w45${data.logo}`} alt={name} />
          : <div className="service-logo-placeholder">▶</div>
        }
        <span className="service-name">{name}</span>
        <span className="service-country-count">{data.countries.length} {data.countries.length === 1 ? "country" : "countries"}</span>
      </div>
      <div className="country-flags">
        {data.countries
          .sort((a, b) => (countryName(a)).localeCompare(countryName(b)))
          .map(code => (
            <span className="country-tag" key={code}>
              <span className="country-flag">{flag(code)}</span>
              <span className="country-tag-name">{countryName(code)}</span>
            </span>
          ))}
      </div>
    </div>
  );

  const WtwSection = ({ type, label, className }) => {
    if (!providerMap) return null;
    const entries = Object.entries(providerMap[type] || {});
    if (entries.length === 0) return null;
    return (
      <div className="wtw-section">
        <div className={`wtw-section-title ${className}`}>{label}</div>
        {entries.map(([name, data]) => <ServiceCard key={name} name={name} data={data} />)}
      </div>
    );
  };

  const hasAnyProviders = providerMap &&
    ["flatrate","free","ads","rent","buy"].some(t => Object.keys(providerMap[t] || {}).length > 0);

  // Key screen
  if (!savedKey) {
    return (
      <>
        <style>{css}</style>
        <div className="app">
          <div className="key-screen">
            <div className="key-icon">🎬</div>
            <h1 className="key-title">StreamFinder</h1>
            <p className="key-sub">Find any movie or TV show — see every platform it's on and every country it's available in, all on one page.</p>
            <div className="key-box">
              <div className="key-input-wrap">
                <input className="key-input" placeholder="Paste your free TMDB API key..." value={apiKey}
                  onChange={e => setApiKey(e.target.value)} onKeyDown={handleKeyKey} autoFocus type="password" />
                <button className="key-btn" onClick={saveKey}>GO</button>
              </div>
              <p className="key-note">Free at <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">themoviedb.org → Settings → API</a> — no credit card needed.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="main">

          {/* Header + Search */}
          <div className="header">
            <div className="header-top">
              <div className="logo">
                <div className="logo-dot" />
                <span className="logo-a">Stream</span>
                <span className="logo-b">Finder</span>
              </div>
              <button className="api-badge" onClick={() => { setSavedKey(""); setSelected(null); setResults([]); }}>⚙ API Key</button>
            </div>

            <div className="search-input-row">
              <input ref={searchRef} className="search-input" placeholder="Search any movie or TV show..." value={query}
                onChange={e => setQuery(e.target.value)} onKeyDown={handleKey} autoFocus />
            </div>
            <button className="search-btn" onClick={() => search()} disabled={!query.trim() || loading}>
              {loading ? "SEARCHING..." : "SEARCH"}
            </button>

            {!searched && (
              <>
                <div className="chips-label">Popular</div>
                <div className="chips">
                  {POPULAR.map(t => <button key={t} className="chip" onClick={() => { setQuery(t); search(t); }}>{t}</button>)}
                </div>
              </>
            )}
          </div>

          {/* Loading search */}
          {loading && <div className="loading"><div className="spinner" /><div className="loading-text">Searching titles...</div></div>}

          {/* Results grid */}
          {!loading && !selected && results.length > 0 && (
            <div className="results-grid">
              {results.map(item => {
                const title = item.title || item.name;
                const year = (item.release_date || item.first_air_date || "").split("-")[0];
                return (
                  <div key={item.id} className="result-card" onClick={() => selectTitle(item)}>
                    {item.poster_path
                      ? <img className="card-poster" src={`${IMG_BASE}w342${item.poster_path}`} alt={title} />
                      : <div className="card-no-poster">🎬</div>
                    }
                    <div className="card-overlay"><span className="card-play">▶ Where to Watch</span></div>
                    <div className="card-info">
                      <div className="card-title">{title}</div>
                      <div className="card-meta">
                        {year && <span>{year}</span>}
                        <span className="card-type">{item.media_type === "movie" ? "Film" : "TV"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && searched && !selected && results.length === 0 && (
            <div className="no-results">No titles found — try a different search.</div>
          )}

          {/* Detail view */}
          {selected && (
            <div className="detail">
              <button className="back-btn" onClick={() => { setSelected(null); setProviderMap(null); }}>← Back to results</button>

              {/* Hero */}
              <div className="detail-hero">
                {selected.poster_path
                  ? <div className="detail-poster-wrap"><img src={`${IMG_BASE}w342${selected.poster_path}`} alt="" /></div>
                  : <div className="detail-no-poster">🎬</div>
                }
                <div>
                  <div className="detail-badge">{selected.media_type === "movie" ? "Movie" : "TV Series"}</div>
                  <h2 className="detail-title">{selected.title || selected.name}</h2>
                  <div className="detail-meta-row">
                    <span className="detail-year">{((selected.release_date || selected.first_air_date) || "").split("-")[0]}</span>
                    {selected.vote_average > 0 && <span className="detail-rating">★ {selected.vote_average.toFixed(1)}</span>}
                  </div>
                  {selected.overview && (
                    <p className="detail-overview">
                      {selected.overview.length > 220 ? selected.overview.slice(0, 220) + "…" : selected.overview}
                    </p>
                  )}
                </div>
              </div>

              {/* Loading providers */}
              {loadingProviders && <div className="loading"><div className="spinner" /><div className="loading-text">Finding all streaming services...</div></div>}

              {/* Provider map */}
              {!loadingProviders && providerMap !== null && (
                <>
                  <div className="wtw-header">Where to watch — worldwide</div>

                  {hasAnyProviders ? (
                    <>
                      <WtwSection type="flatrate" label="Streaming (Subscription)" className="stream" />
                      <WtwSection type="free"     label="Free" className="free" />
                      <WtwSection type="ads"      label="Free with Ads" className="free" />
                      <WtwSection type="rent"     label="Rent" className="rent" />
                      <WtwSection type="buy"      label="Buy" className="buy" />
                      <div className="justwatch-credit">◆ Streaming data via JustWatch / TMDB</div>
                    </>
                  ) : (
                    <div className="no-streaming">
                      <div className="no-streaming-icon">📡</div>
                      <div className="no-streaming-text">Not available on any streaming service</div>
                      <div className="no-streaming-sub">This title may not be licensed for digital streaming yet,<br/>or may only be available on physical media.</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

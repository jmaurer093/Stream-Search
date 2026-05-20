import { useState, useRef, useEffect, useCallback } from "react";

const IMG_BASE = "https://image.tmdb.org/t/p/";

const COUNTRIES = [
  { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" }, { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" }, { code: "FR", name: "France" },
  { code: "ES", name: "Spain" }, { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" }, { code: "KR", name: "South Korea" },
  { code: "IN", name: "India" }, { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" }, { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" }, { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" }, { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" }, { code: "PT", name: "Portugal" },
  { code: "BE", name: "Belgium" }, { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" }, { code: "NZ", name: "New Zealand" },
  { code: "ZA", name: "South Africa" }, { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" }, { code: "CO", name: "Colombia" },
  { code: "TR", name: "Turkey" }, { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" }, { code: "TH", name: "Thailand" },
  { code: "PH", name: "Philippines" }, { code: "ID", name: "Indonesia" },
  { code: "RU", name: "Russia" }, { code: "IL", name: "Israel" },
  { code: "AE", name: "UAE" }, { code: "SA", name: "Saudi Arabia" },
];

const POPULAR = ["Severance", "The Bear", "Inception", "Breaking Bad", "Oppenheimer", "Shogun", "Interstellar", "The Office"];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0A0A0F;
    --surface: #13131A;
    --border: rgba(255,255,255,0.07);
    --gold: #E8B84B;
    --gold2: #C9962A;
    --text: #F0EBE3;
    --muted: #6B6575;
    --dim: #2A2830;
  }
  body { background: var(--bg); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--dim); border-radius: 2px; }

  .app { min-height: 100vh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); }

  /* KEY SETUP */
  .key-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; padding:40px 24px; text-align:center; }
  .key-icon { font-size:48px; margin-bottom:24px; filter:grayscale(0.3); }
  .key-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(2.5rem,8vw,5rem); letter-spacing:0.05em; color:var(--text); line-height:1; margin-bottom:8px; }
  .key-sub { color:var(--muted); font-size:15px; margin-bottom:40px; line-height:1.6; max-width:420px; }
  .key-box { width:100%; max-width:480px; }
  .key-input-wrap { display:flex; background:var(--surface); border:1px solid var(--border); border-radius:6px 6px 0 0; overflow:hidden; }
  .key-input { flex:1; background:transparent; border:none; outline:none; color:var(--text); font-size:15px; padding:16px 20px; font-family:'DM Sans',sans-serif; letter-spacing:0.05em; }
  .key-input::placeholder { color:var(--muted); letter-spacing:0; }
  .key-btn { background:linear-gradient(135deg,var(--gold),var(--gold2)); border:none; color:#1A0F00; font-family:'Bebas Neue',sans-serif; font-size:18px; letter-spacing:0.1em; padding:16px 28px; cursor:pointer; transition:opacity 0.2s; }
  .key-btn:hover { opacity:0.9; }
  .key-note { font-size:12px; color:var(--muted); margin-top:12px; }
  .key-note a { color:var(--gold); text-decoration:none; }
  .key-note a:hover { text-decoration:underline; }

  /* MAIN */
  .main { max-width:900px; margin:0 auto; padding:0 20px 80px; }

  /* HEADER */
  .header { padding:52px 0 40px; }
  .header-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; }
  .logo { display:flex; align-items:baseline; gap:6px; }
  .logo-stream { font-family:'Bebas Neue',sans-serif; font-size:clamp(2rem,5vw,3.2rem); letter-spacing:0.08em; color:var(--text); }
  .logo-finder { font-family:'Bebas Neue',sans-serif; font-size:clamp(2rem,5vw,3.2rem); letter-spacing:0.08em; color:var(--gold); }
  .logo-dot { width:8px; height:8px; background:var(--gold); border-radius:50%; margin-bottom:6px; flex-shrink:0; }
  .api-badge { font-size:11px; color:var(--muted); border:1px solid var(--border); padding:4px 10px; border-radius:20px; cursor:pointer; transition:all 0.2s; }
  .api-badge:hover { color:var(--gold); border-color:rgba(232,184,75,0.3); }

  /* SEARCH */
  .search-wrap { position:relative; }
  .search-row { display:flex; background:var(--surface); border:1px solid var(--border); border-radius:8px 8px 0 0; overflow:hidden; transition:border-color 0.2s; }
  .search-row:focus-within { border-color:rgba(232,184,75,0.35); }
  .search-input { flex:1; background:transparent; border:none; outline:none; color:var(--text); font-size:17px; padding:18px 20px; font-family:'DM Sans',sans-serif; }
  .search-input::placeholder { color:var(--muted); }
  .country-select { background:transparent; border:none; border-left:1px solid var(--border); outline:none; color:var(--muted); font-size:13px; padding:18px 14px; font-family:'DM Sans',sans-serif; cursor:pointer; min-width:150px; }
  .country-select option { background:#1A1A24; color:var(--text); }
  .search-btn { display:block; width:100%; background:linear-gradient(135deg,var(--gold),var(--gold2)); border:none; color:#1A0F00; font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:0.15em; padding:14px; cursor:pointer; border-radius:0 0 8px 8px; transition:opacity 0.2s; }
  .search-btn:hover:not(:disabled) { opacity:0.9; }
  .search-btn:disabled { opacity:0.35; cursor:not-allowed; }

  /* CHIPS */
  .chips-label { font-size:11px; color:var(--muted); letter-spacing:0.25em; text-transform:uppercase; margin:28px 0 10px; }
  .chips { display:flex; flex-wrap:wrap; gap:8px; }
  .chip { background:transparent; border:1px solid var(--border); color:var(--muted); font-size:13px; padding:6px 14px; border-radius:20px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
  .chip:hover { border-color:rgba(232,184,75,0.4); color:var(--gold); }

  /* RESULTS GRID */
  .results-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:14px; margin-top:28px; animation:fadeUp 0.3s ease; }
  .result-card { background:var(--surface); border:1px solid var(--border); border-radius:8px; overflow:hidden; cursor:pointer; transition:all 0.2s; position:relative; }
  .result-card:hover { border-color:rgba(232,184,75,0.4); transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.5); }
  .result-card:hover .card-overlay { opacity:1; }
  .card-poster { width:100%; aspect-ratio:2/3; object-fit:cover; display:block; background:#1E1E28; }
  .card-poster-placeholder { width:100%; aspect-ratio:2/3; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#1A1A24,#0F0F18); font-size:36px; }
  .card-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.9) 0%,transparent 50%); opacity:0; transition:opacity 0.2s; display:flex; align-items:flex-end; padding:10px; }
  .card-play { font-size:11px; color:var(--gold); letter-spacing:0.15em; text-transform:uppercase; font-family:'Bebas Neue',sans-serif; }
  .card-info { padding:10px; }
  .card-title { font-size:13px; font-weight:500; color:var(--text); line-height:1.3; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .card-meta { font-size:11px; color:var(--muted); display:flex; gap:6px; align-items:center; }
  .card-type { background:var(--dim); padding:2px 6px; border-radius:3px; text-transform:uppercase; letter-spacing:0.05em; font-size:9px; color:var(--muted); }

  /* DETAIL VIEW */
  .detail { animation:fadeUp 0.35s ease; }
  .back-btn { background:transparent; border:none; color:var(--muted); font-size:13px; cursor:pointer; padding:0; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:6px; margin-bottom:28px; transition:color 0.15s; letter-spacing:0.05em; }
  .back-btn:hover { color:var(--gold); }
  .detail-hero { display:flex; gap:28px; margin-bottom:36px; }
  .detail-poster { width:140px; flex-shrink:0; border-radius:8px; overflow:hidden; border:1px solid var(--border); }
  .detail-poster img { width:100%; display:block; }
  .detail-poster-placeholder { width:140px; height:210px; background:linear-gradient(135deg,#1A1A24,#0F0F18); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:40px; border:1px solid var(--border); }
  .detail-info { flex:1; }
  .detail-type-badge { display:inline-block; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold); border:1px solid rgba(232,184,75,0.3); padding:3px 8px; border-radius:3px; margin-bottom:10px; }
  .detail-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(1.8rem,5vw,3rem); letter-spacing:0.04em; line-height:1; color:var(--text); margin-bottom:10px; }
  .detail-meta { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-bottom:12px; }
  .detail-year { font-size:13px; color:var(--muted); }
  .detail-rating { font-size:13px; color:var(--gold); display:flex; align-items:center; gap:4px; }
  .detail-overview { font-size:14px; color:var(--muted); line-height:1.65; max-width:500px; }

  /* PROVIDERS */
  .providers-section { }
  .section-label { font-size:11px; color:var(--muted); letter-spacing:0.25em; text-transform:uppercase; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid var(--border); }
  .provider-group { margin-bottom:28px; }
  .group-title { font-size:12px; color:var(--muted); letter-spacing:0.2em; text-transform:uppercase; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
  .group-title::after { content:''; flex:1; height:1px; background:var(--border); }
  .group-title.stream { color:#4ADE80; }
  .group-title.rent { color:#60A5FA; }
  .group-title.buy { color:#F59E0B; }
  .group-title.free { color:#A78BFA; }
  .providers-row { display:flex; flex-wrap:wrap; gap:10px; }
  .provider-chip { display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:8px 14px; transition:all 0.15s; }
  .provider-chip:hover { border-color:rgba(232,184,75,0.25); background:#1A1A24; }
  .provider-logo { width:28px; height:28px; border-radius:4px; object-fit:cover; }
  .provider-name { font-size:13px; color:var(--text); font-weight:400; }
  .no-providers { text-align:center; padding:48px 20px; }
  .no-providers-icon { font-size:40px; margin-bottom:16px; opacity:0.4; }
  .no-providers-text { color:var(--muted); font-size:15px; margin-bottom:8px; }
  .no-providers-sub { color:var(--dim); font-size:13px; line-height:1.5; }
  .justwatch-note { font-size:11px; color:var(--dim); margin-top:24px; display:flex; align-items:center; gap:6px; }
  .justwatch-note a { color:var(--muted); text-decoration:none; }
  .justwatch-note a:hover { color:var(--gold); }
  .country-shown { display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--muted); background:var(--dim); padding:4px 10px; border-radius:20px; margin-bottom:20px; }

  /* LOADING */
  .loading { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 20px; gap:16px; }
  .spinner { width:32px; height:32px; border:2px solid var(--border); border-top-color:var(--gold); border-radius:50%; animation:spin 0.8s linear infinite; }
  .loading-text { font-size:13px; color:var(--muted); letter-spacing:0.2em; text-transform:uppercase; }

  /* NO RESULTS */
  .no-results { text-align:center; padding:60px 20px; color:var(--muted); font-size:15px; }

  @keyframes spin { to { transform:rotate(360deg) } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
`;

export default function StreamFinder() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState(import.meta.env.VITE_TMDB_KEY || "");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("US");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const searchRef = useRef(null);

  const api = useCallback(async (path) => {
    const res = await fetch(`https://api.themoviedb.org/3${path}&api_key=${savedKey}`);
    if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
    return res.json();
  }, [savedKey]);

  const search = async (q = query) => {
    if (!q.trim() || !savedKey) return;
    setLoading(true);
    setResults([]);
    setSelected(null);
    setProviders(null);
    setSearched(true);
    try {
      const data = await api(`/search/multi?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`);
      const filtered = (data.results || [])
        .filter(r => r.media_type === "movie" || r.media_type === "tv")
        .slice(0, 12);
      setResults(filtered);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const selectTitle = async (item) => {
    setSelected(item);
    setLoadingProviders(true);
    setProviders(null);
    try {
      const type = item.media_type === "movie" ? "movie" : "tv";
      const data = await api(`/${type}/${item.id}/watch/providers?`);
      setProviders(data.results || {});
    } catch (e) {
      setProviders({});
    } finally {
      setLoadingProviders(false);
    }
  };

  const countryProviders = providers ? (providers[country] || null) : null;
  const countryName = COUNTRIES.find(c => c.code === country)?.name || country;

  const handleKeyPress = (e) => { if (e.key === "Enter") search(); };
  const handleSaveKey = () => { if (apiKey.trim()) { setSavedKey(apiKey.trim()); setShowKeyInput(false); } };
  const handleKeyPressKey = (e) => { if (e.key === "Enter") handleSaveKey(); };

  const ProviderGroup = ({ items, label, className }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="provider-group">
        <div className={`group-title ${className}`}>{label}</div>
        <div className="providers-row">
          {items.map(p => (
            <div className="provider-chip" key={p.provider_id}>
              {p.logo_path
                ? <img className="provider-logo" src={`${IMG_BASE}w45${p.logo_path}`} alt={p.provider_name} />
                : <div style={{ width:28, height:28, background:"#2A2830", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#6B6575" }}>?</div>
              }
              <span className="provider-name">{p.provider_name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Key setup screen
  if (!savedKey && !showKeyInput) {
    return (
      <>
        <style>{css}</style>
        <div className="app">
          <div className="key-screen">
            <div className="key-icon">🎬</div>
            <h1 className="key-title">StreamFinder</h1>
            <p className="key-sub">
              Find exactly where any movie or TV show is streaming — across every platform and country. Free forever, powered by TMDB.
            </p>
            <div className="key-box">
              <div className="key-input-wrap">
                <input
                  className="key-input"
                  placeholder="Paste your free TMDB API key..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  onKeyDown={handleKeyPressKey}
                  autoFocus
                  type="password"
                />
                <button className="key-btn" onClick={handleSaveKey}>GO</button>
              </div>
              <p className="key-note">
                Get your free key at{" "}
                <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">themoviedb.org → Settings → API</a>
                {" "}— takes 2 minutes, no credit card.
              </p>
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
          <div className="header">
            <div className="header-top">
              <div className="logo">
                <div className="logo-dot" />
                <span className="logo-stream">Stream</span>
                <span className="logo-finder">Finder</span>
              </div>
              <button className="api-badge" onClick={() => { setShowKeyInput(true); setSavedKey(""); setSelected(null); setResults([]); }}>
                ⚙ API Key
              </button>
            </div>

            {/* Search */}
            <div className="search-wrap">
              <div className="search-row">
                <input
                  ref={searchRef}
                  className="search-input"
                  placeholder="Search any movie or TV show..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  autoFocus
                />
                <select
                  className="country-select"
                  value={country}
                  onChange={e => {
                    setCountry(e.target.value);
                    if (selected) selectTitle(selected);
                  }}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button
                className="search-btn"
                onClick={() => search()}
                disabled={!query.trim() || loading}
              >
                {loading ? "SEARCHING..." : "SEARCH"}
              </button>
            </div>

            {/* Chips */}
            {!searched && (
              <>
                <div className="chips-label">Popular</div>
                <div className="chips">
                  {POPULAR.map(t => (
                    <button key={t} className="chip" onClick={() => { setQuery(t); search(t); }}>{t}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="loading">
              <div className="spinner" />
              <div className="loading-text">Searching titles...</div>
            </div>
          )}

          {/* Search Results Grid */}
          {!loading && !selected && results.length > 0 && (
            <div className="results-grid">
              {results.map(item => {
                const title = item.title || item.name;
                const year = (item.release_date || item.first_air_date || "").split("-")[0];
                return (
                  <div key={item.id} className="result-card" onClick={() => selectTitle(item)}>
                    {item.poster_path
                      ? <img className="card-poster" src={`${IMG_BASE}w342${item.poster_path}`} alt={title} />
                      : <div className="card-poster-placeholder">🎬</div>
                    }
                    <div className="card-overlay"><span className="card-play">▶ Where to Watch</span></div>
                    <div className="card-info">
                      <div className="card-title">{title}</div>
                      <div className="card-meta">
                        {year && <span className="card-year">{year}</span>}
                        <span className="card-type">{item.media_type === "movie" ? "Film" : "TV"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No results */}
          {!loading && searched && !selected && results.length === 0 && (
            <div className="no-results">No titles found. Try a different search.</div>
          )}

          {/* Detail / Providers */}
          {selected && (
            <div className="detail">
              <button className="back-btn" onClick={() => { setSelected(null); setProviders(null); }}>
                ← Back to results
              </button>

              {/* Hero */}
              <div className="detail-hero">
                {selected.poster_path
                  ? <div className="detail-poster"><img src={`${IMG_BASE}w342${selected.poster_path}`} alt="" /></div>
                  : <div className="detail-poster-placeholder">🎬</div>
                }
                <div className="detail-info">
                  <div className="detail-type-badge">{selected.media_type === "movie" ? "Movie" : "TV Series"}</div>
                  <h2 className="detail-title">{selected.title || selected.name}</h2>
                  <div className="detail-meta">
                    <span className="detail-year">
                      {((selected.release_date || selected.first_air_date) || "").split("-")[0]}
                    </span>
                    {selected.vote_average > 0 && (
                      <span className="detail-rating">★ {selected.vote_average.toFixed(1)}</span>
                    )}
                  </div>
                  {selected.overview && (
                    <p className="detail-overview">{selected.overview.length > 200 ? selected.overview.slice(0, 200) + "..." : selected.overview}</p>
                  )}
                </div>
              </div>

              {/* Providers */}
              {loadingProviders && (
                <div className="loading">
                  <div className="spinner" />
                  <div className="loading-text">Finding streaming services...</div>
                </div>
              )}

              {!loadingProviders && providers !== null && (
                <div className="providers-section">
                  <div className="section-label">Where to watch</div>
                  <div className="country-shown">
                    📍 {countryName}
                    <select
                      style={{ background:"transparent", border:"none", outline:"none", color:"#E8B84B", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
                      value={country}
                      onChange={e => { setCountry(e.target.value); selectTitle(selected); }}
                    >
                      {COUNTRIES.map(c => <option key={c.code} value={c.code} style={{ background:"#1A1A24" }}>{c.name}</option>)}
                    </select>
                  </div>

                  {countryProviders ? (
                    <>
                      <ProviderGroup items={countryProviders.flatrate} label="Streaming (Subscription)" className="stream" />
                      <ProviderGroup items={countryProviders.free} label="Free" className="free" />
                      <ProviderGroup items={countryProviders.ads} label="Free with Ads" className="free" />
                      <ProviderGroup items={countryProviders.rent} label="Rent" className="rent" />
                      <ProviderGroup items={countryProviders.buy} label="Buy" className="buy" />
                      <div className="justwatch-note">
                        ◆ Data provided by{" "}
                        <a href={countryProviders.link} target="_blank" rel="noreferrer">JustWatch via TMDB</a>
                      </div>
                    </>
                  ) : (
                    <div className="no-providers">
                      <div className="no-providers-icon">📡</div>
                      <div className="no-providers-text">Not available in {countryName}</div>
                      <div className="no-providers-sub">
                        Try switching to a different country above — it may be streaming elsewhere.
                      </div>
                      {Object.keys(providers).length > 0 && (
                        <div style={{ marginTop:16, fontSize:13, color:"#6B6575" }}>
                          Available in:{" "}
                          {Object.keys(providers)
                            .map(code => COUNTRIES.find(c => c.code === code)?.name || code)
                            .slice(0, 8)
                            .join(", ")}
                          {Object.keys(providers).length > 8 && ` +${Object.keys(providers).length - 8} more`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

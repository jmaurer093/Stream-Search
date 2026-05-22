import { useState, useRef, useCallback, useEffect, useMemo } from "react";

const IMG_BASE = "https://image.tmdb.org/t/p/";
const VPN_AFFILIATE_URL = "https://your-vpn-affiliate-link.com";
const VPN_NAME = "NordVPN";

// Provider IDs for streaming filter
const STREAMING_SERVICES = [
  { id: "", name: "All Services" },
  { id: "8", name: "Netflix" },
  { id: "15", name: "Hulu" },
  { id: "9", name: "Amazon Prime" },
  { id: "337", name: "Disney+" },
  { id: "1899", name: "Max" },
  { id: "350", name: "Apple TV+" },
  { id: "386", name: "Peacock" },
  { id: "531", name: "Paramount+" },
];

const COUNTRY_NAMES = {
  US:"United States",GB:"United Kingdom",CA:"Canada",AU:"Australia",DE:"Germany",
  FR:"France",ES:"Spain",IT:"Italy",JP:"Japan",KR:"South Korea",IN:"India",
  BR:"Brazil",MX:"Mexico",NL:"Netherlands",SE:"Sweden",NO:"Norway",DK:"Denmark",
  FI:"Finland",PL:"Poland",PT:"Portugal",BE:"Belgium",CH:"Switzerland",AT:"Austria",
  NZ:"New Zealand",ZA:"South Africa",AR:"Argentina",CL:"Chile",CO:"Colombia",
  TR:"Turkey",SG:"Singapore",HK:"Hong Kong",TH:"Thailand",PH:"Philippines",
  ID:"Indonesia",RU:"Russia",IL:"Israel",AE:"UAE",SA:"Saudi Arabia",CZ:"Czech Republic",
  HU:"Hungary",RO:"Romania",GR:"Greece",IE:"Ireland",MY:"Malaysia",TW:"Taiwan",
  PE:"Peru",EC:"Ecuador",VE:"Venezuela",IS:"Iceland",
};

const MOVIE_GENRES = [
  {id:28,name:"Action"},{id:12,name:"Adventure"},{id:16,name:"Animation"},
  {id:35,name:"Comedy"},{id:80,name:"Crime"},{id:99,name:"Documentary"},
  {id:18,name:"Drama"},{id:10751,name:"Family"},{id:14,name:"Fantasy"},
  {id:36,name:"History"},{id:27,name:"Horror"},{id:10402,name:"Music"},
  {id:9648,name:"Mystery"},{id:10749,name:"Romance"},{id:878,name:"Sci-Fi"},
  {id:53,name:"Thriller"},{id:10752,name:"War"},{id:37,name:"Western"},
];

const TV_GENRES = [
  {id:10759,name:"Action & Adventure"},{id:16,name:"Animation"},{id:35,name:"Comedy"},
  {id:80,name:"Crime"},{id:99,name:"Documentary"},{id:18,name:"Drama"},
  {id:10751,name:"Family"},{id:10762,name:"Kids"},{id:9648,name:"Mystery"},
  {id:10764,name:"Reality"},{id:10765,name:"Sci-Fi & Fantasy"},{id:10768,name:"War & Politics"},
];

const POPULAR = ["Severance","The Bear","Inception","Breaking Bad","Oppenheimer","Shogun","Interstellar","The Office"];

const flag = code => code.toUpperCase().replace(/./g,c=>String.fromCodePoint(c.charCodeAt(0)+127397));
const countryName = code => COUNTRY_NAMES[code]||code;

function buildProviderMap(raw) {
  const types=["flatrate","free","ads","rent","buy"], map={};
  types.forEach(t=>map[t]={});
  Object.entries(raw).forEach(([code,data])=>{
    if(code==="link") return;
    types.forEach(type=>{
      (data[type]||[]).forEach(p=>{
        if(!map[type][p.provider_name]) map[type][p.provider_name]={logo:p.logo_path,id:p.provider_id,countries:[]};
        map[type][p.provider_name].countries.push(code);
      });
    });
  });
  types.forEach(t=>{map[t]=Object.fromEntries(Object.entries(map[t]).sort((a,b)=>b[1].countries.length-a[1].countries.length));});
  return map;
}

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(()=>{
    try { const s=localStorage.getItem(key); return s?JSON.parse(s):initial; } catch { return initial; }
  });
  const set = useCallback(v=>{
    setVal(v);
    try { localStorage.setItem(key,JSON.stringify(v)); } catch {}
  },[key]);
  return [val,set];
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(()=>{
    const t=setTimeout(()=>setDebounced(value),delay);
    return ()=>clearTimeout(t);
  },[value,delay]);
  return debounced;
}

// Hash-based routing
function useRoute() {
  const getRoute = () => {
    const hash = window.location.hash.replace("#","");
    if(hash.startsWith("/title/")) {
      const parts = hash.split("/");
      return { page:"title", mediaType:parts[2], id:parts[3] };
    }
    if(hash.startsWith("/person/")) {
      return { page:"person", id:hash.split("/")[2] };
    }
    return { page:"home" };
  };
  const [route, setRoute] = useState(getRoute);
  useEffect(()=>{
    const handler=()=>setRoute(getRoute());
    window.addEventListener("hashchange",handler);
    return ()=>window.removeEventListener("hashchange",handler);
  },[]);
  const navigate = (r) => {
    if(r.page==="title") window.location.hash=`/title/${r.mediaType}/${r.id}`;
    else if(r.page==="person") window.location.hash=`/person/${r.id}`;
    else window.location.hash="";
  };
  return [route, navigate];
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#0A0A0F;--surface:#13131A;--surface2:#1A1A24;--surface3:#22222E;
    --border:rgba(255,255,255,0.07);--gold:#E8B84B;--gold2:#C9962A;
    --text:#F0EBE3;--muted:#6B6575;--dim:#2A2830;
    --vpn:#22C55E;--vpn2:#16A34A;--red:#EF4444;--blue:#60A5FA;
  }
  body{background:var(--bg);min-height:100vh;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:var(--dim);border-radius:2px;}
  .app{min-height:100vh;background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--text);display:flex;flex-direction:column;}
  .main{max-width:900px;width:100%;margin:0 auto;padding:0 20px 80px;flex:1;}

  /* VPN BANNER */
  .vpn-header-bar{background:linear-gradient(90deg,rgba(34,197,94,0.12),rgba(34,197,94,0.06));border-bottom:1px solid rgba(34,197,94,0.2);padding:9px 20px;text-align:center;}
  .vpn-header-bar a{display:inline-flex;align-items:center;gap:8px;color:var(--vpn);text-decoration:none;font-size:13px;font-weight:500;transition:opacity 0.2s;}
  .vpn-header-bar a:hover{opacity:0.8;}
  .vpn-header-bar strong{color:#fff;}
  .vpn-pill{background:var(--vpn);color:#000;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:2px 8px;border-radius:20px;}

  /* HEADER */
  .header-top{display:flex;align-items:center;justify-content:space-between;padding:28px 0 20px;}
  .logo{display:flex;align-items:baseline;gap:0;cursor:pointer;}
  .logo-dot{width:7px;height:7px;background:var(--gold);border-radius:50%;margin-bottom:4px;flex-shrink:0;margin-right:5px;}
  .logo-a{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.4rem,4vw,2.2rem);letter-spacing:0.06em;color:var(--text);}
  .logo-b{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.4rem,4vw,2.2rem);letter-spacing:0.06em;color:var(--gold);}
  .logo-c{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.4rem,4vw,2.2rem);letter-spacing:0.06em;color:var(--muted);}
  .header-actions{display:flex;gap:8px;align-items:center;}
  .header-list-btn{background:transparent;border:1px solid var(--border);color:var(--muted);font-size:12px;padding:5px 12px;border-radius:20px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;display:flex;align-items:center;gap:5px;}
  .header-list-btn:hover{color:var(--gold);border-color:rgba(232,184,75,0.35);}
  .header-list-badge{background:var(--gold);color:#000;font-size:9px;font-weight:700;padding:1px 5px;border-radius:10px;}

  /* TABS */
  .tabs{display:flex;border-bottom:1px solid var(--border);margin-bottom:24px;overflow-x:auto;}
  .tab{background:transparent;border:none;border-bottom:2px solid transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;padding:10px 16px;cursor:pointer;transition:all 0.2s;margin-bottom:-1px;white-space:nowrap;flex-shrink:0;}
  .tab:hover{color:var(--text);}
  .tab.active{color:var(--gold);border-bottom-color:var(--gold);}
  .tab.vpn-tab.active{color:var(--vpn);border-bottom-color:var(--vpn);}

  /* SEARCH */
  .search-wrap{position:relative;margin-bottom:0;}
  .search-input-row{display:flex;background:var(--surface);border:1px solid var(--border);border-radius:8px 8px 0 0;overflow:hidden;transition:border-color 0.2s;}
  .search-input-row:focus-within{border-color:rgba(232,184,75,0.4);}
  .search-input{flex:1;background:transparent;border:none;outline:none;color:var(--text);font-size:17px;padding:17px 20px;font-family:'DM Sans',sans-serif;}
  .search-input::placeholder{color:var(--muted);}
  .search-clear{background:transparent;border:none;color:var(--muted);font-size:18px;padding:0 16px;cursor:pointer;line-height:1;}
  .search-btn{display:block;width:100%;background:linear-gradient(135deg,var(--gold),var(--gold2));border:none;color:#1A0F00;font-family:'Bebas Neue',sans-serif;font-size:19px;letter-spacing:0.15em;padding:13px;cursor:pointer;border-radius:0 0 8px 8px;transition:opacity 0.2s;}
  .search-btn:disabled{opacity:0.3;cursor:not-allowed;}
  .search-btn:not(:disabled):hover{opacity:0.9;}

  /* SUGGESTIONS DROPDOWN */
  .suggestions{position:absolute;top:58px;left:0;right:0;background:var(--surface2);border:1px solid rgba(232,184,75,0.25);border-top:none;border-radius:0 0 8px 8px;z-index:100;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6);}
  .suggestion-item{display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;transition:background 0.15s;}
  .suggestion-item:hover{background:var(--surface3);}
  .suggestion-poster{width:32px;height:48px;border-radius:3px;object-fit:cover;flex-shrink:0;background:var(--dim);}
  .suggestion-poster-ph{width:32px;height:48px;border-radius:3px;background:var(--dim);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
  .suggestion-info{flex:1;min-width:0;}
  .suggestion-title{font-size:14px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .suggestion-meta{font-size:11px;color:var(--muted);display:flex;gap:6px;margin-top:2px;}
  .suggestion-type{background:var(--dim);padding:1px 5px;border-radius:3px;font-size:9px;text-transform:uppercase;}

  /* CHIPS */
  .chips-label{font-size:11px;color:var(--muted);letter-spacing:0.25em;text-transform:uppercase;margin:20px 0 10px;}
  .chips{display:flex;flex-wrap:wrap;gap:8px;}
  .chip{background:transparent;border:1px solid var(--border);color:var(--muted);font-size:13px;padding:5px 13px;border-radius:20px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s;}
  .chip:hover{border-color:rgba(232,184,75,0.4);color:var(--gold);}

  /* RESULTS */
  .results-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:24px;animation:fadeUp 0.3s ease;}
  .result-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;cursor:pointer;transition:all 0.2s;position:relative;}
  .result-card:hover{border-color:rgba(232,184,75,0.45);transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.5);}
  .result-card:hover .card-overlay{opacity:1;}
  .card-poster{width:100%;aspect-ratio:2/3;object-fit:cover;display:block;background:#1A1A24;}
  .card-no-poster{width:100%;aspect-ratio:2/3;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1A1A24,#0F0F18);font-size:32px;}
  .card-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.92) 0%,transparent 55%);opacity:0;transition:opacity 0.2s;display:flex;align-items:flex-end;padding:10px;}
  .card-play{font-size:10px;color:var(--gold);letter-spacing:0.12em;text-transform:uppercase;font-family:'Bebas Neue',sans-serif;}
  .card-info{padding:9px;}
  .card-title{font-size:12px;font-weight:500;color:var(--text);line-height:1.3;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .card-meta{font-size:11px;color:var(--muted);display:flex;gap:5px;flex-wrap:wrap;}
  .card-type{background:var(--dim);padding:1px 5px;border-radius:3px;text-transform:uppercase;letter-spacing:0.05em;font-size:9px;}
  .card-list-btn{position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.15);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;transition:all 0.2s;opacity:0;}
  .result-card:hover .card-list-btn{opacity:1;}
  .card-list-btn.active{opacity:1;background:rgba(232,184,75,0.2);border-color:rgba(232,184,75,0.5);}
  .card-list-btn:hover{background:rgba(232,184,75,0.3)!important;}

  /* DISCOVER FORM */
  .discover-form{display:flex;flex-direction:column;gap:14px;}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  @media(max-width:500px){.form-row{grid-template-columns:1fr;}}
  .field-label{font-size:11px;color:var(--muted);letter-spacing:0.2em;text-transform:uppercase;margin-bottom:5px;}
  .field-input{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:14px;padding:11px 13px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.2s;}
  .field-input:focus{border-color:rgba(232,184,75,0.4);}
  .field-input::placeholder{color:var(--muted);}
  .field-select{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:14px;padding:11px 13px;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer;transition:border-color 0.2s;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B6575' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;}
  .field-select:focus{border-color:rgba(232,184,75,0.4);}
  .field-select option{background:#1A1A24;}
  .media-toggle{display:flex;background:var(--surface);border:1px solid var(--border);border-radius:6px;overflow:hidden;}
  .media-btn{flex:1;background:transparent;border:none;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:13px;padding:10px;cursor:pointer;transition:all 0.2s;}
  .media-btn.active{background:var(--surface2);color:var(--gold);}
  .awards-toggle{display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:12px 14px;cursor:pointer;transition:border-color 0.2s;}
  .awards-toggle.on{border-color:rgba(232,184,75,0.5);background:rgba(232,184,75,0.06);}
  .toggle-switch{width:34px;height:19px;border-radius:10px;background:var(--dim);position:relative;transition:background 0.2s;flex-shrink:0;}
  .toggle-switch.on{background:var(--gold2);}
  .toggle-knob{width:13px;height:13px;border-radius:50%;background:white;position:absolute;top:3px;left:3px;transition:transform 0.2s;}
  .toggle-switch.on .toggle-knob{transform:translateX(15px);}
  .awards-label{font-size:13px;color:var(--text);}
  .awards-sub{font-size:11px;color:var(--muted);margin-top:1px;}

  /* DETAIL */
  .detail{animation:fadeUp 0.3s ease;}
  .back-btn{background:transparent;border:none;color:var(--muted);font-size:13px;cursor:pointer;padding:0;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;margin-bottom:20px;transition:color 0.15s;}
  .back-btn:hover{color:var(--gold);}
  .detail-hero{display:flex;gap:22px;margin-bottom:24px;align-items:flex-start;}
  .detail-poster-wrap{width:120px;flex-shrink:0;border-radius:8px;overflow:hidden;border:1px solid var(--border);}
  .detail-poster-wrap img{width:100%;display:block;}
  .detail-no-poster{width:120px;height:180px;background:linear-gradient(135deg,#1A1A24,#0F0F18);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:32px;border:1px solid var(--border);}
  .detail-badge{display:inline-block;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);border:1px solid rgba(232,184,75,0.3);padding:2px 7px;border-radius:3px;margin-bottom:7px;}
  .detail-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.5rem,5vw,2.6rem);letter-spacing:0.04em;line-height:1;color:var(--text);margin-bottom:7px;}
  .detail-meta-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px;}
  .detail-year{font-size:13px;color:var(--muted);}
  .detail-rating{font-size:13px;color:var(--gold);}
  .detail-overview{font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:14px;}
  .detail-actions{display:flex;gap:8px;flex-wrap:wrap;}
  .action-btn{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-family:'DM Sans',sans-serif;padding:8px 14px;border-radius:6px;cursor:pointer;border:1px solid var(--border);background:var(--surface2);color:var(--text);transition:all 0.2s;font-weight:500;}
  .action-btn:hover{border-color:rgba(232,184,75,0.35);color:var(--gold);}
  .action-btn.active{border-color:rgba(232,184,75,0.5);color:var(--gold);background:rgba(232,184,75,0.08);}
  .action-btn.trailer{background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.3);color:#F87171;}
  .action-btn.trailer:hover{background:rgba(239,68,68,0.2);}
  .share-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--surface2);border:1px solid rgba(232,184,75,0.3);color:var(--gold);font-size:13px;padding:10px 20px;border-radius:20px;z-index:999;animation:fadeUp 0.3s ease;}

  /* TRAILER MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease;}
  .modal-content{width:100%;max-width:800px;background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;}
  .modal-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);}
  .modal-title{font-size:15px;font-weight:500;color:var(--text);}
  .modal-close{background:transparent;border:none;color:var(--muted);font-size:22px;cursor:pointer;line-height:1;transition:color 0.15s;}
  .modal-close:hover{color:var(--text);}
  .modal-video{aspect-ratio:16/9;width:100%;}
  .modal-video iframe{width:100%;height:100%;border:none;}

  /* CAST */
  .section-title{font-size:11px;color:var(--muted);letter-spacing:0.25em;text-transform:uppercase;padding-bottom:10px;border-bottom:1px solid var(--border);margin-bottom:16px;}
  .cast-row{display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;}
  .cast-row::-webkit-scrollbar{height:3px;}
  .cast-row::-webkit-scrollbar-thumb{background:var(--dim);}
  .cast-card{flex-shrink:0;width:88px;cursor:pointer;transition:transform 0.2s;}
  .cast-card:hover{transform:translateY(-2px);}
  .cast-photo{width:88px;height:110px;border-radius:6px;object-fit:cover;background:var(--surface2);display:block;border:1px solid var(--border);}
  .cast-photo-ph{width:88px;height:110px;border-radius:6px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:28px;border:1px solid var(--border);}
  .cast-name{font-size:11px;color:var(--text);margin-top:5px;line-height:1.3;text-align:center;}
  .cast-char{font-size:10px;color:var(--muted);margin-top:2px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .crew-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;}
  .crew-card{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:10px 12px;cursor:pointer;transition:border-color 0.15s;}
  .crew-card:hover{border-color:rgba(232,184,75,0.3);}
  .crew-name{font-size:13px;color:var(--text);font-weight:500;}
  .crew-job{font-size:11px;color:var(--muted);margin-top:2px;}

  /* PERSON PAGE */
  .person-hero{display:flex;gap:20px;margin-bottom:28px;align-items:flex-start;}
  .person-photo{width:100px;height:150px;border-radius:8px;object-fit:cover;border:1px solid var(--border);flex-shrink:0;}
  .person-photo-ph{width:100px;height:150px;border-radius:8px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:36px;border:1px solid var(--border);flex-shrink:0;}
  .person-name{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.5rem,5vw,2.4rem);letter-spacing:0.05em;color:var(--text);margin-bottom:6px;}
  .person-bio{font-size:13px;color:var(--muted);line-height:1.65;}

  /* WHERE TO WATCH */
  .wtw-header{font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:var(--muted);padding-bottom:10px;border-bottom:1px solid var(--border);margin-bottom:18px;}
  .wtw-section{margin-bottom:28px;}
  .wtw-section-title{font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:10px;font-weight:500;}
  .wtw-section-title::after{content:'';flex:1;height:1px;background:var(--border);}
  .wtw-section-title.stream{color:#4ADE80;}
  .wtw-section-title.free{color:#A78BFA;}
  .wtw-section-title.rent{color:#60A5FA;}
  .wtw-section-title.buy{color:#F59E0B;}
  .service-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:9px;transition:border-color 0.15s;}
  .service-card:hover{border-color:rgba(232,184,75,0.2);}
  .service-header{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
  .service-logo{width:30px;height:30px;border-radius:5px;object-fit:cover;flex-shrink:0;}
  .service-logo-ph{width:30px;height:30px;border-radius:5px;background:var(--dim);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;}
  .service-name{font-size:14px;font-weight:500;color:var(--text);}
  .service-count{font-size:11px;color:var(--muted);margin-left:auto;}
  .country-flags{display:flex;flex-wrap:wrap;gap:5px;}
  .country-tag{display:inline-flex;align-items:center;gap:4px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:2px 7px;font-size:12px;color:var(--muted);white-space:nowrap;}
  .country-flag-em{font-size:13px;line-height:1;}
  .country-tag-name{font-size:11px;}
  .no-streaming{text-align:center;padding:48px 20px;}
  .no-streaming-icon{font-size:40px;margin-bottom:14px;opacity:0.3;}
  .no-streaming-text{font-size:15px;color:var(--muted);margin-bottom:5px;}
  .no-streaming-sub{font-size:13px;color:var(--dim);line-height:1.6;}
  .justwatch-credit{font-size:11px;color:var(--dim);margin-top:16px;}

  /* MY LIST / WATCHLIST */
  .list-page{animation:fadeUp 0.3s ease;}
  .list-tabs{display:flex;gap:8px;margin-bottom:20px;}
  .list-tab{background:var(--surface);border:1px solid var(--border);color:var(--muted);font-size:12px;padding:7px 16px;border-radius:20px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s;}
  .list-tab.active{border-color:rgba(232,184,75,0.5);color:var(--gold);background:rgba(232,184,75,0.06);}
  .empty-list{text-align:center;padding:60px 20px;}
  .empty-icon{font-size:40px;margin-bottom:14px;opacity:0.3;}
  .empty-text{font-size:15px;color:var(--muted);}

  /* VPN PAGE */
  .vpn-page{animation:fadeUp 0.3s ease;}
  .vpn-hero{background:linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.04));border:1px solid rgba(34,197,94,0.25);border-radius:12px;padding:32px;text-align:center;margin-bottom:24px;}
  .vpn-hero-icon{font-size:44px;margin-bottom:14px;}
  .vpn-hero-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.8rem,5vw,3rem);letter-spacing:0.06em;color:var(--text);margin-bottom:10px;}
  .vpn-hero-sub{color:var(--muted);font-size:14px;line-height:1.65;max-width:500px;margin:0 auto 24px;}
  .vpn-cta-btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--vpn),var(--vpn2));color:#000;font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:0.12em;padding:14px 36px;border-radius:8px;text-decoration:none;transition:opacity 0.2s;}
  .vpn-cta-btn:hover{opacity:0.9;}
  .vpn-cta-sub{font-size:11px;color:rgba(34,197,94,0.4);margin-top:8px;}
  .vpn-reasons{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-bottom:24px;}
  .vpn-reason{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;}
  .vpn-reason-icon{font-size:22px;margin-bottom:7px;}
  .vpn-reason-title{font-size:13px;font-weight:500;color:var(--text);margin-bottom:3px;}
  .vpn-reason-text{font-size:12px;color:var(--muted);line-height:1.5;}
  .vpn-bottom-cta{background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:16px;}
  .vpn-bottom-text{font-size:14px;color:var(--text);}
  .vpn-bottom-text span{color:var(--vpn);font-weight:500;}
  .vpn-bottom-btn{display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,var(--vpn),var(--vpn2));color:#000;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:0.1em;padding:10px 24px;border-radius:6px;text-decoration:none;transition:opacity 0.2s;white-space:nowrap;}
  .vpn-bottom-btn:hover{opacity:0.9;}
  .vpn-disclaimer{font-size:11px;color:var(--dim);line-height:1.6;}
  .vpn-why-title{font-size:11px;color:var(--muted);letter-spacing:0.25em;text-transform:uppercase;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border);}

  /* UTIL */
  .loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 20px;gap:12px;}
  .spinner{width:26px;height:26px;border:2px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin 0.75s linear infinite;}
  .loading-text{font-size:12px;color:var(--muted);letter-spacing:0.2em;text-transform:uppercase;}
  .no-results{text-align:center;padding:48px 20px;color:var(--muted);font-size:15px;}
  .section-gap{margin-top:32px;}
  .key-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:40px 24px;text-align:center;}
  .key-icon{font-size:48px;margin-bottom:20px;}
  .key-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,8vw,4.5rem);letter-spacing:0.05em;color:var(--text);line-height:1;margin-bottom:7px;}
  .key-sub{color:var(--muted);font-size:15px;margin-bottom:36px;line-height:1.6;max-width:400px;}
  .key-box{width:100%;max-width:460px;}
  .key-input-wrap{display:flex;background:var(--surface);border:1px solid var(--border);border-radius:6px 6px 0 0;overflow:hidden;}
  .key-input{flex:1;background:transparent;border:none;outline:none;color:var(--text);font-size:15px;padding:15px 18px;font-family:'DM Sans',sans-serif;}
  .key-input::placeholder{color:var(--muted);}
  .key-btn{background:linear-gradient(135deg,var(--gold),var(--gold2));border:none;color:#1A0F00;font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:0.1em;padding:15px 26px;cursor:pointer;}
  .key-note{font-size:12px;color:var(--muted);margin-top:10px;}
  .key-note a{color:var(--gold);text-decoration:none;}

  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
`;

export default function SearchSeekStream() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState(import.meta?.env?.VITE_TMDB_KEY || "");
  const [route, navigate] = useRoute();
  const [activeTab, setActiveTab] = useState("search");

  // Search
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debouncedQuery = useDebounce(query, 320);

  // Discover
  const [mediaType, setMediaType] = useState("movie");
  const [director, setDirector] = useState("");
  const [actor, setActor] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [country, setCountry] = useState("US");
  const [streamService, setStreamService] = useState("");
  const [awardsOnly, setAwardsOnly] = useState(false);
  const [discoverResults, setDiscoverResults] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverSearched, setDiscoverSearched] = useState(false);

  // Detail
  const [detailData, setDetailData] = useState(null);
  const [providerMap, setProviderMap] = useState(null);
  const [cast, setCast] = useState([]);
  const [crew, setCrew] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Person
  const [personData, setPersonData] = useState(null);
  const [personCredits, setPersonCredits] = useState([]);
  const [personLoading, setPersonLoading] = useState(false);

  // Lists
  const [myList, setMyList] = useLocalStorage("sss_mylist", []);
  const [watchlist, setWatchlist] = useLocalStorage("sss_watchlist", []);
  const [listSubTab, setListSubTab] = useState("mylist");

  // My list tab
  const [listsTab, setListsTab] = useState(false);

  const searchRef = useRef(null);

  const api = useCallback(async (path) => {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`https://api.themoviedb.org/3${path}${sep}api_key=${savedKey}`);
    if (!res.ok) throw new Error("TMDB");
    return res.json();
  }, [savedKey]);

  // Debounced suggestions
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2 || !savedKey) { setSuggestions([]); return; }
    api(`/search/multi?query=${encodeURIComponent(debouncedQuery)}&include_adult=false&page=1`)
      .then(d => setSuggestions((d.results||[]).filter(r=>r.media_type==="movie"||r.media_type==="tv").slice(0,6)))
      .catch(()=>setSuggestions([]));
  }, [debouncedQuery, api, savedKey]);

  // Load detail from route
  useEffect(() => {
    if (route.page === "title" && route.id) {
      loadDetail(route.mediaType, route.id);
    } else if (route.page === "person" && route.id) {
      loadPerson(route.id);
    }
  }, [route]);

  const loadDetail = async (type, id) => {
    setDetailLoading(true); setDetailData(null); setProviderMap(null); setCast([]); setCrew([]); setTrailer(null);
    try {
      const [detail, providers, credits, videos] = await Promise.all([
        api(`/${type}/${id}?language=en-US`),
        api(`/${type}/${id}/watch/providers?`),
        api(`/${type}/${id}/credits?language=en-US`),
        api(`/${type}/${id}/videos?language=en-US`),
      ]);
      setDetailData({ ...detail, media_type: type });
      setProviderMap(buildProviderMap(providers.results || {}));
      setCast((credits.cast || []).slice(0, 20));
      const directors = (credits.crew || []).filter(c => c.job === "Director" || c.job === "Creator" || c.department === "Directing").slice(0, 8);
      const writers = (credits.crew || []).filter(c => c.department === "Writing").slice(0, 4);
      setCrew([...directors, ...writers]);
      const yt = (videos.results || []).find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
      setTrailer(yt || null);
    } catch {}
    finally { setDetailLoading(false); }
  };

  const loadPerson = async (id) => {
    setPersonLoading(true); setPersonData(null); setPersonCredits([]);
    try {
      const [person, credits] = await Promise.all([
        api(`/person/${id}?language=en-US`),
        api(`/person/${id}/combined_credits?language=en-US`),
      ]);
      setPersonData(person);
      const all = [...(credits.cast||[]),...(credits.crew||[])]
        .filter((v,i,a) => a.findIndex(x=>x.id===v.id)===i)
        .filter(c => c.poster_path)
        .sort((a,b) => b.popularity - a.popularity)
        .slice(0, 24)
        .map(c => ({ ...c, media_type: c.media_type || (c.first_air_date ? "tv" : "movie") }));
      setPersonCredits(all);
    } catch {}
    finally { setPersonLoading(false); }
  };

  const search = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true); setResults([]); setSearched(true); setShowSuggestions(false);
    try {
      const data = await api(`/search/multi?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`);
      setResults((data.results||[]).filter(r=>r.media_type==="movie"||r.media_type==="tv").slice(0,12));
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const discover = async () => {
    setDiscoverLoading(true); setDiscoverResults([]); setDiscoverSearched(true);
    try {
      let crewId = null, actorId = null;
      if (director.trim()) {
        const d = await api(`/search/person?query=${encodeURIComponent(director.trim())}&page=1`);
        crewId = (d.results||[])[0]?.id || null;
      }
      if (actor.trim()) {
        const d = await api(`/search/person?query=${encodeURIComponent(actor.trim())}&page=1`);
        actorId = (d.results||[])[0]?.id || null;
      }
      const p = new URLSearchParams();
      p.set("language","en-US"); p.set("page","1");
      p.set("sort_by", awardsOnly ? "vote_average.desc" : "popularity.desc");
      if (awardsOnly) { p.set("vote_average.gte","7.5"); p.set("vote_count.gte","500"); }
      if (genre) p.set("with_genres", genre);
      if (year) { mediaType==="movie" ? p.set("primary_release_year",year) : p.set("first_air_date_year",year); }
      if (crewId) { mediaType==="movie" ? p.set("with_crew",crewId) : p.set("with_people",crewId); }
      if (actorId) p.set("with_cast", actorId);
      if (streamService) { p.set("with_watch_providers", streamService); p.set("watch_region", country); }
      if (!streamService && country) p.set("watch_region", country);
      const data = await api(`/discover/${mediaType}?${p.toString()}`);
      setDiscoverResults((data.results||[]).slice(0,20).map(r=>({...r,media_type:mediaType})));
    } catch { setDiscoverResults([]); }
    finally { setDiscoverLoading(false); }
  };

  const goToTitle = (item) => navigate({ page:"title", mediaType: item.media_type, id: item.id });
  const goToPerson = (id) => navigate({ page:"person", id });
  const goHome = () => { navigate({ page:"home" }); setListsTab(false); };

  const isInMyList = (id) => myList.some(x=>x.id===id);
  const isInWatchlist = (id) => watchlist.some(x=>x.id===id);

  const toggleMyList = (item, e) => {
    e?.stopPropagation();
    const clean = { id:item.id, title:item.title||item.name, poster_path:item.poster_path, media_type:item.media_type, release_date:item.release_date, first_air_date:item.first_air_date, vote_average:item.vote_average };
    setMyList(isInMyList(item.id) ? myList.filter(x=>x.id!==item.id) : [...myList, clean]);
  };

  const toggleWatchlist = (item, e) => {
    e?.stopPropagation();
    const clean = { id:item.id, title:item.title||item.name, poster_path:item.poster_path, media_type:item.media_type, release_date:item.release_date, first_air_date:item.first_air_date, vote_average:item.vote_average };
    setWatchlist(isInWatchlist(item.id) ? watchlist.filter(x=>x.id!==item.id) : [...watchlist, clean]);
  };

  const shareTitle = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(()=>{ setShareToast(true); setTimeout(()=>setShareToast(false),2500); });
  };

  const hasAnyProviders = providerMap && ["flatrate","free","ads","rent","buy"].some(t=>Object.keys(providerMap[t]||{}).length>0);
  const genres = mediaType==="movie" ? MOVIE_GENRES : TV_GENRES;

  const ResultCard = ({ item }) => {
    const title = item.title||item.name;
    const yr = (item.release_date||item.first_air_date||"").split("-")[0];
    const inMy = isInMyList(item.id);
    return (
      <div className="result-card" onClick={()=>goToTitle(item)}>
        {item.poster_path ? <img className="card-poster" src={`${IMG_BASE}w342${item.poster_path}`} alt={title}/> : <div className="card-no-poster">🎬</div>}
        <div className="card-overlay"><span className="card-play">▶ Where to Watch</span></div>
        <div className={`card-list-btn ${inMy?"active":""}`} onClick={(e)=>toggleMyList(item,e)} title={inMy?"Remove from My List":"Add to My List"}>
          {inMy ? "★" : "☆"}
        </div>
        <div className="card-info">
          <div className="card-title">{title}</div>
          <div className="card-meta">
            {yr && <span>{yr}</span>}
            <span className="card-type">{item.media_type==="movie"?"Film":"TV"}</span>
            {item.vote_average>0 && <span>★{item.vote_average.toFixed(1)}</span>}
          </div>
        </div>
      </div>
    );
  };

  const ServiceCard = ({ name, data }) => (
    <div className="service-card">
      <div className="service-header">
        {data.logo ? <img className="service-logo" src={`${IMG_BASE}w45${data.logo}`} alt={name}/> : <div className="service-logo-ph">▶</div>}
        <span className="service-name">{name}</span>
        <span className="service-count">{data.countries.length} {data.countries.length===1?"country":"countries"}</span>
      </div>
      <div className="country-flags">
        {data.countries.sort((a,b)=>countryName(a).localeCompare(countryName(b))).map(code=>(
          <span className="country-tag" key={code}>
            <span className="country-flag-em">{flag(code)}</span>
            <span className="country-tag-name">{countryName(code)}</span>
          </span>
        ))}
      </div>
    </div>
  );

  const WtwSection = ({ type, label, cls }) => {
    if (!providerMap) return null;
    const entries = Object.entries(providerMap[type]||{});
    if (!entries.length) return null;
    return (
      <div className="wtw-section">
        <div className={`wtw-section-title ${cls}`}>{label}</div>
        {entries.map(([n,d])=><ServiceCard key={n} name={n} data={d}/>)}
      </div>
    );
  };

  // Key screen
  if (!savedKey) return (
    <>
      <style>{css}</style>
      <div className="app"><div className="key-screen">
        <div className="key-icon">🎬</div>
        <h1 className="key-title">SearchSeekStream</h1>
        <p className="key-sub">Find any movie or TV show — every platform, every country, all on one page.</p>
        <div className="key-box">
          <div className="key-input-wrap">
            <input className="key-input" placeholder="Paste your free TMDB API key..." value={apiKey}
              onChange={e=>setApiKey(e.target.value)} onKeyDown={e=>e.key==="Enter"&&apiKey.trim()&&setSavedKey(apiKey.trim())} autoFocus type="password"/>
            <button className="key-btn" onClick={()=>apiKey.trim()&&setSavedKey(apiKey.trim())}>GO</button>
          </div>
          <p className="key-note">Free at <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">themoviedb.org → Settings → API</a> — no credit card.</p>
        </div>
      </div></div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* VPN TOP BANNER */}
        <div className="vpn-header-bar">
          <a href={VPN_AFFILIATE_URL} target="_blank" rel="noreferrer">
            <span className="vpn-pill">Sponsored</span>
            <span>Unlock content from any country with <strong>{VPN_NAME}</strong> — get up to 70% off today →</span>
          </a>
        </div>

        <div className="main">

          {/* HEADER */}
          <div className="header-top">
            <div className="logo" onClick={goHome}>
              <div className="logo-dot"/>
              <span className="logo-a">Search</span><span className="logo-b">Seek</span><span className="logo-c">Stream</span>
            </div>
            <div className="header-actions">
              <button className="header-list-btn" onClick={()=>{ setListsTab(true); navigate({page:"home"}); }}>
                ★ My Lists
                {(myList.length+watchlist.length)>0 && <span className="header-list-badge">{myList.length+watchlist.length}</span>}
              </button>
            </div>
          </div>

          {/* SHARE TOAST */}
          {shareToast && <div className="share-toast">🔗 Link copied to clipboard!</div>}

          {/* TRAILER MODAL */}
          {showTrailer && trailer && (
            <div className="modal-overlay" onClick={()=>setShowTrailer(false)}>
              <div className="modal-content" onClick={e=>e.stopPropagation()}>
                <div className="modal-header">
                  <span className="modal-title">{trailer.name}</span>
                  <button className="modal-close" onClick={()=>setShowTrailer(false)}>×</button>
                </div>
                <div className="modal-video">
                  <iframe src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`} allow="autoplay; fullscreen" allowFullScreen title="trailer"/>
                </div>
              </div>
            </div>
          )}

          {/* ── PERSON PAGE ── */}
          {route.page === "person" && (
            <div className="detail">
              <button className="back-btn" onClick={()=>window.history.back()}>← Back</button>
              {personLoading && <div className="loading"><div className="spinner"/><div className="loading-text">Loading...</div></div>}
              {!personLoading && personData && (
                <>
                  <div className="person-hero">
                    {personData.profile_path
                      ? <img className="person-photo" src={`${IMG_BASE}w185${personData.profile_path}`} alt={personData.name}/>
                      : <div className="person-photo-ph">👤</div>}
                    <div>
                      <h2 className="person-name">{personData.name}</h2>
                      {personData.known_for_department && <div style={{fontSize:12,color:"var(--muted)",marginBottom:8,letterSpacing:"0.1em",textTransform:"uppercase"}}>{personData.known_for_department}</div>}
                      {personData.biography && <p className="person-bio">{personData.biography.slice(0,400)}{personData.biography.length>400?"…":""}</p>}
                    </div>
                  </div>
                  {personCredits.length > 0 && (
                    <>
                      <div className="section-title">Known For</div>
                      <div className="results-grid">
                        {personCredits.map(item=><ResultCard key={item.id} item={item}/>)}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TITLE DETAIL PAGE ── */}
          {route.page === "title" && (
            <div className="detail">
              <button className="back-btn" onClick={()=>window.history.back()}>← Back</button>
              {detailLoading && <div className="loading"><div className="spinner"/><div className="loading-text">Loading...</div></div>}
              {!detailLoading && detailData && (
                <>
                  <div className="detail-hero">
                    {detailData.poster_path
                      ? <div className="detail-poster-wrap"><img src={`${IMG_BASE}w342${detailData.poster_path}`} alt=""/></div>
                      : <div className="detail-no-poster">🎬</div>}
                    <div style={{flex:1}}>
                      <div className="detail-badge">{detailData.media_type==="movie"?"Movie":"TV Series"}</div>
                      <h2 className="detail-title">{detailData.title||detailData.name}</h2>
                      <div className="detail-meta-row">
                        <span className="detail-year">{((detailData.release_date||detailData.first_air_date)||"").split("-")[0]}</span>
                        {detailData.vote_average>0 && <span className="detail-rating">★ {detailData.vote_average.toFixed(1)}</span>}
                        {detailData.runtime && <span className="detail-year">{detailData.runtime}m</span>}
                        {detailData.number_of_seasons && <span className="detail-year">{detailData.number_of_seasons} seasons</span>}
                      </div>
                      {detailData.overview && <p className="detail-overview">{detailData.overview.length>240?detailData.overview.slice(0,240)+"…":detailData.overview}</p>}
                      <div className="detail-actions">
                        {trailer && <button className="action-btn trailer" onClick={()=>setShowTrailer(true)}>▶ Watch Trailer</button>}
                        <button className={`action-btn ${isInMyList(detailData.id)?"active":""}`} onClick={e=>toggleMyList(detailData,e)}>
                          {isInMyList(detailData.id)?"★ In My List":"☆ My List"}
                        </button>
                        <button className={`action-btn ${isInWatchlist(detailData.id)?"active":""}`} onClick={e=>toggleWatchlist(detailData,e)}>
                          {isInWatchlist(detailData.id)?"✓ Watchlisted":"+ Watchlist"}
                        </button>
                        <button className="action-btn" onClick={shareTitle}>🔗 Share</button>
                      </div>
                    </div>
                  </div>

                  {/* CAST */}
                  {cast.length > 0 && (
                    <div className="section-gap">
                      <div className="section-title">Cast</div>
                      <div className="cast-row">
                        {cast.map(p=>(
                          <div className="cast-card" key={p.id} onClick={()=>goToPerson(p.id)}>
                            {p.profile_path
                              ? <img className="cast-photo" src={`${IMG_BASE}w185${p.profile_path}`} alt={p.name}/>
                              : <div className="cast-photo-ph">👤</div>}
                            <div className="cast-name">{p.name}</div>
                            <div className="cast-char">{p.character}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CREW */}
                  {crew.length > 0 && (
                    <div className="section-gap">
                      <div className="section-title">Crew</div>
                      <div className="crew-grid">
                        {crew.map((p,i)=>(
                          <div className="crew-card" key={`${p.id}-${i}`} onClick={()=>goToPerson(p.id)}>
                            <div className="crew-name">{p.name}</div>
                            <div className="crew-job">{p.job||p.department}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WHERE TO WATCH */}
                  <div className="section-gap">
                    <div className="wtw-header">Where to watch — worldwide</div>
                    {providerMap && (hasAnyProviders ? (
                      <>
                        <WtwSection type="flatrate" label="Streaming (Subscription)" cls="stream"/>
                        <WtwSection type="free"     label="Free"                     cls="free"/>
                        <WtwSection type="ads"      label="Free with Ads"            cls="free"/>
                        <WtwSection type="rent"     label="Rent"                     cls="rent"/>
                        <WtwSection type="buy"      label="Buy"                      cls="buy"/>
                        <div className="justwatch-credit">◆ Data via JustWatch / TMDB</div>
                      </>
                    ) : (
                      <div className="no-streaming">
                        <div className="no-streaming-icon">📡</div>
                        <div className="no-streaming-text">Not on any streaming service</div>
                        <div className="no-streaming-sub">May only be available on physical media.</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── HOME ── */}
          {route.page === "home" && (
            <>
              <div className="tabs">
                <button className={`tab ${activeTab==="search"&&!listsTab?"active":""}`} onClick={()=>{setActiveTab("search");setListsTab(false);}}>Title Search</button>
                <button className={`tab ${activeTab==="discover"&&!listsTab?"active":""}`} onClick={()=>{setActiveTab("discover");setListsTab(false);}}>Discover</button>
                <button className={`tab vpn-tab ${activeTab==="vpn"&&!listsTab?"active":""}`} onClick={()=>{setActiveTab("vpn");setListsTab(false);}}>🔒 VPN</button>
                <button className={`tab ${listsTab?"active":""}`} onClick={()=>setListsTab(true)}>
                  ★ My Lists {(myList.length+watchlist.length)>0?`(${myList.length+watchlist.length})`:""}
                </button>
              </div>

              {/* ── MY LISTS ── */}
              {listsTab && (
                <div className="list-page">
                  <div className="list-tabs">
                    <button className={`list-tab ${listSubTab==="mylist"?"active":""}`} onClick={()=>setListSubTab("mylist")}>★ My List ({myList.length})</button>
                    <button className={`list-tab ${listSubTab==="watchlist"?"active":""}`} onClick={()=>setListSubTab("watchlist")}>✓ Watchlist ({watchlist.length})</button>
                  </div>
                  {listSubTab==="mylist" && (myList.length===0
                    ? <div className="empty-list"><div className="empty-icon">☆</div><div className="empty-text">Your list is empty — tap ☆ on any title to save it.</div></div>
                    : <div className="results-grid">{myList.map(item=><ResultCard key={item.id} item={item}/>)}</div>
                  )}
                  {listSubTab==="watchlist" && (watchlist.length===0
                    ? <div className="empty-list"><div className="empty-icon">📋</div><div className="empty-text">Your watchlist is empty — tap + Watchlist on any title.</div></div>
                    : <div className="results-grid">{watchlist.map(item=><ResultCard key={item.id} item={item}/>)}</div>
                  )}
                </div>
              )}

              {/* ── TITLE SEARCH ── */}
              {activeTab==="search" && !listsTab && (
                <>
                  <div className="search-wrap">
                    <div className="search-input-row">
                      <input ref={searchRef} className="search-input" placeholder="Search any movie or TV show..."
                        value={query} autoFocus
                        onChange={e=>{setQuery(e.target.value);setShowSuggestions(true);}}
                        onKeyDown={e=>{if(e.key==="Enter"){search();setShowSuggestions(false);}if(e.key==="Escape")setShowSuggestions(false);}}
                        onFocus={()=>suggestions.length>0&&setShowSuggestions(true)}
                        onBlur={()=>setTimeout(()=>setShowSuggestions(false),180)}
                      />
                      {query && <button className="search-clear" onClick={()=>{setQuery("");setSuggestions([]);setResults([]);setSearched(false);}}>×</button>}
                    </div>
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="suggestions">
                        {suggestions.map(item=>{
                          const title=item.title||item.name;
                          const yr=(item.release_date||item.first_air_date||"").split("-")[0];
                          return (
                            <div className="suggestion-item" key={item.id} onMouseDown={()=>{goToTitle(item);setShowSuggestions(false);}}>
                              {item.poster_path
                                ? <img className="suggestion-poster" src={`${IMG_BASE}w92${item.poster_path}`} alt={title}/>
                                : <div className="suggestion-poster-ph">🎬</div>}
                              <div className="suggestion-info">
                                <div className="suggestion-title">{title}</div>
                                <div className="suggestion-meta">
                                  {yr && <span>{yr}</span>}
                                  <span className="suggestion-type">{item.media_type==="movie"?"Film":"TV"}</span>
                                  {item.vote_average>0&&<span>★{item.vote_average.toFixed(1)}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button className="search-btn" onClick={()=>{search();setShowSuggestions(false);}} disabled={!query.trim()||loading}>
                    {loading?"SEARCHING...":"SEARCH"}
                  </button>
                  {!searched && (<><div className="chips-label">Popular</div><div className="chips">{POPULAR.map(t=><button key={t} className="chip" onClick={()=>{setQuery(t);search(t);}}>{t}</button>)}</div></>)}
                  {loading && <div className="loading"><div className="spinner"/><div className="loading-text">Searching...</div></div>}
                  {!loading && results.length>0 && <div className="results-grid">{results.map(item=><ResultCard key={item.id} item={item}/>)}</div>}
                  {!loading && searched && results.length===0 && <div className="no-results">No titles found — try a different search.</div>}
                </>
              )}

              {/* ── DISCOVER ── */}
              {activeTab==="discover" && !listsTab && (
                <>
                  <div className="discover-form">
                    <div>
                      <div className="field-label">Type</div>
                      <div className="media-toggle">
                        <button className={`media-btn ${mediaType==="movie"?"active":""}`} onClick={()=>{setMediaType("movie");setGenre("");}}>Movies</button>
                        <button className={`media-btn ${mediaType==="tv"?"active":""}`} onClick={()=>{setMediaType("tv");setGenre("");}}>TV Shows</button>
                      </div>
                    </div>
                    <div className="form-row">
                      <div>
                        <div className="field-label">Director / Creator</div>
                        <input className="field-input" placeholder="e.g. Christopher Nolan" value={director} onChange={e=>setDirector(e.target.value)}/>
                      </div>
                      <div>
                        <div className="field-label">Actor / Actress</div>
                        <input className="field-input" placeholder="e.g. Meryl Streep" value={actor} onChange={e=>setActor(e.target.value)}/>
                      </div>
                    </div>
                    <div className="form-row">
                      <div>
                        <div className="field-label">Genre</div>
                        <select className="field-select" value={genre} onChange={e=>setGenre(e.target.value)}>
                          <option value="">All Genres</option>
                          {genres.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="field-label">Year</div>
                        <input className="field-input" placeholder="e.g. 2023" value={year} onChange={e=>setYear(e.target.value.replace(/\D/g,"").slice(0,4))} maxLength={4}/>
                      </div>
                    </div>
                    <div className="form-row">
                      <div>
                        <div className="field-label">Country</div>
                        <select className="field-select" value={country} onChange={e=>setCountry(e.target.value)}>
                          {Object.entries(COUNTRY_NAMES).map(([code,name])=><option key={code} value={code}>{name}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="field-label">Streaming Service</div>
                        <select className="field-select" value={streamService} onChange={e=>setStreamService(e.target.value)}>
                          {STREAMING_SERVICES.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className={`awards-toggle ${awardsOnly?"on":""}`} onClick={()=>setAwardsOnly(v=>!v)}>
                      <div className={`toggle-switch ${awardsOnly?"on":""}`}><div className="toggle-knob"/></div>
                      <div>
                        <div className="awards-label">🏆 Award Winners & Critically Acclaimed</div>
                        <div className="awards-sub">7.5+ rating · 500+ votes</div>
                      </div>
                    </div>
                    <button className="search-btn" onClick={discover} disabled={discoverLoading} style={{borderRadius:8}}>
                      {discoverLoading?"SEARCHING...":"DISCOVER"}
                    </button>
                  </div>
                  {discoverLoading && <div className="loading"><div className="spinner"/><div className="loading-text">Finding titles...</div></div>}
                  {!discoverLoading && discoverResults.length>0 && <div className="results-grid" style={{marginTop:24}}>{discoverResults.map(item=><ResultCard key={item.id} item={item}/>)}</div>}
                  {!discoverLoading && discoverSearched && discoverResults.length===0 && <div className="no-results">No titles found — try adjusting your filters.</div>}
                </>
              )}

              {/* ── VPN TAB ── */}
              {activeTab==="vpn" && !listsTab && (
                <div className="vpn-page">
                  <div className="vpn-hero">
                    <div className="vpn-hero-icon">🌍</div>
                    <h2 className="vpn-hero-title">Watch Anything, From Anywhere</h2>
                    <p className="vpn-hero-sub">SearchSeekStream shows you where every title is streaming worldwide. A VPN lets you actually watch it — no matter what country you're in.</p>
                    <a className="vpn-cta-btn" href={VPN_AFFILIATE_URL} target="_blank" rel="noreferrer">🔒 Get {VPN_NAME} Now →</a>
                    <div className="vpn-cta-sub">Affiliate link — we may earn a commission at no extra cost to you</div>
                  </div>
                  <div className="vpn-why-title">Why you need a VPN for streaming</div>
                  <div className="vpn-reasons">
                    {[["🗺️","Unlock Every Library","Netflix US, UK, Japan and 30+ more all have different content. Switch between them instantly."],["💸","Stop Paying to Rent","A movie that costs $5 to rent in the US might be free on subscription in another country."],["🔒","Privacy & Security","Encrypts your connection and keeps your streaming activity private from your ISP."],["✈️","Works While Traveling","Access your home streaming services from any country. No blackouts, no geo-blocks."]].map(([icon,title,text])=>(
                      <div className="vpn-reason" key={title}><div className="vpn-reason-icon">{icon}</div><div className="vpn-reason-title">{title}</div><div className="vpn-reason-text">{text}</div></div>
                    ))}
                  </div>
                  <div className="vpn-bottom-cta">
                    <div className="vpn-bottom-text">Ready to watch anything, from anywhere? <span>Get {VPN_NAME} today.</span></div>
                    <a className="vpn-bottom-btn" href={VPN_AFFILIATE_URL} target="_blank" rel="noreferrer">Get {VPN_NAME} →</a>
                  </div>
                  <div className="vpn-disclaimer">* This page contains affiliate links. If you purchase a VPN through our link, SearchSeekStream may earn a commission at no extra cost to you.</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

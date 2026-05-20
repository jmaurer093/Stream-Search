import { useState, useRef, useCallback } from "react";

const IMG_BASE = "https://image.tmdb.org/t/p/";

// ── AFFILIATE LINK — replace with your real VPN affiliate URL ──
const VPN_AFFILIATE_URL = "https://your-vpn-affiliate-link.com";
const VPN_NAME = "NordVPN"; // change to whichever VPN you partner with

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
  {id:10764,name:"Reality"},{id:10765,name:"Sci-Fi & Fantasy"},{id:10767,name:"Talk"},
  {id:10768,name:"War & Politics"},{id:37,name:"Western"},
];

const flag = code => code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397));
const countryName = code => COUNTRY_NAMES[code] || code;
const POPULAR = ["Severance","The Bear","Inception","Breaking Bad","Oppenheimer","Shogun","Interstellar","The Office"];

function buildProviderMap(rawProviders) {
  const types = ["flatrate","free","ads","rent","buy"];
  const map = {};
  types.forEach(t => map[t] = {});
  Object.entries(rawProviders).forEach(([code, data]) => {
    if (code === "link") return;
    types.forEach(type => {
      (data[type] || []).forEach(p => {
        if (!map[type][p.provider_name]) map[type][p.provider_name] = { logo: p.logo_path, id: p.provider_id, countries: [] };
        map[type][p.provider_name].countries.push(code);
      });
    });
  });
  types.forEach(type => {
    map[type] = Object.fromEntries(Object.entries(map[type]).sort((a,b) => b[1].countries.length - a[1].countries.length));
  });
  return map;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#0A0A0F;--surface:#13131A;--surface2:#1A1A24;
    --border:rgba(255,255,255,0.07);--gold:#E8B84B;--gold2:#C9962A;
    --text:#F0EBE3;--muted:#6B6575;--dim:#2A2830;
    --vpn:#22C55E;--vpn2:#16A34A;
  }
  body{background:var(--bg);}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:var(--dim);border-radius:2px;}
  .app{min-height:100vh;background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--text);display:flex;flex-direction:column;}
  .main{max-width:860px;width:100%;margin:0 auto;padding:0 20px 60px;flex:1;}

  /* VPN BANNER — header */
  .vpn-header-bar{background:linear-gradient(90deg,rgba(34,197,94,0.12),rgba(34,197,94,0.06));border-bottom:1px solid rgba(34,197,94,0.2);padding:10px 20px;text-align:center;}
  .vpn-header-bar a{display:inline-flex;align-items:center;gap:8px;color:var(--vpn);text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.03em;transition:opacity 0.2s;}
  .vpn-header-bar a:hover{opacity:0.8;}
  .vpn-header-bar strong{color:#fff;}
  .vpn-pill{background:var(--vpn);color:#000;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:2px 8px;border-radius:20px;}

  /* KEY */
  .key-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:40px 24px;text-align:center;}
  .key-icon{font-size:48px;margin-bottom:24px;}
  .key-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,8vw,4.5rem);letter-spacing:0.05em;color:var(--text);line-height:1;margin-bottom:8px;}
  .key-sub{color:var(--muted);font-size:15px;margin-bottom:40px;line-height:1.6;max-width:420px;}
  .key-box{width:100%;max-width:480px;}
  .key-input-wrap{display:flex;background:var(--surface);border:1px solid var(--border);border-radius:6px 6px 0 0;overflow:hidden;}
  .key-input{flex:1;background:transparent;border:none;outline:none;color:var(--text);font-size:15px;padding:16px 20px;font-family:'DM Sans',sans-serif;}
  .key-input::placeholder{color:var(--muted);}
  .key-btn{background:linear-gradient(135deg,var(--gold),var(--gold2));border:none;color:#1A0F00;font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:0.1em;padding:16px 28px;cursor:pointer;}
  .key-note{font-size:12px;color:var(--muted);margin-top:12px;}
  .key-note a{color:var(--gold);text-decoration:none;}

  /* HEADER */
  .header-top{display:flex;align-items:center;justify-content:space-between;padding:32px 0 24px;}
  .logo{display:flex;align-items:baseline;gap:0;}
  .logo-dot{width:7px;height:7px;background:var(--gold);border-radius:50%;margin-bottom:4px;flex-shrink:0;margin-right:5px;}
  .logo-search{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.4rem,4vw,2.4rem);letter-spacing:0.06em;color:var(--text);}
  .logo-seek{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.4rem,4vw,2.4rem);letter-spacing:0.06em;color:var(--gold);}
  .logo-stream{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.4rem,4vw,2.4rem);letter-spacing:0.06em;color:var(--muted);}
  .header-right{display:flex;align-items:center;gap:10px;}
  .header-vpn-btn{display:inline-flex;align-items:center;gap:6px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);color:var(--vpn);font-size:12px;font-weight:500;padding:6px 12px;border-radius:20px;text-decoration:none;transition:all 0.2s;white-space:nowrap;}
  .header-vpn-btn:hover{background:rgba(34,197,94,0.2);border-color:rgba(34,197,94,0.5);}
  .api-badge{font-size:11px;color:var(--muted);border:1px solid var(--border);padding:4px 10px;border-radius:20px;cursor:pointer;transition:all 0.2s;background:transparent;}
  .api-badge:hover{color:var(--gold);border-color:rgba(232,184,75,0.3);}

  /* TABS */
  .tabs{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:28px;}
  .tab{background:transparent;border:none;border-bottom:2px solid transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;padding:12px 18px;cursor:pointer;transition:all 0.2s;margin-bottom:-1px;}
  .tab:hover{color:var(--text);}
  .tab.active{color:var(--gold);border-bottom-color:var(--gold);}
  .tab.vpn-tab{color:#4ADE80;}
  .tab.vpn-tab.active{color:var(--vpn);border-bottom-color:var(--vpn);}

  /* SEARCH */
  .search-input-row{display:flex;background:var(--surface);border:1px solid var(--border);border-radius:8px 8px 0 0;overflow:hidden;transition:border-color 0.2s;}
  .search-input-row:focus-within{border-color:rgba(232,184,75,0.4);}
  .search-input{flex:1;background:transparent;border:none;outline:none;color:var(--text);font-size:17px;padding:18px 20px;font-family:'DM Sans',sans-serif;}
  .search-input::placeholder{color:var(--muted);}
  .search-btn{display:block;width:100%;background:linear-gradient(135deg,var(--gold),var(--gold2));border:none;color:#1A0F00;font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:0.15em;padding:14px;cursor:pointer;border-radius:0 0 8px 8px;transition:opacity 0.2s;}
  .search-btn:disabled{opacity:0.3;cursor:not-allowed;}
  .search-btn:not(:disabled):hover{opacity:0.9;}
  .chips-label{font-size:11px;color:var(--muted);letter-spacing:0.25em;text-transform:uppercase;margin:24px 0 10px;}
  .chips{display:flex;flex-wrap:wrap;gap:8px;}
  .chip{background:transparent;border:1px solid var(--border);color:var(--muted);font-size:13px;padding:6px 14px;border-radius:20px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s;}
  .chip:hover{border-color:rgba(232,184,75,0.4);color:var(--gold);}

  /* DISCOVER FORM */
  .discover-form{display:flex;flex-direction:column;gap:16px;}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  @media(max-width:500px){.form-row{grid-template-columns:1fr;}}
  .field-label{font-size:11px;color:var(--muted);letter-spacing:0.2em;text-transform:uppercase;margin-bottom:6px;}
  .field-input{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:14px;padding:12px 14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.2s;}
  .field-input:focus{border-color:rgba(232,184,75,0.4);}
  .field-input::placeholder{color:var(--muted);}
  .field-select{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:14px;padding:12px 14px;font-family:'DM Sans',sans-serif;outline:none;cursor:pointer;transition:border-color 0.2s;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B6575' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;}
  .field-select:focus{border-color:rgba(232,184,75,0.4);}
  .field-select option{background:#1A1A24;}
  .media-toggle{display:flex;background:var(--surface);border:1px solid var(--border);border-radius:6px;overflow:hidden;}
  .media-btn{flex:1;background:transparent;border:none;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:13px;padding:11px;cursor:pointer;transition:all 0.2s;letter-spacing:0.05em;}
  .media-btn.active{background:var(--surface2);color:var(--gold);}
  .awards-toggle{display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:12px 14px;cursor:pointer;transition:border-color 0.2s;}
  .awards-toggle:hover{border-color:rgba(232,184,75,0.3);}
  .awards-toggle.on{border-color:rgba(232,184,75,0.5);background:rgba(232,184,75,0.06);}
  .toggle-switch{width:36px;height:20px;border-radius:10px;background:var(--dim);position:relative;transition:background 0.2s;flex-shrink:0;}
  .toggle-switch.on{background:var(--gold2);}
  .toggle-knob{width:14px;height:14px;border-radius:50%;background:white;position:absolute;top:3px;left:3px;transition:transform 0.2s;}
  .toggle-switch.on .toggle-knob{transform:translateX(16px);}
  .awards-label{font-size:13px;color:var(--text);}
  .awards-sub{font-size:11px;color:var(--muted);margin-top:1px;}

  /* VPN TAB PAGE */
  .vpn-page{animation:fadeUp 0.3s ease;}
  .vpn-hero{background:linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.04));border:1px solid rgba(34,197,94,0.25);border-radius:12px;padding:36px 32px;text-align:center;margin-bottom:28px;}
  .vpn-hero-icon{font-size:48px;margin-bottom:16px;}
  .vpn-hero-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.8rem,5vw,3rem);letter-spacing:0.06em;color:var(--text);margin-bottom:10px;}
  .vpn-hero-sub{color:var(--muted);font-size:15px;line-height:1.65;max-width:520px;margin:0 auto 28px;}
  .vpn-cta-btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--vpn),var(--vpn2));color:#000;font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:0.12em;padding:16px 40px;border-radius:8px;text-decoration:none;transition:opacity 0.2s;font-weight:400;}
  .vpn-cta-btn:hover{opacity:0.9;}
  .vpn-cta-sub{font-size:11px;color:rgba(34,197,94,0.5);margin-top:10px;letter-spacing:0.05em;}

  .vpn-why{margin-bottom:28px;}
  .vpn-why-title{font-size:11px;color:var(--muted);letter-spacing:0.25em;text-transform:uppercase;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border);}
  .vpn-reasons{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;}
  .vpn-reason{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:16px 18px;}
  .vpn-reason-icon{font-size:24px;margin-bottom:8px;}
  .vpn-reason-title{font-size:14px;font-weight:500;color:var(--text);margin-bottom:4px;}
  .vpn-reason-text{font-size:13px;color:var(--muted);line-height:1.55;}

  .vpn-bottom-cta{background:linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.03));border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
  .vpn-bottom-text{font-size:15px;color:var(--text);}
  .vpn-bottom-text span{color:var(--vpn);font-weight:500;}
  .vpn-bottom-btn{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,var(--vpn),var(--vpn2));color:#000;font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:0.1em;padding:12px 28px;border-radius:6px;text-decoration:none;transition:opacity 0.2s;white-space:nowrap;}
  .vpn-bottom-btn:hover{opacity:0.9;}
  .vpn-disclaimer{font-size:11px;color:var(--dim);margin-top:20px;line-height:1.6;}

  /* RESULTS */
  .results-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:12px;margin-top:28px;animation:fadeUp 0.3s ease;}
  .result-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;cursor:pointer;transition:all 0.2s;position:relative;}
  .result-card:hover{border-color:rgba(232,184,75,0.45);transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.5);}
  .result-card:hover .card-overlay{opacity:1;}
  .card-poster{width:100%;aspect-ratio:2/3;object-fit:cover;display:block;background:#1A1A24;}
  .card-no-poster{width:100%;aspect-ratio:2/3;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1A1A24,#0F0F18);font-size:36px;}
  .card-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.92) 0%,transparent 55%);opacity:0;transition:opacity 0.2s;display:flex;align-items:flex-end;padding:10px;}
  .card-play{font-size:10px;color:var(--gold);letter-spacing:0.15em;text-transform:uppercase;font-family:'Bebas Neue',sans-serif;}
  .card-info{padding:10px;}
  .card-title{font-size:12px;font-weight:500;color:var(--text);line-height:1.3;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .card-meta{font-size:11px;color:var(--muted);display:flex;gap:6px;}
  .card-type{background:var(--dim);padding:2px 6px;border-radius:3px;text-transform:uppercase;letter-spacing:0.05em;font-size:9px;}

  /* DETAIL */
  .detail{animation:fadeUp 0.3s ease;}
  .back-btn{background:transparent;border:none;color:var(--muted);font-size:13px;cursor:pointer;padding:0;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:6px;margin-bottom:24px;transition:color 0.15s;}
  .back-btn:hover{color:var(--gold);}
  .detail-hero{display:flex;gap:24px;margin-bottom:36px;align-items:flex-start;}
  .detail-poster-wrap{width:130px;flex-shrink:0;border-radius:8px;overflow:hidden;border:1px solid var(--border);}
  .detail-poster-wrap img{width:100%;display:block;}
  .detail-no-poster{width:130px;height:195px;background:linear-gradient(135deg,#1A1A24,#0F0F18);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:36px;border:1px solid var(--border);}
  .detail-badge{display:inline-block;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);border:1px solid rgba(232,184,75,0.3);padding:3px 8px;border-radius:3px;margin-bottom:8px;}
  .detail-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.6rem,5vw,2.8rem);letter-spacing:0.04em;line-height:1;color:var(--text);margin-bottom:8px;}
  .detail-meta-row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:10px;}
  .detail-year{font-size:13px;color:var(--muted);}
  .detail-rating{font-size:13px;color:var(--gold);}
  .detail-overview{font-size:13px;color:var(--muted);line-height:1.65;}

  /* INLINE VPN NUDGE on detail page */
  .vpn-nudge{display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:14px 16px;margin-bottom:24px;flex-wrap:wrap;}
  .vpn-nudge-text{font-size:13px;color:var(--muted);line-height:1.5;}
  .vpn-nudge-text strong{color:var(--vpn);}
  .vpn-nudge-btn{display:inline-flex;align-items:center;gap:5px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.35);color:var(--vpn);font-size:12px;font-weight:500;padding:7px 14px;border-radius:6px;text-decoration:none;white-space:nowrap;transition:all 0.2s;}
  .vpn-nudge-btn:hover{background:rgba(34,197,94,0.25);}

  /* WHERE TO WATCH */
  .wtw-header{font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:var(--muted);padding-bottom:12px;border-bottom:1px solid var(--border);margin-bottom:20px;}
  .wtw-section{margin-bottom:32px;}
  .wtw-section-title{font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:14px;display:flex;align-items:center;gap:10px;font-weight:500;}
  .wtw-section-title::after{content:'';flex:1;height:1px;background:var(--border);}
  .wtw-section-title.stream{color:#4ADE80;}
  .wtw-section-title.free{color:#A78BFA;}
  .wtw-section-title.rent{color:#60A5FA;}
  .wtw-section-title.buy{color:#F59E0B;}
  .service-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-bottom:10px;transition:border-color 0.15s;}
  .service-card:hover{border-color:rgba(232,184,75,0.2);}
  .service-header{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
  .service-logo{width:32px;height:32px;border-radius:6px;object-fit:cover;flex-shrink:0;}
  .service-logo-ph{width:32px;height:32px;border-radius:6px;background:var(--dim);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
  .service-name{font-size:15px;font-weight:500;color:var(--text);}
  .service-count{font-size:11px;color:var(--muted);margin-left:auto;}
  .country-flags{display:flex;flex-wrap:wrap;gap:6px;}
  .country-tag{display:inline-flex;align-items:center;gap:4px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:3px 8px;font-size:12px;color:var(--muted);white-space:nowrap;}
  .country-flag-em{font-size:14px;line-height:1;}
  .country-tag-name{font-size:11px;}
  .no-streaming{text-align:center;padding:48px 20px;}
  .no-streaming-icon{font-size:40px;margin-bottom:16px;opacity:0.35;}
  .no-streaming-text{font-size:15px;color:var(--muted);margin-bottom:6px;}
  .no-streaming-sub{font-size:13px;color:var(--dim);line-height:1.6;}
  .justwatch-credit{font-size:11px;color:var(--dim);margin-top:20px;}

  /* LOADING / EMPTY */
  .loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:72px 20px;gap:14px;}
  .spinner{width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin 0.75s linear infinite;}
  .loading-text{font-size:12px;color:var(--muted);letter-spacing:0.2em;text-transform:uppercase;}
  .no-results{text-align:center;padding:56px 20px;color:var(--muted);font-size:15px;}

  /* FOOTER */
  .site-footer{border-top:1px solid var(--border);padding:28px 20px;margin-top:auto;}
  .footer-inner{max-width:860px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:16px;}
  .footer-vpn-banner{width:100%;background:linear-gradient(90deg,rgba(34,197,94,0.1),rgba(34,197,94,0.05));border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
  .footer-vpn-text{font-size:13px;color:var(--muted);}
  .footer-vpn-text strong{color:var(--vpn);}
  .footer-vpn-link{display:inline-flex;align-items:center;gap:5px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:var(--vpn);font-size:12px;font-weight:500;padding:7px 16px;border-radius:20px;text-decoration:none;transition:all 0.2s;white-space:nowrap;}
  .footer-vpn-link:hover{background:rgba(34,197,94,0.25);}
  .footer-bottom{font-size:11px;color:var(--dim);text-align:center;line-height:1.8;}
  .footer-bottom a{color:var(--muted);text-decoration:none;}
  .footer-bottom a:hover{color:var(--gold);}

  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
`;

export default function SearchSeekStream() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState(import.meta?.env?.VITE_TMDB_KEY || "5ee7fc70df94b20e745e775aaab33997");
  const [activeTab, setActiveTab] = useState("search");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [mediaType, setMediaType] = useState("movie");
  const [director, setDirector] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [awardsOnly, setAwardsOnly] = useState(false);
  const [discoverResults, setDiscoverResults] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverSearched, setDiscoverSearched] = useState(false);

  const [selected, setSelected] = useState(null);
  const [providerMap, setProviderMap] = useState(null);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [fromTab, setFromTab] = useState("search");

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
      setResults((data.results||[]).filter(r=>r.media_type==="movie"||r.media_type==="tv").slice(0,12));
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const discover = async () => {
    if (!savedKey) return;
    setDiscoverLoading(true); setDiscoverResults([]); setSelected(null); setProviderMap(null); setDiscoverSearched(true);
    try {
      let crewId = null;
      if (director.trim()) {
        const pData = await api(`/search/person?query=${encodeURIComponent(director.trim())}&page=1`);
        const person = (pData.results||[])[0];
        if (person) crewId = person.id;
      }
      const params = new URLSearchParams();
      params.set("language","en-US"); params.set("page","1");
      params.set("sort_by", awardsOnly ? "vote_average.desc" : "popularity.desc");
      if (awardsOnly) { params.set("vote_average.gte","7.5"); params.set("vote_count.gte","500"); }
      if (genre) params.set("with_genres", genre);
      if (year) { mediaType==="movie" ? params.set("primary_release_year",year) : params.set("first_air_date_year",year); }
      if (crewId) { mediaType==="movie" ? params.set("with_crew",crewId) : params.set("with_people",crewId); }
      const data = await api(`/discover/${mediaType}?${params.toString()}`);
      setDiscoverResults((data.results||[]).slice(0,20).map(r=>({...r,media_type:mediaType})));
    } catch { setDiscoverResults([]); }
    finally { setDiscoverLoading(false); }
  };

  const selectTitle = async (item, tab) => {
    setFromTab(tab); setSelected(item); setLoadingProviders(true); setProviderMap(null);
    try {
      const type = item.media_type==="movie" ? "movie" : "tv";
      const data = await api(`/${type}/${item.id}/watch/providers?`);
      setProviderMap(buildProviderMap(data.results||{}));
    } catch { setProviderMap({}); }
    finally { setLoadingProviders(false); }
  };

  const handleKey = e => { if (e.key==="Enter") search(); };
  const saveKey = () => { if (apiKey.trim()) setSavedKey(apiKey.trim()); };
  const handleKeyKey = e => { if (e.key==="Enter") saveKey(); };
  const hasAnyProviders = providerMap && ["flatrate","free","ads","rent","buy"].some(t=>Object.keys(providerMap[t]||{}).length>0);
  const genres = mediaType==="movie" ? MOVIE_GENRES : TV_GENRES;

  const ResultCard = ({ item, tab }) => {
    const title = item.title||item.name;
    const yr = (item.release_date||item.first_air_date||"").split("-")[0];
    return (
      <div className="result-card" onClick={()=>selectTitle(item,tab)}>
        {item.poster_path ? <img className="card-poster" src={`${IMG_BASE}w342${item.poster_path}`} alt={title}/> : <div className="card-no-poster">🎬</div>}
        <div className="card-overlay"><span className="card-play">▶ Where to Watch</span></div>
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
    const entries = Object.entries(providerMap[type]||{});
    if (!entries.length) return null;
    return (
      <div className="wtw-section">
        <div className={`wtw-section-title ${cls}`}>{label}</div>
        {entries.map(([name,data])=><ServiceCard key={name} name={name} data={data}/>)}
      </div>
    );
  };

  // Key screen
  if (!savedKey) return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="key-screen">
          <div className="key-icon">🎬</div>
          <h1 className="key-title">SearchSeekStream</h1>
          <p className="key-sub">Find any movie or TV show — see every platform and every country, all on one page.</p>
          <div className="key-box">
            <div className="key-input-wrap">
              <input className="key-input" placeholder="Paste your free TMDB API key..." value={apiKey}
                onChange={e=>setApiKey(e.target.value)} onKeyDown={handleKeyKey} autoFocus type="password"/>
              <button className="key-btn" onClick={saveKey}>GO</button>
            </div>
            <p className="key-note">Free at <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">themoviedb.org → Settings → API</a> — no credit card.</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* ── TOP AFFILIATE BANNER ── */}
        <div className="vpn-header-bar">
          <a href={VPN_AFFILIATE_URL} target="_blank" rel="noreferrer">
            <span className="vpn-pill">Sponsored</span>
            <span>Unlock content from any country with <strong>{VPN_NAME}</strong> — get up to 70% off today →</span>
          </a>
        </div>

        <div className="main">

          {/* Header */}
          <div className="header-top">
            <div className="logo">
              <div className="logo-dot"/>
              <span className="logo-search">Search</span>
              <span className="logo-seek">Seek</span>
              <span className="logo-stream">Stream</span>
            </div>
            <div className="header-right">
              <a className="header-vpn-btn" href={VPN_AFFILIATE_URL} target="_blank" rel="noreferrer">
                🔒 Get a VPN
              </a>
            </div>
          </div>

          {/* Detail view */}
          {selected ? (
            <div className="detail">
              <button className="back-btn" onClick={()=>{setSelected(null);setProviderMap(null);setActiveTab(fromTab);}}>← Back to results</button>
              <div className="detail-hero">
                {selected.poster_path
                  ? <div className="detail-poster-wrap"><img src={`${IMG_BASE}w342${selected.poster_path}`} alt=""/></div>
                  : <div className="detail-no-poster">🎬</div>}
                <div>
                  <div className="detail-badge">{selected.media_type==="movie"?"Movie":"TV Series"}</div>
                  <h2 className="detail-title">{selected.title||selected.name}</h2>
                  <div className="detail-meta-row">
                    <span className="detail-year">{((selected.release_date||selected.first_air_date)||"").split("-")[0]}</span>
                    {selected.vote_average>0 && <span className="detail-rating">★ {selected.vote_average.toFixed(1)}</span>}
                  </div>
                  {selected.overview && <p className="detail-overview">{selected.overview.length>220?selected.overview.slice(0,220)+"…":selected.overview}</p>}
                </div>
              </div>

              {/* VPN nudge on detail page */}
              <div className="vpn-nudge">
                <div className="vpn-nudge-text">
                  📍 See it streaming in another country? <strong>A VPN lets you watch it from anywhere.</strong>
                </div>
                <a className="vpn-nudge-btn" href={VPN_AFFILIATE_URL} target="_blank" rel="noreferrer">
                  🔒 Get {VPN_NAME} →
                </a>
              </div>

              {loadingProviders && <div className="loading"><div className="spinner"/><div className="loading-text">Finding all streaming services...</div></div>}
              {!loadingProviders && providerMap!==null && (
                <>
                  <div className="wtw-header">Where to watch — worldwide</div>
                  {hasAnyProviders ? (
                    <>
                      <WtwSection type="flatrate" label="Streaming (Subscription)" cls="stream"/>
                      <WtwSection type="free"     label="Free"                     cls="free"/>
                      <WtwSection type="ads"      label="Free with Ads"            cls="free"/>
                      <WtwSection type="rent"     label="Rent"                     cls="rent"/>
                      <WtwSection type="buy"      label="Buy"                      cls="buy"/>
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
          ) : (
            <>
              {/* Tabs */}
              <div className="tabs">
                <button className={`tab ${activeTab==="search"?"active":""}`} onClick={()=>setActiveTab("search")}>Title Search</button>
                <button className={`tab ${activeTab==="discover"?"active":""}`} onClick={()=>setActiveTab("discover")}>Discover</button>
                <button className={`tab vpn-tab ${activeTab==="vpn"?"active":""}`} onClick={()=>setActiveTab("vpn")}>🔒 VPN</button>
              </div>

              {/* ── TITLE SEARCH ── */}
              {activeTab==="search" && (
                <>
                  <div className="search-input-row">
                    <input ref={searchRef} className="search-input" placeholder="Search any movie or TV show..." value={query}
                      onChange={e=>setQuery(e.target.value)} onKeyDown={handleKey} autoFocus/>
                  </div>
                  <button className="search-btn" onClick={()=>search()} disabled={!query.trim()||loading}>
                    {loading?"SEARCHING...":"SEARCH"}
                  </button>
                  {!searched && (
                    <>
                      <div className="chips-label">Popular</div>
                      <div className="chips">
                        {POPULAR.map(t=><button key={t} className="chip" onClick={()=>{setQuery(t);search(t);}}>{t}</button>)}
                      </div>
                    </>
                  )}
                  {loading && <div className="loading"><div className="spinner"/><div className="loading-text">Searching titles...</div></div>}
                  {!loading && results.length>0 && (
                    <div className="results-grid">
                      {results.map(item=><ResultCard key={item.id} item={item} tab="search"/>)}
                    </div>
                  )}
                  {!loading && searched && results.length===0 && <div className="no-results">No titles found — try a different search.</div>}
                </>
              )}

              {/* ── DISCOVER ── */}
              {activeTab==="discover" && (
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
                        <input className="field-input" placeholder={mediaType==="movie"?"e.g. Christopher Nolan":"e.g. Vince Gilligan"}
                          value={director} onChange={e=>setDirector(e.target.value)}/>
                      </div>
                      <div>
                        <div className="field-label">Year</div>
                        <input className="field-input" placeholder="e.g. 2023" value={year}
                          onChange={e=>setYear(e.target.value.replace(/\D/g,"").slice(0,4))} maxLength={4}/>
                      </div>
                    </div>
                    <div>
                      <div className="field-label">Genre</div>
                      <select className="field-select" value={genre} onChange={e=>setGenre(e.target.value)}>
                        <option value="">All Genres</option>
                        {genres.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div className={`awards-toggle ${awardsOnly?"on":""}`} onClick={()=>setAwardsOnly(v=>!v)}>
                      <div className={`toggle-switch ${awardsOnly?"on":""}`}><div className="toggle-knob"/></div>
                      <div>
                        <div className="awards-label">🏆 Award Winners & Critically Acclaimed</div>
                        <div className="awards-sub">Filters to titles with 7.5+ rating and 500+ votes</div>
                      </div>
                    </div>
                    <button className="search-btn" onClick={discover} disabled={discoverLoading} style={{borderRadius:8}}>
                      {discoverLoading?"SEARCHING...":"DISCOVER"}
                    </button>
                  </div>
                  {discoverLoading && <div className="loading"><div className="spinner"/><div className="loading-text">Finding titles...</div></div>}
                  {!discoverLoading && discoverResults.length>0 && (
                    <div className="results-grid" style={{marginTop:32}}>
                      {discoverResults.map(item=><ResultCard key={item.id} item={item} tab="discover"/>)}
                    </div>
                  )}
                  {!discoverLoading && discoverSearched && discoverResults.length===0 && <div className="no-results">No titles found — try adjusting your filters.</div>}
                </>
              )}

              {/* ── VPN TAB ── */}
              {activeTab==="vpn" && (
                <div className="vpn-page">
                  <div className="vpn-hero">
                    <div className="vpn-hero-icon">🌍</div>
                    <h2 className="vpn-hero-title">Watch Anything, From Anywhere</h2>
                    <p className="vpn-hero-sub">
                      SearchSeekStream shows you where every title is streaming worldwide. A VPN lets you actually watch it — no matter what country you're in. One click to unlock every streaming library on the planet.
                    </p>
                    <a className="vpn-cta-btn" href={VPN_AFFILIATE_URL} target="_blank" rel="noreferrer">
                      🔒 Get {VPN_NAME} Now →
                    </a>
                    <div className="vpn-cta-sub">Affiliate link — we may earn a commission at no extra cost to you</div>
                  </div>

                  <div className="vpn-why">
                    <div className="vpn-why-title">Why you need a VPN for streaming</div>
                    <div className="vpn-reasons">
                      <div className="vpn-reason">
                        <div className="vpn-reason-icon">🗺️</div>
                        <div className="vpn-reason-title">Unlock Every Country's Library</div>
                        <div className="vpn-reason-text">Netflix US, UK, Japan, and 30+ more all have different content. A VPN lets you switch between them instantly.</div>
                      </div>
                      <div className="vpn-reason">
                        <div className="vpn-reason-icon">💸</div>
                        <div className="vpn-reason-title">Stop Paying to Rent</div>
                        <div className="vpn-reason-text">A movie that costs $5 to rent in the US might be free on a subscription service in another country.</div>
                      </div>
                      <div className="vpn-reason">
                        <div className="vpn-reason-icon">🔒</div>
                        <div className="vpn-reason-title">Privacy & Security</div>
                        <div className="vpn-reason-text">Encrypts your connection and keeps your streaming activity private from your ISP.</div>
                      </div>
                      <div className="vpn-reason">
                        <div className="vpn-reason-icon">✈️</div>
                        <div className="vpn-reason-title">Works While Traveling</div>
                        <div className="vpn-reason-text">Access your home streaming services from any country. No blackouts, no geo-blocks.</div>
                      </div>
                    </div>
                  </div>

                  <div className="vpn-bottom-cta">
                    <div className="vpn-bottom-text">
                      Ready to watch anything, from anywhere? <span>Get {VPN_NAME} today.</span>
                    </div>
                    <a className="vpn-bottom-btn" href={VPN_AFFILIATE_URL} target="_blank" rel="noreferrer">
                      Get {VPN_NAME} →
                    </a>
                  </div>

                  <div className="vpn-disclaimer">
                    * This page contains affiliate links. If you purchase a VPN through our link, SearchSeekStream may earn a commission at no extra cost to you. We only recommend services we believe provide genuine value.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-vpn-banner">
              <div className="footer-vpn-text">
                🌍 See it streaming in another country? <strong>A VPN lets you watch it from anywhere.</strong>
              </div>
              <a className="footer-vpn-link" href={VPN_AFFILIATE_URL} target="_blank" rel="noreferrer">
                🔒 Get {VPN_NAME} →
              </a>
            </div>
            <div className="footer-bottom">
              © {new Date().getFullYear()} SearchSeekStream · Streaming data via <a href="https://www.justwatch.com" target="_blank" rel="noreferrer">JustWatch</a> / <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">TMDB</a>
              <br/>
              <a href={VPN_AFFILIATE_URL} target="_blank" rel="noreferrer">VPN Partner: {VPN_NAME}</a> · Affiliate Disclosure: We may earn a commission on VPN purchases.
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

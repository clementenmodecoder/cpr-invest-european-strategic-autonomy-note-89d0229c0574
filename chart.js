/* =========================================================================
   CPR Invest - European Strategic Autonomy | note de reference interne
   Moteur de graphique SVG maison (zero dependance, fonctionne hors-ligne)
   Pilote par window.CHART_CONFIG (defini dans chaque page avant ce script).
   Charte CPR : #009EE0 / #001C4B / #FFFFFF / #F5F5F5 / #D6EAF7
   ========================================================================= */

/* ---------- Configuration de page ---------- */
const CFG = Object.assign({
  present:   {cpram:true, bench:true},  // series affichees sur cette page (+ etat initial)
  events:    true,                       // reperes numerotes + modale
  episodes:  true,                       // boutons d'episode (zoom)
  fundArea:  true,                       // aire + halo sous la courbe du fonds
  ranges:    ["hist","3a","1a","ytd"],   // periodes proposees
  defaultRange: "hist",
}, window.CHART_CONFIG || {});

/* ---------- Definition de toutes les series ---------- */
const SERIES = {
  cpram:   {name:"CPR Invest - European Strategic Autonomy", short:"CPR Invest - ESA", color:"#009EE0", width:3.2, fund:true},
  bench:   {name:"Indice MSCI EMU Net Return", short:"Indice (MSCI EMU)", color:"#5b6b85", width:2},
  mirova:  {name:"Mirova Thematic Europe Autonomy", short:"Mirova Th. Eur. Autonomy", color:"#7C5CD6", width:1.8},
  nordea:  {name:"Nordea 1 - Empower Europe", short:"Nordea Empower Europe", color:"#E8920C", width:1.8},
  allianz: {name:"Allianz European Autonomy", short:"Allianz Eur. Autonomy", color:"#0F9D8E", width:1.8},
  amundi:  {name:"Amundi European Strategic Autonomy UCITS ETF", short:"Amundi ESA (ETF)", color:"#C0496B", width:1.8},
};
const SERIES_ORDER = Object.keys(SERIES).filter(k=>k in CFG.present);
for(const k of SERIES_ORDER){ SERIES[k].on = !!CFG.present[k]; }
function visibleSeries(){ return SERIES_ORDER.filter(k=>SERIES[k].on); }

/* ---------- Utilitaires dates / format ---------- */
const DAY = 86400000;
const MONTHS = ["janv.","fevr.","mars","avr.","mai","juin","juil.","aout","sept.","oct.","nov.","dec."];
function parseD(s){const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d).getTime();}
function fmtDate(t){const d=new Date(t);return d.getDate()+" "+MONTHS[d.getMonth()]+" "+d.getFullYear();}
function fmtMonthYr(t){const d=new Date(t);return MONTHS[d.getMonth()]+" "+String(d.getFullYear()).slice(2);}
function fmtYear(t){return String(new Date(t).getFullYear());}
function fmtNum(v,dec){return v.toFixed(dec==null?2:dec).replace(".",",");}

/* ---------- Donnees -> {t,v} ---------- */
const DATA = {};
for(const k of SERIES_ORDER){
  DATA[k] = (window.PRICE_DATA[k]||[]).map(p=>({t:parseD(p[0]), v:p[1]})).sort((a,b)=>a.t-b.t);
}
const GLOBAL_START = DATA.cpram && DATA.cpram.length ? DATA.cpram[0].t : parseD("2023-06-01");
let GLOBAL_END = GLOBAL_START;
for(const k of SERIES_ORDER){ const a=DATA[k]; if(a&&a.length&&a[a.length-1].t>GLOBAL_END) GLOBAL_END=a[a.length-1].t; }
const MIN_SPAN = 30*DAY;
const FULL_SPAN = GLOBAL_END-GLOBAL_START;
const ZOOM_IN = 0.88, ZOOM_OUT = 1/0.88;
const YEAR = 365*DAY;

/* ---------- Periodes & episodes ---------- */
const ALL_RANGES = {
  hist:{id:"hist", label:"Depuis creation", start:GLOBAL_START,        end:GLOBAL_END},
  "3a":{id:"3a",   label:"3 ans",           start:GLOBAL_END-3*YEAR,    end:GLOBAL_END},
  "1a":{id:"1a",   label:"1 an",            start:GLOBAL_END-YEAR,      end:GLOBAL_END},
  ytd: {id:"ytd",  label:"2026 (YTD)",      start:parseD("2025-12-31"), end:GLOBAL_END},
  "6m":{id:"6m",   label:"6 mois",          start:GLOBAL_END-182*DAY,   end:GLOBAL_END},
};
const RANGES = CFG.ranges.map(id=>ALL_RANGES[id]).filter(Boolean);
const EPISODES = [
  {id:"lanc",   label:"Lancement & 2023",      start:parseD("2023-06-01"), end:parseD("2024-01-31")},
  {id:"an24",   label:"2024 (en retrait)",     start:parseD("2024-01-01"), end:parseD("2024-12-31")},
  {id:"reveil", label:"Reveil europeen 2025",  start:parseD("2025-01-01"), end:parseD("2025-12-31")},
  {id:"an26",   label:"2026 (YTD)",            start:parseD("2025-12-31"), end:GLOBAL_END},
];

/* =========================================================================
   EVENEMENTS (contenu issu exclusivement des documents CPRAM fournis)
   Categories : macro | secteur | titre | fonds
   ========================================================================= */
const EVENTS = [
{ id:1, date:"2023-06-01", cat:"fonds", title:"Creation du fonds (base 100)",
  short:"Lancement de CPR Invest - European Strategic Autonomy (part I EUR) ; debut de l'historique de VL disponible.",
  move:"VL de depart : base 100", moveSign:0,
  holdings:"Portefeuille d'actions europeennes des cinq dimensions strategiques : industrie, defense, finance, sante, alimentation.",
  body:`<p>Lancement de <b>CPR Invest - European Strategic Autonomy</b> (part I EUR, capitalisation), compartiment de la SICAV luxembourgeoise CPR Invest, geree par CPR Asset Management (groupe Amundi). Date de creation officielle : <b>28/03/2023</b> ; ISIN LU2570611249 ; indice de reference le <b>MSCI EMU Net Return</b>.</p><p>Le fonds vise a surperformer les marches actions de la zone euro sur un horizon d'au moins cinq ans, en investissant dans des societes qui contribuent a l'autonomie et a la resilience strategiques de l'Europe (industrie, defense, finance, sante, alimentation), tout en integrant des criteres ESG (SFDR article 8). La gestion, de conviction, est assuree par Damien Mariette et Eric Labbe.</p><p>La courbe reprend la valeur liquidative reelle de la part I EUR, indexee en base 100 a l'ouverture de la fenetre affichee. L'historique de VL fourni demarre au 01/06/2023.</p>`,
  sources:[{l:"Reporting mensuel CPR Invest - ESA (31/05/2026)"},{l:"DIC PRIIPs CPR Invest - ESA (publie le 18/12/2025)"},{l:"Page produit officielle", u:"https://cpram.com/lux/fr/institutionnels/products/LU2570611249"}] },

{ id:2, date:"2023-10-31", cat:"macro", title:"Point bas d'octobre 2023, debut du cycle haussier",
  short:"La VL touche son plus-bas historique (97,63) fin octobre 2023, juste avant un puissant rebond.",
  move:"plus-bas historique le 31/10/2023 a 97,63, puis bascule en cycle haussier", moveSign:1,
  holdings:"Repli generalise des actions de la zone euro avant le rebond de fin 2023.",
  body:`<p>Fin octobre 2023, la valeur liquidative touche son <b>plus-bas historique, a 97,63 le 31/10/2023</b>. Ce creux coincide avec le pic des taux d'interet a long terme (le rendement du 10 ans americain frole alors les 5 %), particulierement penalisant pour les actions.</p><p>A partir de debut novembre 2023, le reflux de l'inflation et les anticipations de baisses de taux des banques centrales (BCE et Fed au sommet de leur cycle) declenchent un puissant rebond. Le fonds ne reviendra jamais sur ce point bas : c'est le veritable point de depart de son cycle haussier.</p>`,
  sources:[{l:"Export VL CPRAM (LU2570611249), plus-bas au 31/10/2023"},{l:"Contexte de marche : pic des taux longs fin octobre 2023 et anticipations de pivot des banques centrales"}] },

{ id:3, date:"2024-11-05", cat:"macro", title:"Reelection de Donald Trump",
  short:"Bascule geopolitique : pression accrue sur l'Europe (defense, OTAN, droits de douane) ; catalyseur du theme de l'autonomie.",
  move:"acceleration structurelle de la thematique de souverainete", moveSign:1,
  holdings:"Dimensions defense et industrie au premier plan.",
  body:`<p>La communication du gerant souligne que «&nbsp;nous naviguons dans un environnement volatil depuis la reelection de Trump&nbsp;». L'administration americaine accroit les pressions geopolitiques sur l'Union europeenne : gel de l'aide militaire a l'Ukraine, remise en cause de l'alliance de defense transatlantique et de l'OTAN, droits de douane.</p><p>Pour la gestion, ce changement de paradigme constitue un puissant catalyseur structurel : les Europeens «&nbsp;n'ont plus d'autre choix que d'agir en coordination&nbsp;» pour se reindustrialiser et se rearmer, les deux moteurs au coeur de la these du fonds.</p>`,
  sources:[{l:"Communication du gerant - ESA (verbatim)"},{l:"Pitchbook CPR Invest - ESA (mai 2026), enjeux & opportunites"}] },

{ id:4, date:"2025-02-14", cat:"macro", title:"Discours de J.D. Vance a Munich",
  short:"A la Conference de Munich sur la securite, le vice-president americain remet en cause l'alliance transatlantique.",
  move:"prise de conscience europeenne acceleree", moveSign:1,
  holdings:"Renforcement de la these defense / autonomie.",
  body:`<p>La communication du gerant cite explicitement «&nbsp;le discours du vice-president J.D. Vance a la Conference de Munich sur la securite&nbsp;», qui «&nbsp;a mis la pression sur tous les pays europeens pour qu'ils protegent notre zone&nbsp;».</p><p>Ce moment marque, pour la gestion, le point ou «&nbsp;l'autonomie strategique europeenne est plus importante que jamais&nbsp;», preparant la salve d'annonces budgetaires de mars 2025.</p>`,
  sources:[{l:"Communication du gerant - ESA (verbatim)"}] },

{ id:5, date:"2025-03-04", cat:"secteur", title:"REARM Europe / Readiness 2030",
  short:"La Commission europeenne devoile un plan pouvant mobiliser jusqu'a 800 Md€ pour la defense.",
  move:"catalyseur majeur pour la dimension defense", moveSign:1,
  holdings:"Valeurs defense et industrie de l'univers (ex. : Thales, Safran, Airbus, Exosens).",
  body:`<p>Debut mars 2025, la Commission europeenne annonce le plan <b>«&nbsp;REARM Europe / Readiness 2030&nbsp;»</b> : un potentiel de <b>~800 Md€</b> de depenses de defense (~650 Md€ de marge budgetaire supplementaire sur quatre ans et ~150 Md€ de prets de l'UE aux Etats membres). L'objectif affiche est de doubler le budget de defense des Etats membres d'ici 2030 et de tendre vers 3 % du PIB.</p><p>Le pitchbook presente ce plan comme l'un des catalyseurs structurels de 2026, dans le prolongement d'un sous-investissement europeen estime a <b>1 800 Md€</b> depuis la fin de la guerre froide.</p>`,
  sources:[{l:"Pitchbook CPR Invest - ESA (mai 2026), «&nbsp;REARM Europe / Readiness 2030&nbsp;»"},{l:"Communication du gerant - ESA"}] },

{ id:6, date:"2025-03-18", cat:"macro", title:"Le «&nbsp;bazooka&nbsp;» budgetaire allemand",
  short:"L'Allemagne cree un fonds special d'infrastructure de 500 Md€ et assouplit son frein a l'endettement.",
  move:"soutien massif a la croissance et a la reindustrialisation", moveSign:1,
  holdings:"Industrie, construction, energie (ex. : Siemens, Saint-Gobain, Schneider Electric).",
  body:`<p>Le pitchbook detaille la creation d'un <b>fonds d'infrastructure hors budget de 500 Md€</b> (environ 11,6 % du PIB allemand 2024) sur dix ans, couvrant l'education, le transport, la decarbonation, le logement et la resilience economique. L'estimation moyenne est une hausse du PIB allemand d'environ 1,5 point sur trois ans, avec un effet d'entrainement attendu sur l'ensemble de la croissance europeenne.</p><p>Conjugue a REARM Europe, ce «&nbsp;bazooka&nbsp;» marque un veritable changement de paradigme budgetaire pour le coeur industriel de la zone euro.</p>`,
  sources:[{l:"Pitchbook CPR Invest - ESA (mai 2026), «&nbsp;Le bazooka allemand&nbsp;» (au 28/03/2025)"}] },

{ id:7, date:"2025-04-07", cat:"macro", title:"Flash crash des droits de douane (« Liberation Day »)",
  short:"Annonce des droits de douane « reciproques » americains le 2 avril : chute brutale des marches du 3 au 9 avril.",
  move:"VL d'environ 126 (18/03) a 106,44 (09/04), soit environ -15,7 %", moveSign:-1,
  holdings:"Repli general ; valeurs cycliques, industrielles et exportatrices fortement touchees.",
  body:`<p>Le 2 avril 2025 («&nbsp;Liberation Day&nbsp;»), l'administration americaine annonce des droits de douane «&nbsp;reciproques&nbsp;» d'une ampleur inattendue. Les marches actions mondiaux plongent du <b>3 au 9 avril</b>, l'un des reculs les plus brutaux depuis 2020. La valeur liquidative du fonds chute d'environ <b>126 (plus-haut du 18/03) a 106,44 le 09/04</b>, soit pres de -15,7 %.</p><p>Le rebond est tout aussi rapide a partir du 10 avril, apres l'annonce d'une <b>pause de 90 jours</b> sur la plupart des droits de douane. La communication du gerant cite d'ailleurs les «&nbsp;tarifs douaniers&nbsp;» parmi les pressions exercees par Washington sur l'Europe.</p>`,
  sources:[{l:"Communication du gerant - ESA (droits de douane)"},{l:"Export VL CPRAM (LU2570611249)"},{l:"Contexte de marche : droits de douane reciproques du 02/04/2025 et pause de 90 jours du 09/04/2025"}] },

{ id:8, date:"2025-12-31", cat:"fonds", title:"2025 : une annee solide (+23,5 %)",
  short:"Le fonds termine 2025 a +23,5 %, au coude-a-coude avec son indice (+23,7 %).",
  move:"2025 : +23,5 % (indice +23,7 %, ecart -0,2 pt)", moveSign:1,
  holdings:"Forte contribution de l'industrie, de la finance et des semi-conducteurs.",
  body:`<p>Portee par le reveil budgetaire europeen et la dynamique des valeurs industrielles et financieres, l'annee 2025 se solde par une performance de <b>+23,5 %</b> pour le fonds, quasiment en ligne avec son indice MSCI EMU (<b>+23,7 %</b>, ecart de -0,2 point).</p><p>Ce millesime contraste avec 2024 (+3,7 % contre +9,5 % pour l'indice), annee ou la dimension defense et plusieurs valeurs n'avaient pas encore ete pleinement reconnues par le marche.</p>`,
  sources:[{l:"Reporting mensuel CPR Invest - ESA (performances par annee civile)"}] },

{ id:9, date:"2026-02-28", cat:"macro", title:"Crash de fin fevrier 2026 : choc petrolier",
  short:"Conflit americano-iranien et fermeture du detroit d'Ormuz : flambee du petrole et repli des actions.",
  move:"VL d'environ 147 (25/02) a 135,68 (09/03), soit environ -7,8 %", moveSign:-1,
  holdings:"Repli general ; pressions inflationnistes via l'energie ; valeurs sensibles aux taux penalisees.",
  body:`<p>Fin fevrier 2026, l'escalade au Moyen-Orient provoque un nouveau choc : les Etats-Unis lancent des operations militaires contre l'Iran (autour du 28/02/2026), qui riposte en fermant le <b>detroit d'Ormuz</b> (environ 20 % du petrole mondial transite par ce point). Le prix du brut s'envole (le WTI passe d'environ 67 $ le 27/02 a plus de 110 $ debut mars, frolant brievement 120 $), ravivant les craintes d'inflation et de stagflation.</p><p>Dans ce contexte de repli, la valeur liquidative recule d'environ <b>147 (plus-haut du 25/02) a 135,68 le 09/03</b>, soit pres de -7,8 %. C'est precisement ce choc dont le commentaire de gestion de mai 2026 soulignera ensuite l'«&nbsp;apaisement&nbsp;» et la «&nbsp;reouverture du detroit d'Ormuz&nbsp;», a l'origine du rebond du printemps.</p>`,
  sources:[{l:"Reporting mensuel CPR Invest - ESA (commentaire de mai 2026, detroit d'Ormuz)"},{l:"Export VL CPRAM (LU2570611249)"},{l:"Recherche de marche : conflit USA-Iran et fermeture du detroit d'Ormuz (fin fevrier 2026)", u:"https://en.wikipedia.org/wiki/Economic_impact_of_the_2026_Iran_war"}] },

{ id:10, date:"2026-05-15", cat:"secteur", title:"Rotation 2026 : tech & aeronautique",
  short:"Desescalade au Moyen-Orient : rebond de la tech et de l'aeronautique ; le secteur de la defense marque une pause.",
  move:"mai 2026 : fonds +5,28 % (indice +4,13 %)", moveSign:1,
  holdings:"Infineon +42 %, ASML +13 %, Safran +13 %, Rolls-Royce +13 % ; defense en repli.",
  body:`<p>Le commentaire de gestion de mai 2026 decrit un marche porte par «&nbsp;l'apaisement des tensions au Moyen-Orient&nbsp;» et la reouverture du detroit d'Ormuz. Les valeurs petrolieres refluent, l'aeronautique civile rebondit (<b>Safran +13,25 %</b>, Rolls-Royce +12,83 %) et la technologie poursuit son ascension (<b>Infineon +41,97 %</b>, ASML +13,29 %).</p><p>A l'inverse, «&nbsp;le secteur de la defense continue de souffrir&nbsp;», penalise par des sujets d'execution et par les craintes d'une reduction des depenses. La gestion en profite pour <b>renforcer les valeurs de defense</b> et des secteurs delaisses (construction avec Saint-Gobain, sante avec Merck, BioMerieux, Sanofi).</p>`,
  sources:[{l:"Reporting mensuel CPR Invest - ESA, commentaire de gestion (mai 2026)"}] },

{ id:11, date:"2026-05-31", cat:"fonds", title:"Le fonds reprend l'avantage en 2026",
  short:"Au 31/05/2026, le fonds surperforme son indice depuis le debut d'annee : +10,52 % contre +8,01 %.",
  move:"YTD 2026 : +10,52 % (indice +8,01 %, ecart +2,51 pts)", moveSign:1,
  holdings:"Selection de titres et allocation favorables en 2026.",
  body:`<p>Apres une annee 2024 en retrait et une annee 2025 dans le sillage de l'indice, <b>le fonds reprend l'avantage en 2026</b> : au 31/05/2026, il progresse de <b>+10,52 %</b> depuis le debut de l'annee contre <b>+8,01 %</b> pour le MSCI EMU, soit un ecart favorable de <b>+2,51 points</b>.</p><p><b>Point de vigilance utile pour le client :</b> sur longue periode, le fonds reste en leger retrait de son indice (ecart d'environ -1,3 point par an depuis la creation). Le redressement de 2026 illustre toutefois la pertinence du theme dans le contexte geopolitique actuel.</p>`,
  sources:[{l:"Reporting mensuel CPR Invest - ESA (31/05/2026), performances nettes par periode"}] },
];
EVENTS.forEach(e=>e.t=parseD(e.date));
const CAT_LABEL={macro:"Macro / marche", secteur:"Theme / secteur", titre:"Valeur du portefeuille", fonds:"Gestion / fonds"};
const CAT_COLOR={macro:"#001C4B", secteur:"#0082b8", titre:"#0c7a55", fonds:"#9a6a00"};

/* =========================================================================
   GRAPHIQUE SVG
   ========================================================================= */
const svg = document.getElementById("chart");
const tip = document.getElementById("tip");
const evtTip = document.getElementById("evtTip");
const chartwrap = svg ? svg.parentElement : null;
let state = { start:RANGES[0].start, end:RANGES[0].end, rangeId:RANGES[0].id,
              lastPreset:{start:RANGES[0].start,end:RANGES[0].end,id:RANGES[0].id} };
let CUR = null, drag = null, hoverMarker = null;

function interpRawAt(arr,t){
  if(!arr||!arr.length) return null;
  if(t<=arr[0].t) return arr[0].v;
  if(t>=arr[arr.length-1].t) return arr[arr.length-1].v;
  for(let i=0;i<arr.length-1;i++){
    if(t>=arr[i].t && t<=arr[i+1].t){
      const r=(t-arr[i].t)/(arr[i+1].t-arr[i].t);
      return arr[i].v+(arr[i+1].v-arr[i].v)*r;
    }
  }
  return arr[arr.length-1].v;
}
/* date de depart commune = plus tardive des premieres dates des series visibles */
function commonStartOf(start){
  let cs=start;
  for(const k of visibleSeries()){
    const arr=DATA[k]; if(!arr||!arr.length) continue;
    const f=arr.find(p=>p.t>=start-1);
    if(f && f.t>cs) cs=f.t;
  }
  return cs;
}
function windowed(key,cs,end){
  const arr=DATA[key]; if(!arr||!arr.length) return null;
  const base=interpRawAt(arr,cs); if(!base) return null;
  const pts=arr.filter(p=>p.t>=cs-1 && p.t<=end+1);
  if(pts.length<2) return null;
  return pts.map(p=>({t:p.t, y:p.v/base*100, raw:p.v}));
}
function interpY(pts,t){
  if(!pts||!pts.length) return 100;
  if(t<=pts[0].t) return pts[0].y;
  if(t>=pts[pts.length-1].t) return pts[pts.length-1].y;
  for(let i=0;i<pts.length-1;i++){
    if(t>=pts[i].t && t<=pts[i+1].t){
      const r=(t-pts[i].t)/(pts[i+1].t-pts[i].t);
      return pts[i].y+(pts[i+1].y-pts[i].y)*r;
    }
  }
  return pts[pts.length-1].y;
}
function nearestPt(pts,t){ let best=pts[0],bd=Infinity; for(const p of pts){const d=Math.abs(p.t-t); if(d<bd){bd=d;best=p;}} return best; }
function clampWin(s,e){
  const span=Math.min(e-s, FULL_SPAN);
  if(s<GLOBAL_START){ s=GLOBAL_START; e=s+span; }
  if(e>GLOBAL_END){ e=GLOBAL_END; s=e-span; }
  if(s<GLOBAL_START) s=GLOBAL_START;
  return [s,e];
}
function xTickFormat(span){ return span>2.2*YEAR ? fmtYear : fmtMonthYr; }

function render(){
  if(!svg) return;
  const W=Math.max(320, svg.clientWidth||chartwrap.clientWidth);
  const H=svg.clientHeight||560;
  svg.setAttribute("width",W); svg.setAttribute("height",H);
  svg.setAttribute("viewBox","0 0 "+W+" "+H);
  const L=54,R=20,T=22,B=36;
  const pw=W-L-R, ph=H-T-B;
  const {start,end}=state;
  const cs=commonStartOf(start);

  const reb={}; let yMin=Infinity,yMax=-Infinity;
  for(const k of visibleSeries()){
    const wk=windowed(k,cs,end); if(!wk) continue;
    reb[k]=wk;
    for(const p of wk){ if(p.y<yMin)yMin=p.y; if(p.y>yMax)yMax=p.y; }
  }
  if(yMin===Infinity){yMin=90;yMax=110;}
  const pad=(yMax-yMin)*0.10||5; yMin-=pad; yMax+=pad;

  const sx=t=>L+(t-cs)/(end-cs)*pw;
  const sy=y=>T+(yMax-y)/(yMax-yMin)*ph;

  const AX="rgba(0,28,75,.5)", GRID="rgba(0,28,75,.07)", GRIDX="rgba(0,28,75,.045)";
  let s='';
  s+=`<rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="#fff"/>`;
  if(100>=yMin&&100<=yMax){
    s+=`<line x1="${L}" y1="${sy(100)}" x2="${W-R}" y2="${sy(100)}" stroke="rgba(0,28,75,.28)" stroke-width="1" stroke-dasharray="2 3"/>`;
    s+=`<text x="${W-R}" y="${sy(100)-5}" text-anchor="end" fill="rgba(0,28,75,.45)" font-size="10">base 100</text>`;
  }
  const ticks=5;
  for(let i=0;i<=ticks;i++){
    const yv=yMin+(yMax-yMin)*i/ticks, py=sy(yv);
    s+=`<line x1="${L}" y1="${py}" x2="${W-R}" y2="${py}" stroke="${GRID}" stroke-width="1"/>`;
    s+=`<text x="${L-9}" y="${py+3.5}" text-anchor="end" fill="${AX}" font-size="10.5">${Math.round(yv)}</text>`;
  }
  const xt=6, xf=xTickFormat(end-cs);
  for(let i=0;i<=xt;i++){
    const tv=cs+(end-cs)*i/xt, px=sx(tv);
    s+=`<line x1="${px}" y1="${T}" x2="${px}" y2="${T+ph}" stroke="${GRIDX}" stroke-width="1"/>`;
    s+=`<text x="${px}" y="${T+ph+19}" text-anchor="middle" fill="${AX}" font-size="10.5">${xf(tv)}</text>`;
  }
  // courbes : autres series (trait plein, derriere) puis fonds (aire + halo, devant)
  const drawOrder=visibleSeries().filter(k=>!SERIES[k].fund).concat(visibleSeries().filter(k=>SERIES[k].fund));
  for(const k of drawOrder){
    const wk=reb[k]; if(!wk) continue; const cfg=SERIES[k];
    let line="M";
    wk.forEach((p,i)=>{ line+=(i?"L":"")+sx(p.t).toFixed(1)+" "+sy(p.y).toFixed(1)+" "; });
    if(cfg.fund && CFG.fundArea){
      let area="M"+sx(wk[0].t).toFixed(1)+" "+sy(yMin).toFixed(1)+" ";
      wk.forEach(p=>{ area+="L"+sx(p.t).toFixed(1)+" "+sy(p.y).toFixed(1)+" "; });
      area+="L"+sx(wk[wk.length-1].t).toFixed(1)+" "+sy(yMin).toFixed(1)+" Z";
      s+=`<path d="${area}" fill="url(#fillgrad)" opacity="0.9"/>`;
    }
    s+=`<path d="${line}" fill="none" stroke="${cfg.color}" stroke-width="${cfg.width}" `+
       `stroke-linejoin="round" stroke-linecap="round" `+
       `${cfg.fund&&CFG.fundArea?'filter="url(#glow)"':'opacity="0.92"'}/>`;
  }
  // marqueurs evenements (sur la courbe du fonds)
  let markers=''; const wf=reb.cpram;
  if(CFG.events && wf){
    for(const e of EVENTS){
      if(e.t<cs||e.t>end) continue;
      const cx=sx(e.t), cy=sy(interpY(wf,e.t)), col=CAT_COLOR[e.cat];
      markers+=`<g class="evt-marker" data-id="${e.id}" transform="translate(${cx.toFixed(1)},${cy.toFixed(1)})">`+
        `<circle class="mk-ring" r="12" fill="none" stroke="${col}" stroke-width="2" opacity="0"/>`+
        `<circle r="9" fill="#ffffff" stroke="${col}" stroke-width="2.5"/>`+
        `<text y="3.4" text-anchor="middle" fill="${col}" font-size="10.5" font-weight="800">${e.id}</text>`+
        `</g>`;
    }
  }
  const defs=`<defs>`+
    `<filter id="glow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#009EE0" flood-opacity="0.35"/></filter>`+
    `<linearGradient id="fillgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#009EE0" stop-opacity="0.16"/><stop offset="100%" stop-color="#009EE0" stop-opacity="0"/></linearGradient>`+
    `</defs>`;

  svg.innerHTML = defs + s + `<g id="hoverLayer"></g>` + markers;
  CUR={start:cs,end,L,R,T,B,pw,ph,W,H,reb,sx,sy,yMin,yMax};

  if(CFG.events){
    svg.querySelectorAll(".evt-marker").forEach(g=>{
      const id=+g.dataset.id;
      g.addEventListener("click",ev=>{ ev.stopPropagation(); openEvent(id); });
      g.addEventListener("mouseenter",()=>{ hoverMarker=id; hideHover(); showEvtTip(id); });
      g.addEventListener("mousemove",ev=>positionEvtTip(ev));
      g.addEventListener("mouseleave",()=>{ hoverMarker=null; hideEvtTip(); });
    });
  }

  const baseEl=document.getElementById("baseNote");
  if(baseEl){
    const note = (cs>state.start+DAY) ? ` <span style="color:var(--muted-2)">(depart commun aux courbes affichees)</span>` : "";
    baseEl.innerHTML=`Base 100 au <b>${fmtDate(cs)}</b>${note} &middot; performances indexees, nettes de frais`;
  }
  buildLiveLegend(reb);
}

function buildLiveLegend(reb){
  const box=document.getElementById("liveLegend"); if(!box) return; box.innerHTML="";
  const perfs={};
  for(const k of visibleSeries()){
    const wk=reb[k]; if(!wk) continue;
    const perf=wk[wk.length-1].y-100; perfs[k]=perf;
    const c=perf>=0?"var(--pos)":"var(--neg)";
    const el=document.createElement("span"); el.className="ll";
    el.style.cssText="display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--navy);margin-right:18px";
    el.innerHTML=`<i style="width:16px;height:3px;border-radius:2px;display:inline-block;background:${SERIES[k].color}"></i>`+
      `<b>${SERIES[k].short}</b> <b style="color:${c}">${perf>=0?'+':''}${fmtNum(perf,1)}%</b>`;
    box.appendChild(el);
  }
  if(perfs.cpram!=null && perfs.bench!=null){
    const ec=perfs.cpram-perfs.bench;
    const c=ec>=0?"var(--pos)":"var(--neg)";
    const el=document.createElement("span"); el.className="ll";
    el.style.cssText="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--muted)";
    el.innerHTML=`ecart fonds / indice&nbsp;: <b style="color:${c}">${ec>=0?'+':''}${fmtNum(ec,1)} pts</b>`;
    box.appendChild(el);
  }
}

/* ---------- Tooltip evenement ---------- */
function showEvtTip(id){
  const e=EVENTS.find(x=>x.id===id); if(!e||!evtTip) return;
  const cls=e.moveSign>0?"pos":(e.moveSign<0?"neg":"");
  const arrow=e.moveSign>0?"▲":(e.moveSign<0?"▼":"■");
  evtTip.innerHTML=`<div class="ettitle"><span class="badge ${e.cat}">${CAT_LABEL[e.cat]}</span>${e.title}</div>`+
    `<div class="etshort">${e.short}</div>`+
    `<div class="etmove mv ${cls}">${arrow} ${e.move}</div>`+
    `<div class="ethint">Cliquer pour le detail complet et les sources</div>`;
  evtTip.style.opacity=1;
}
function positionEvtTip(ev){
  if(!evtTip||!chartwrap) return;
  const rect=chartwrap.getBoundingClientRect();
  const w=evtTip.offsetWidth, h=evtTip.offsetHeight;
  let left=ev.clientX-rect.left+16, top=ev.clientY-rect.top+16;
  if(left+w>rect.width-6) left=ev.clientX-rect.left-w-16;
  if(top+h>rect.height-6) top=ev.clientY-rect.top-h-16;
  evtTip.style.left=Math.max(4,left)+"px";
  evtTip.style.top=Math.max(4,top)+"px";
}
function hideEvtTip(){ if(evtTip) evtTip.style.opacity=0; }

/* ---------- Survol (crosshair + tooltip) ---------- */
function showHover(clientX){
  if(!CUR||hoverMarker!==null||!tip) return;
  const rect=svg.getBoundingClientRect();
  const scale=CUR.W/rect.width;
  const mx=(clientX-rect.left)*scale;
  const {start,end,L,T,pw,ph,reb,sx,sy}=CUR;
  const wf=reb.cpram;
  if(mx<L||mx>L+pw||!wf){ hideHover(); return; }
  const t=start+(mx-L)/pw*(end-start);
  const ref=nearestPt(wf,t);
  const xS=sx(ref.t);
  let g=`<line x1="${xS}" y1="${T}" x2="${xS}" y2="${T+ph}" stroke="rgba(0,28,75,.35)" stroke-width="1" stroke-dasharray="3 3"/>`;
  let html=`<div class="tdate">${fmtDate(ref.t)}</div>`;
  for(const k of visibleSeries()){
    const wk=reb[k]; if(!wk) continue;
    const yv=interpY(wk,ref.t), perf=yv-100, pc=perf>=0?"#1f9d57":"#d0432b";
    g+=`<circle cx="${xS}" cy="${sy(yv)}" r="${SERIES[k].fund?4.5:3.5}" fill="${SERIES[k].color}" stroke="#fff" stroke-width="2"/>`;
    html+=`<div class="trow"><span class="tn"><span class="sw" style="background:${SERIES[k].color}"></span>${SERIES[k].short}</span>`+
      `<span class="tv">${fmtNum(yv)} <span style="color:${pc};font-weight:600">(${perf>=0?'+':''}${fmtNum(perf,1)}%)</span></span></div>`;
  }
  const hl=document.getElementById("hoverLayer"); if(hl) hl.innerHTML=g;
  tip.innerHTML=html;
  tip.style.opacity=1;
  const tw=tip.offsetWidth, ch=chartwrap.clientWidth;
  let left=(xS/scale)+14;
  if(left+tw>ch-6) left=(xS/scale)-tw-14;
  tip.style.left=Math.max(4,left)+"px";
  tip.style.top=(T/scale+6)+"px";
}
function hideHover(){ if(tip)tip.style.opacity=0; const h=document.getElementById("hoverLayer"); if(h)h.innerHTML=""; }

/* ---------- Zoom / deplacement / reset ---------- */
function setView(s,e,presetId){
  [s,e]=clampWin(s,e);
  state.start=s; state.end=e; state.rangeId=presetId||null;
  syncActive(); render();
}
if(svg){
  svg.addEventListener("wheel",function(e){
    if(!CUR) return;
    e.preventDefault();
    const rect=svg.getBoundingClientRect(), scale=CUR.W/rect.width;
    const x=(e.clientX-rect.left)*scale;
    const {L,pw}=CUR; if(x<L||x>L+pw) return;
    const span=state.end-state.start;
    const tc=state.start+(x-L)/pw*span;
    const f=e.deltaY<0?ZOOM_IN:ZOOM_OUT;
    let ns=Math.max(MIN_SPAN, Math.min(FULL_SPAN, span*f));
    let s=tc-(tc-state.start)*(ns/span), en=s+ns;
    hideEvtTip();
    setView(s,en,null);
  },{passive:false});

  svg.addEventListener("pointerdown",function(e){
    if(!CUR) return;
    if(e.target.closest && e.target.closest(".evt-marker")) return; // laisser le clic ouvrir le repere (pas de pan)
    const rect=svg.getBoundingClientRect(), scale=CUR.W/rect.width;
    const x=(e.clientX-rect.left)*scale;
    if(x<CUR.L||x>CUR.L+CUR.pw) return;
    drag={x0:e.clientX, s0:state.start, e0:state.end};
    try{svg.setPointerCapture(e.pointerId);}catch(_){}
    svg.classList.add("grabbing"); hideHover();
  });
  svg.addEventListener("pointermove",function(e){
    if(drag){
      const rect=svg.getBoundingClientRect(), scale=CUR.W/rect.width;
      const dxpx=(e.clientX-drag.x0)*scale;
      const span=drag.e0-drag.s0;
      const dt=dxpx/CUR.pw*span;
      let s=drag.s0-dt, en=drag.e0-dt;
      [s,en]=clampWin(s,en);
      state.start=s; state.end=en; state.rangeId=null; syncActive(); render();
    } else {
      showHover(e.clientX);
    }
  });
  const endDrag=function(e){ if(drag){ try{svg.releasePointerCapture(e.pointerId);}catch(_){} drag=null; svg.classList.remove("grabbing"); } };
  svg.addEventListener("pointerup",endDrag);
  svg.addEventListener("pointercancel",endDrag);
  svg.addEventListener("pointerleave",function(){ if(!drag) hideHover(); });
  svg.addEventListener("dblclick",function(){ resetZoom(); });
}
function resetZoom(){ const p=state.lastPreset; setView(p.start,p.end,p.id); }

/* =========================================================================
   MODALE (uniquement si la page contient #modal)
   ========================================================================= */
const modal=document.getElementById("modal"), modalBg=document.getElementById("modalBg");
function openEvent(id){
  const e=EVENTS.find(x=>x.id===id); if(!e||!modal) return;
  document.getElementById("mDate").innerHTML=
    `<span class="badge ${e.cat}">${CAT_LABEL[e.cat]}</span><span>${fmtDate(e.t)}</span><span>Repere n&deg;${e.id}</span>`;
  document.getElementById("mTitle").textContent=e.title;
  document.getElementById("mBody").innerHTML=e.body;
  const cls=e.moveSign>0?"pos":(e.moveSign<0?"neg":"");
  const arrow=e.moveSign>0?"▲":(e.moveSign<0?"▼":"■");
  document.getElementById("mImpact").innerHTML=
    `<div class="il">Impact / mouvement</div>`+
    `<div class="ival mv ${cls}">${arrow} ${e.move}</div>`+
    `<div class="hold"><b>Valeurs concernees :</b> ${e.holdings}</div>`;
  let src=`<div class="sl">Sources (documents CPRAM)</div>`;
  e.sources.forEach(o=>{
    if(o.u) src+=`<a class="src" href="${o.u}" target="_blank" rel="noopener">${o.l} ↗</a>`;
    else src+=`<span class="src">${o.l}</span>`;
  });
  document.getElementById("mSources").innerHTML=src;
  modalBg.classList.add("open"); modal.classList.add("open");
  document.body.style.overflow="hidden";
}
function closeModal(){ if(!modal)return; modalBg.classList.remove("open"); modal.classList.remove("open"); document.body.style.overflow=""; }
if(modalBg){ modalBg.addEventListener("click",closeModal); }
if(modal){ document.getElementById("modalClose").addEventListener("click",closeModal); }
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeModal(); });

/* =========================================================================
   CONTROLES
   ========================================================================= */
function buildControls(){
  const rb=document.getElementById("rangeBtns");
  if(rb){
    RANGES.forEach(r=>{
      const b=document.createElement("button");
      b.className="chip"+(r.id===state.rangeId?" active":"");
      b.textContent=r.label; b.dataset.rid=r.id;
      b.onclick=()=>{ state.lastPreset={start:r.start,end:r.end,id:r.id}; setView(r.start,r.end,r.id); };
      rb.appendChild(b);
    });
  }
  const eb=document.getElementById("epBtns");
  if(eb && CFG.episodes){
    EPISODES.forEach(ep=>{
      const b=document.createElement("button");
      b.className="chip ep"; b.textContent=ep.label; b.dataset.rid="ep-"+ep.id;
      b.onclick=()=>{ state.lastPreset={start:ep.start,end:ep.end,id:"ep-"+ep.id}; setView(ep.start,ep.end,"ep-"+ep.id); };
      eb.appendChild(b);
    });
  }
}
function buildSeriesControls(){
  const sb=document.getElementById("seriesBtns"); if(!sb) return;
  SERIES_ORDER.forEach(k=>{
    const cfg=SERIES[k];
    const b=document.createElement("button");
    b.className="chip series"+(cfg.on?" active":"")+(cfg.fund?" fund":"");
    b.innerHTML=`<span class="dot" style="background:${cfg.color};width:14px;height:4px;border-radius:2px"></span>${cfg.short}`;
    b.dataset.k=k;
    if(cfg.fund){ b.style.cursor="default"; b.title="Toujours affiche"; }
    else b.onclick=()=>{ cfg.on=!cfg.on; b.classList.toggle("active",cfg.on); render(); };
    sb.appendChild(b);
  });
}
function syncActive(){
  document.querySelectorAll("#rangeBtns .chip,#epBtns .chip").forEach(b=>{
    b.classList.toggle("active", b.dataset.rid===state.rangeId);
  });
}

/* ---------- INIT ---------- */
if(svg){
  buildControls();
  buildSeriesControls();
  render();
  let rT; window.addEventListener("resize",()=>{ clearTimeout(rT); rT=setTimeout(render,120); });
}

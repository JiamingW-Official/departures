/* ═══ APPLICATION ═══ */

let ROWS;
let cur=0, pg=0;
let favs=JSON.parse(localStorage.getItem('fav_airports')||'[]');
let recent=JSON.parse(localStorage.getItem('recent_airports')||'[]');
let _clockCells=[], _iataCells=[];
let depF=[], arrF=[];
let fT, pT;
let flipQueue=null;
let needsRefresh=false;
let flipGen=0;
let userIdle=0; /* auto-page pauses while user active */

const boardRows={colL:[], colR:[]};

/* ═══ CACHED DOM REFS ═══ */
let _elClock,_elDate,_elTz,_elPg,_elApIata,_elApName,_elNavF,_elNavS,_elFlights;
function cacheDom(){
  _elClock=document.getElementById('clock');
  _elDate=document.getElementById('date-info');
  _elTz=document.getElementById('tz-label');
  _elPg=document.getElementById('pginfo');
  _elApIata=document.getElementById('ap-iata');
  _elApName=document.getElementById('ap-name');
  _elNavF=document.getElementById('nav-fixed');
  _elNavS=document.getElementById('nav-scroll');
  _elFlights=document.getElementById('flights');
}

/* ═══ HEADER FLAP CELLS ═══ */
function mkHF(ch,cls){
  const d=document.createElement('div');d.className='hf'+(cls?' '+cls:'');
  const f=document.createElement('div');f.className='front';f.textContent=ch||' ';
  d.appendChild(f);d._ch=ch||' ';d._fr=f;return d;
}
function initHeaderCells(){
  _elClock.innerHTML='';_clockCells=[];
  for(let i=0;i<8;i++){
    if(i===2||i===5){
      const sep=document.createElement('div');sep.className='hf-sep';
      sep.innerHTML='<span></span><span></span>';
      _elClock.appendChild(sep);_clockCells.push(null);
    }else{
      const c=mkHF(' ');_elClock.appendChild(c);_clockCells.push(c);
    }
  }
  _elApIata.innerHTML='';_iataCells=[];
  for(let i=0;i<3;i++){
    const c=mkHF(' ','hf-iata');
    _elApIata.appendChild(c);_iataCells.push(c);
  }
}
function hFlip(cell,nc,dur){
  if(!cell||cell._flipping||cell._ch===nc)return;
  cell._flipping=true;dur=dur||(160+Math.random()*40);
  const w=cell.offsetWidth,ht=cell.offsetHeight,oc=cell._ch;
  cell._ch=nc;const fr=cell._fr;
  const t=document.createElement('div');t.className='flip-top';
  t.style.cssText=`width:${w}px;height:${ht/2}px;line-height:${ht}px`;
  t.textContent=oc;
  const b=document.createElement('div');b.className='flip-bot';
  b.style.cssText=`width:${w}px;height:${ht/2}px;line-height:0`;
  b.textContent=nc;
  cell.appendChild(t);cell.appendChild(b);
  flipSound(0.3);
  const a1=t.animate([
    {transform:'rotateX(0deg)',filter:'brightness(1)'},
    {transform:'rotateX(-90deg)',filter:'brightness(.08)'}
  ],{duration:dur*.38,easing:'ease-in',fill:'forwards'});
  a1.onfinish=()=>{
    t.remove();fr.textContent=nc;
    const a2=b.animate([
      {transform:'rotateX(90deg)',filter:'brightness(.05)'},
      {transform:'rotateX(-5deg)',filter:'brightness(1)',offset:.45},
      {transform:'rotateX(2deg)',filter:'brightness(1)',offset:.72},
      {transform:'rotateX(0deg)',filter:'brightness(1)'}
    ],{duration:dur*.62,easing:'ease-out',fill:'forwards'});
    a2.onfinish=()=>{b.remove();cell._flipping=false};
  };
}

/* ═══ SUBTITLE ═══ */
function getDualSubtitle(){return 'DEPARTURES \u00b7 ARRIVALS'}

/* ═══ PAGE UTILS ═══ */
function findNowPage(flights){
  const tz=TZ[AP[cur].c];
  const now=new Date();
  let cm;
  if(tz){
    const parts=now.toLocaleTimeString('en-GB',{timeZone:tz,hour12:false}).split(':');
    cm=parseInt(parts[0])*60+parseInt(parts[1]);
  }else{
    cm=now.getHours()*60+now.getMinutes();
  }
  /* Binary search for first flight >= cm-30 */
  const target=cm-30;
  let lo=0, hi=flights.length;
  while(lo<hi){
    const mid=(lo+hi)>>>1;
    if(flights[mid]._t<target) lo=mid+1; else hi=mid;
  }
  return Math.floor(lo/ROWS);
}
function totalPages(){return Math.max(1,Math.ceil(Math.max(depF.length,arrF.length)/ROWS))}
function flightCount(){return Math.max(depF.length,arrF.length)}

/* ═══ LAYOUT ═══ */
function calcRows(){
  /* Estimate row count from viewport — used before DOM is built */
  const cw=Math.max(13,Math.min(30,(window.innerWidth-84)/84));
  const ch=cw*1.68;
  const hdr=document.getElementById('hdr');
  const nav=document.getElementById('nav');
  const sb=document.getElementById('stats-bar');
  const chrome=(hdr?hdr.offsetHeight:50)+(nav?nav.offsetHeight:30)+(sb?sb.offsetHeight:0);
  /* Rough internal overhead: flights padding + col-label pad + col-hdr */
  const internal=Math.ceil(cw*0.45+Math.max(20,Math.min(44,window.innerWidth*0.025))+cw*0.55+8);
  const av=window.innerHeight-chrome-internal;
  return Math.min(22,Math.max(6,Math.floor(av/(ch+3))));
}
function initLayout(){
  ROWS=calcRows();
  document.documentElement.style.setProperty('--rows',ROWS);
}
function fitLayout(){
  /* Bulletproof: measure from first .frow top to #flights bottom padding edge.
     No manual overhead math — just real DOM positions. */
  const flights=document.getElementById('flights');
  if(!flights)return;
  const col=document.getElementById('colL');
  if(!col)return;
  const firstRow=col.querySelector('.frow');
  if(!firstRow)return;
  const rowCount=col.querySelectorAll('.frow').length;
  if(!rowCount)return;
  const fRect=flights.getBoundingClientRect();
  const padB=parseFloat(getComputedStyle(flights).paddingBottom)||0;
  const rowTop=firstRow.getBoundingClientRect().top;
  const avail=fRect.bottom-padB-rowTop;
  const rgap=2;
  const ch=Math.max(10,Math.floor((avail-(rowCount-1)*rgap)/rowCount));
  const cw=Math.max(13,Math.min(30,(window.innerWidth-84)/84));
  const fs=Math.min(cw*0.94,ch*0.55);
  document.documentElement.style.setProperty('--ch',ch+'px');
  document.documentElement.style.setProperty('--fs',fs+'px');
  CELL_W=0;CELL_H=0;
}

/* ═══ DOM BUILDERS ═══ */
function mkC(ch,cls){
  const d=document.createElement('div');
  d.className='cell'+(cls?' '+cls:'');
  const f=document.createElement('div');f.className='front';f.textContent=ch||' ';
  d.appendChild(f);
  d._ch=ch||' ';
  d._fr=f;
  return d;
}
function mkG(c){const d=document.createElement('div');d.className=c||'gap';return d}

function statusCls(sr){
  switch(sr){
    case 'BOARDING':case 'ARRIVING':return 'c-bo';
    case 'DELAYED':return 'c-de';
    case 'GATE OPEN':case 'EXPECTED':return 'c-go';
    case 'DEPARTED':case 'LANDED':return 'c-dp';
    case 'LAST CALL':return 'c-lc';
    case 'CANCELLED':return 'c-cx';
    default:return 'c-on';
  }
}
function breathCls(sr){
  switch(sr){
    case 'BOARDING':case 'ARRIVING':return 'bk-g';
    case 'DELAYED':return 'bk-r';
    case 'GATE OPEN':case 'EXPECTED':return 'bk-b';
    case 'LAST CALL':return 'bk-lc';
    default:return '';
  }
}

function bRow(fl,id){
  const r=document.createElement('div');r.className='frow';r.id=id;r._cells=[];r._fl=fl;
  const sc=statusCls(fl.sr), bk=breathCls(fl.sr);
  function add(s,cl){for(let i=0;i<s.length;i++){const c=mkC(s[i],cl);r.appendChild(c);r._cells.push(c)}}
  add(fl.al);         r.appendChild(mkG('gap-sm'));
  add(fl.fn);         r.appendChild(mkG());
  add(fl.ds);         r.appendChild(mkG());
  add(fl.tm);         r.appendChild(mkG());
  add(fl.gt);         r.appendChild(mkG());
  add(fl.st,sc+' '+bk);
  r.addEventListener('click',()=>{
    if(r._clicking)return;
    r._clicking=true;
    const t0=performance.now();
    let idx=0;
    function step(now){
      const elapsed=now-t0;
      while(idx<r._cells.length&&idx*12<=elapsed){
        const c=r._cells[idx],oc=c._ch;
        qFlip(c,DRUM[Math.floor(Math.random()*DRUM.length)])
          .then(()=>fFlip(c,oc,130+Math.random()*40));
        idx++;
      }
      if(idx<r._cells.length)requestAnimationFrame(step);
      else r._clicking=false;
    }
    requestAnimationFrame(step);
  });
  return r;
}
function bHdr(mode){
  const h=document.createElement('div');h.className='col-hdr';
  const dsLabel=mode==='arr'?'ORIGIN        ':'DESTINATION   ';
  const S=[['AL',W_AL],0,['FLT ',W_FN],1,[dsLabel,W_DS],1,['TIME ',W_TM],1,['GATE',W_GT],1,['STATUS   ',W_ST]];
  S.forEach(s=>{
    if(s===0){h.appendChild(mkG('gap-sm'));return}
    if(s===1){h.appendChild(mkG());return}
    for(let i=0;i<s[1];i++){const d=document.createElement('div');d.className='hcell';d.textContent=s[0][i]||'';h.appendChild(d)}
  });return h;
}

/* ═══ BOARD MANAGEMENT ═══ */
function initBoard(){
  [['colL','dep'],['colR','arr']].forEach(([cid,mode])=>{
    const col=document.getElementById(cid);
    col.innerHTML='';
    const lbl=document.createElement('div');lbl.className='col-label';
    lbl.textContent=mode==='dep'?'DEPARTURES':'ARRIVALS';
    col.appendChild(lbl);
    const frag=document.createDocumentFragment();
    frag.appendChild(bHdr(mode));
    boardRows[cid]=[];
    for(let i=0;i<ROWS;i++){
      const row=bRow(EMPTY,cid[3]+i);
      frag.appendChild(row);
      boardRows[cid].push(row);
    }
    col.appendChild(frag);
  });
}

function setRow(row,fl){
  const ch=fChars(fl);
  const sc=statusCls(fl.sr), bk=breathCls(fl.sr);
  const ss=W_AL+W_FN+W_DS+W_TM+W_GT;
  const cells=row._cells;
  for(let i=0,len=cells.length;i<len;i++){
    const c=cells[i],fr=c._fr;
    c.classList.remove('fdim');
    if(c._anim){c._anim.cancel();c._anim=null;fr.style.transform='';fr.style.filter=''}
    if(c._flipping){fr.style.transform='';fr.style.filter='';c._flipping=false}
    if(i>=ss) c.className='cell '+sc+' '+bk;
    c._ch=ch[i]||' ';
    fr.textContent=c._ch;
  }
  row._fl=fl;
}

function clearDimState(){
  ['colL','colR'].forEach(cid=>{
    const rows=boardRows[cid];
    for(let r=0;r<rows.length;r++){
      const cells=rows[r]._cells;
      for(let i=0;i<cells.length;i++){
        const c=cells[i];
        c.classList.remove('fdim');
        const s=c._fr.style;
        if(s.filter||s.transform){s.filter='';s.transform=''}
      }
    }
  });
}

/* ═══ RENDER ═══ */
function updatePgInfo(){
  const tp=totalPages();
  const fc=flightCount();
  _elPg.textContent='PAGE '+(pg+1)+'/'+tp+(fc?' \u00b7 '+fc+' FLIGHTS':'');
  updateNavPage();
}

function updatePage(animate){
  const s=pg*ROWS;
  const lf=depF.slice(s,s+ROWS), rf=arrF.slice(s,s+ROWS);

  if(!animate){
    [['colL',lf],['colR',rf]].forEach(([cid,fls])=>{
      const rows=boardRows[cid];
      for(let ri=0;ri<rows.length;ri++) setRow(rows[ri],fls[ri]||EMPTY);
    });
    updatePgInfo();
    return;
  }

  /* Build ordered queue */
  const q=[];
  const maxR=ROWS-1||1;
  [['colL',lf],['colR',rf]].forEach(([cid,fls])=>{
    const rows=boardRows[cid];
    for(let ri=0;ri<rows.length;ri++){
      const row=rows[ri];
      const fl=fls[ri]||EMPTY;
      const ch=fChars(fl);
      const sc=statusCls(fl.sr), bk=breathCls(fl.sr);
      const ss=W_AL+W_FN+W_DS+W_TM+W_GT;
      const rd=Math.pow(ri/maxR,1.3)*maxR*26;
      const cells=row._cells;
      for(let ci=0;ci<cells.length;ci++){
        const nc=ch[ci]||' ';
        if(ci>=ss) cells[ci].className='cell '+sc+' '+bk;
        if(cells[ci]._ch===nc)continue;
        q.push({c:cells[ci],nc,t:rd+ci*2.5});
      }
      row._fl=fl;
    }
  });

  q.sort((a,b)=>a.t-b.t);

  if(flipQueue){flipQueue.cancelled=true;clearDimState()}

  const state={cancelled:false};
  flipQueue=state;
  const t0=performance.now();
  let di=0,ti=0;
  const DIM=32;

  function step(now){
    if(state.cancelled)return;
    const elapsed=now-t0;
    while(di<q.length&&q[di].t<=elapsed){
      const e=q[di];
      if(e.c._anim){e.c._anim.cancel();e.c._anim=null}
      if(e.c._flipping){
        e.c.querySelectorAll('.flip-top,.flip-bot,.flip-shadow').forEach(x=>x.remove());
        e.c._flipping=false;
      }
      e.c.classList.add('fdim');
      massFlipSound();
      di++;
    }
    while(ti<q.length&&q[ti].t+DIM<=elapsed){
      const e=q[ti];
      e.c._ch=e.nc;
      e.c._fr.textContent=e.nc;
      e.c.classList.remove('fdim');
      ti++;
    }
    if(di<q.length||ti<q.length)requestAnimationFrame(step);
    else flipQueue=null;
  }
  requestAnimationFrame(step);
  updatePgInfo();
}

/* ═══ REAL-TIME FLIGHT DATA ═══ */
let useRealData=false;

fetch('/api/status').then(r=>r.json()).then(d=>{useRealData=!!d.hasKey}).catch(()=>{});

function mapStatus(f,type){
  const st=f.flight_status;
  const dep=f.departure||{}, arr=f.arrival||{};
  const delay=type==='dep'?dep.delay:arr.delay;
  const hasDelay=delay&&delay>0;

  if(st==='cancelled'||st==='diverted') return 'CANCELLED';

  if(type==='dep'){
    if(st==='landed') return 'DEPARTED';
    if(st==='active'&&dep.actual) return 'DEPARTED';
    if(dep.actual) return 'DEPARTED';
    const sched=dep.scheduled?new Date(dep.scheduled):null;
    if(sched){
      const diff=(sched.getTime()-Date.now())/60000;
      if(diff<-10) return 'DEPARTED';
      if(diff<-3) return hasDelay?'DELAYED':'DEPARTED';
      if(diff<0) return 'LAST CALL';
      if(diff<=8) return 'BOARDING';
      if(diff<=20) return hasDelay?'DELAYED':'GATE OPEN';
      if(diff<=40) return hasDelay?'DELAYED':'GATE OPEN';
      if(diff<=90) return hasDelay?'DELAYED':'ON TIME';
    }
    if(st==='delayed'||hasDelay) return 'DELAYED';
    return 'ON TIME';
  }else{
    if(st==='landed') return 'LANDED';
    if(arr.actual) return 'LANDED';
    const sched=arr.scheduled?new Date(arr.scheduled):null;
    if(sched){
      const diff=(sched.getTime()-Date.now())/60000;
      if(diff<-10) return 'LANDED';
      if(diff<-3) return hasDelay?'DELAYED':'LANDED';
      if(diff<=3) return 'ARRIVING';
      if(diff<=15) return hasDelay?'DELAYED':'EXPECTED';
      if(diff<=45) return hasDelay?'DELAYED':'EXPECTED';
      if(diff<=90) return hasDelay?'DELAYED':'ON TIME';
    }
    if(st==='delayed'||hasDelay) return 'DELAYED';
    return 'ON TIME';
  }
}

/* Shorten airport/city names like real FIDS boards */
const CITY_SHORT={
SJU:'SAN JUAN',SDQ:'STO DOMINGO',LGA:'NEW YORK LGA',LAS:'LAS VEGAS',
MSY:'NEW ORLEANS',GUA:'GUATEMALA CITY',POS:'PORT O SPAIN',
DCA:'WASHINGTON DC',IAD:'WASHINGTON IAD',BWI:'BALTIMORE',
MDW:'CHICAGO MIDWAY',MDE:'MEDELLIN',CTG:'CARTAGENA',
MBJ:'MONTEGO BAY',SJO:'SAN JOSE CR',SAP:'SAN PEDRO SULA',
BZE:'BELIZE CITY',PUJ:'PUNTA CANA',GCM:'GRAND CAYMAN',
SXM:'ST MAARTEN',STT:'ST THOMAS',STX:'ST CROIX',
UVF:'ST LUCIA',SKB:'ST KITTS',ANU:'ANTIGUA',BON:'BONAIRE',
AUA:'ARUBA',GND:'GRENADA',BDA:'BERMUDA',NAS:'NASSAU',
GIG:'RIO DE JANEIRO',VCP:'CAMPINAS',EZE:'BUENOS AIRES',
DOH:'DOHA',GRU:'SAO PAULO',YUL:'MONTREAL',YOW:'OTTAWA',
DTW:'DETROIT',CMH:'COLUMBUS',SDF:'LOUISVILLE',MSP:'MINNEAPOLIS',
MCI:'KANSAS CITY',SLC:'SALT LAKE CITY',BNA:'NASHVILLE',
RDU:'RALEIGH DURHAM',GSP:'GREENVILLE SC',JAX:'JACKSONVILLE',
IND:'INDIANAPOLIS',AUS:'AUSTIN',TPA:'TAMPA',SRQ:'SARASOTA',
PNS:'PENSACOLA',SAV:'SAVANNAH',CLE:'CLEVELAND',MKE:'MILWAUKEE',
PIT:'PITTSBURGH',ORF:'NORFOLK',CHS:'CHARLESTON',MEM:'MEMPHIS',
OMA:'OMAHA',CLO:'CALI',BAQ:'BARRANQUILLA',MGA:'MANAGUA',
LRM:'LA ROMANA',CAP:'CAP HAITIEN',KIN:'KINGSTON',HOG:'HOLGUIN',
DAL:'DALLAS LOVE',FPO:'FREEPORT',EYW:'KEY WEST',CZM:'COZUMEL',
GEO:'GEORGETOWN',STI:'SANTIAGO DR',LIR:'LIBERIA CR',
};
function shortDsName(raw,iata){
  /* 1. Check our destinations DB */
  const entry=DS_MAP[iata];
  if(entry)return entry[0];
  /* 2. Check city shortname lookup */
  if(CITY_SHORT[iata])return CITY_SHORT[iata];
  /* 3. Strip common suffixes */
  let s=raw.toUpperCase()
    .replace(/\b(INTERNATIONAL|INTL\.?|AIRPORT|AEROPORTO?|AEROPORT|AEROPUERTO|FLUGHAFEN|TERMINAL\s*\d*)\b/g,'')
    .replace(/[-]/g,' ').replace(/\s+/g,' ').trim();
  if(s.length<=W_DS)return s;
  /* 4. Progressively remove trailing words until it fits */
  const words=s.split(' ');
  while(words.length>1&&words.join(' ').length>W_DS)words.pop();
  return words.join(' ').substring(0,W_DS);
}

function parseApiFlights(data,type,apCode){
  if(!data||!data.data||!data.data.length) return [];
  const flights=[];
  const items=data.data;
  const tz=TZ[apCode];
  const now=new Date();
  const todayStr=tz?now.toLocaleDateString('en-CA',{timeZone:tz}):null;
  for(let i=0;i<items.length;i++){
    const f=items[i];
    const dep=f.departure||{}, arr=f.arrival||{};
    const al=(f.airline?.iata||'').padEnd(W_AL).substring(0,W_AL);
    if(!al.trim()) continue;
    const fn=(f.flight?.number||'').padStart(W_FN).substring(0,W_FN);
    const dsIata=type==='dep'?(arr.iata||''):(dep.iata||'');
    const dsRaw=type==='dep'?(arr.airport||dsIata):(dep.airport||dsIata);
    const dsShort=shortDsName(dsRaw,dsIata);
    const ds=dsShort.substring(0,W_DS).padEnd(W_DS);
    const schedStr=type==='dep'?dep.scheduled:arr.scheduled;
    let tm='     ', rawMin=0, schedEpoch=0;
    if(schedStr){
      const d=new Date(schedStr);
      schedEpoch=d.getTime();
      if(tz){
        /* Use airport timezone for display & sorting */
        const tParts=d.toLocaleTimeString('en-GB',{timeZone:tz,hour12:false}).split(':');
        tm=tParts[0]+':'+tParts[1];
        const localMin=parseInt(tParts[0])*60+parseInt(tParts[1]);
        const dateStr=d.toLocaleDateString('en-CA',{timeZone:tz});
        const dayOff=dateStr>todayStr?1:(dateStr<todayStr?-1:0);
        rawMin=localMin+dayOff*1440;
      }else{
        tm=p2(d.getHours())+':'+p2(d.getMinutes());
        rawMin=d.getHours()*60+d.getMinutes();
      }
    }
    const gate=type==='dep'?(dep.gate||''):(arr.gate||'');
    const terminal=type==='dep'?(dep.terminal||''):(arr.terminal||'');
    const gtRaw=gate?String(gate):(terminal?'T'+terminal:'');
    const gt=gtRaw.substring(0,W_GT).padEnd(W_GT);
    const flDelay=type==='dep'?(dep.delay||0):(arr.delay||0);
    const sr=mapStatus(f,type);
    const st=sr.padEnd(W_ST).substring(0,W_ST);
    flights.push({al,fn,ds,tm,gt,st,sr,_t:rawMin,_sched:schedEpoch,_delay:flDelay});
  }
  flights.sort((a,b)=>a._t-b._t);
  return flights;
}

async function fetchRealFlights(airport,type){
  try{
    const r=await fetch(`/api/flights?airport=${airport}&type=${type}`);
    const data=await r.json();
    return parseApiFlights(data,type,airport);
  }catch(e){
    console.warn('API fetch failed:',e);
    return null;
  }
}

/* ═══ EXTEND & BALANCE ═══ */
function extendAndBalance(a){
  const tz=TZ[a.c];
  const now=new Date();
  let cm;
  if(tz){
    const parts=now.toLocaleTimeString('en-GB',{timeZone:tz,hour12:false}).split(':');
    cm=parseInt(parts[0])*60+parseInt(parts[1]);
  }else{cm=now.getHours()*60+now.getMinutes()}
  const targetEnd=cm+1440;
  /* Extend into next day — push onto existing arrays (no spread copy) */
  const depEnd=depF.length?depF[depF.length-1]._t:0;
  if(depEnd<targetEnd){
    const fill=genF(a,Math.max(80,Math.ceil((targetEnd-depEnd)/6)),false,depEnd+5);
    for(let i=0;i<fill.length;i++)depF.push(fill[i]);
  }
  const arrEnd=arrF.length?arrF[arrF.length-1]._t:0;
  if(arrEnd<targetEnd){
    const fill=genF(a,Math.max(80,Math.ceil((targetEnd-arrEnd)/6)),true,arrEnd+5);
    for(let i=0;i<fill.length;i++)arrF.push(fill[i]);
  }
  /* Balance — pad shorter column */
  const maxLen=Math.max(depF.length,arrF.length);
  if(depF.length<maxLen){
    const fill=genF(a,maxLen-depF.length,false,depF[depF.length-1]._t+5);
    for(let i=0;i<fill.length;i++)depF.push(fill[i]);
  }
  if(arrF.length<maxLen){
    const fill=genF(a,maxLen-arrF.length,true,arrF[arrF.length-1]._t+5);
    for(let i=0;i<fill.length;i++)arrF.push(fill[i]);
  }
}

/* ═══ LOAD AIRPORT ═══ */
async function loadAirport(idx,animate){
  const a=AP[idx];
  for(let i=0;i<3;i++) hFlip(_iataCells[i],a.c[i]||' ',180+i*50);
  _elApName.textContent=a.n;
  document.title=a.c+' \u2014 DEPARTURES \u00b7 ARRIVALS';

  /* Loading state */
  _elFlights.classList.add('loading');

  if(useRealData){
    const [rd,ra]=await Promise.all([
      fetchRealFlights(a.c,'dep'),
      fetchRealFlights(a.c,'arr')
    ]);
    lastFetchTime=Date.now();
    if(rd&&rd.length) depF=rd;
    else depF=genF(a,500,false,0);
    if(ra&&ra.length) arrF=ra;
    else arrF=genF(a,500,true,0);
  }else{
    depF=genF(a,500,false,0);
    arrF=genF(a,500,true,0);
  }

  /* Extend + balance: ensure 24h coverage from now into next day */
  extendAndBalance(a);

  _elFlights.classList.remove('loading');
  renderStats();

  pg=findNowPage(depF);
  updatePage(animate);

  renderNav(idx);

  /* Update clock immediately for new timezone */
  tick();
}

/* ═══ LIVE STATUS REFRESH ═══ */
function computeStatus(type,diff,hasDelay){
  if(type==='dep'){
    if(diff<-10)return'DEPARTED';
    if(diff<-3)return hasDelay?'DELAYED':'DEPARTED';
    if(diff<0)return'LAST CALL';
    if(diff<=8)return'BOARDING';
    if(diff<=20)return hasDelay?'DELAYED':'GATE OPEN';
    if(diff<=40)return hasDelay?'DELAYED':'GATE OPEN';
    if(diff<=90)return hasDelay?'DELAYED':'ON TIME';
    return hasDelay?'DELAYED':'ON TIME';
  }else{
    if(diff<-10)return'LANDED';
    if(diff<-3)return hasDelay?'DELAYED':'LANDED';
    if(diff<=3)return'ARRIVING';
    if(diff<=15)return hasDelay?'DELAYED':'EXPECTED';
    if(diff<=45)return hasDelay?'DELAYED':'EXPECTED';
    if(diff<=90)return hasDelay?'DELAYED':'ON TIME';
    return hasDelay?'DELAYED':'ON TIME';
  }
}
function refreshStatuses(){
  const code=AP[cur].c;
  const tz=TZ[code];
  const now=new Date();
  let cm;
  if(tz){
    const parts=now.toLocaleTimeString('en-GB',{timeZone:tz,hour12:false}).split(':');
    cm=parseInt(parts[0])*60+parseInt(parts[1]);
  }else{cm=now.getHours()*60+now.getMinutes()}
  const nowMs=now.getTime();
  let changed=false;
  [['dep',depF],['arr',arrF]].forEach(([type,flights])=>{
    for(let i=0;i<flights.length;i++){
      const f=flights[i];
      const diff=f._sched?(f._sched-nowMs)/60000:(f._t-cm);
      const newSr=computeStatus(type,diff,(f._delay||0)>0);
      if(newSr!==f.sr){
        f.sr=newSr;
        f.st=newSr.padEnd(W_ST).substring(0,W_ST);
        changed=true;
      }
    }
  });
  if(changed){updateStatusCells();updateNavStats();renderStats()}
}
function updateStatusCells(){
  const s=pg*ROWS;
  const lf=depF.slice(s,s+ROWS),rf=arrF.slice(s,s+ROWS);
  [['colL',lf],['colR',rf]].forEach(([cid,fls])=>{
    const rows=boardRows[cid];
    for(let ri=0;ri<rows.length;ri++){
      const fl=fls[ri]||EMPTY;
      const row=rows[ri];
      if(row._fl.sr===fl.sr)continue; /* skip unchanged */
      const sc=statusCls(fl.sr),bk=breathCls(fl.sr);
      const ss=W_AL+W_FN+W_DS+W_TM+W_GT;
      const cells=row._cells;
      for(let i=ss;i<cells.length;i++){
        const nc=fl.st[i-ss]||' ';
        cells[i].className='cell '+sc+' '+bk;
        if(cells[i]._ch!==nc){cells[i]._ch=nc;cells[i]._fr.textContent=nc}
      }
      row._fl=fl;
    }
  });
}

/* ═══ RANDOM FLIP ═══ */
function rFlip(){
  const gen=flipGen;
  const cid=Math.random()<.5?'colL':'colR';
  const rows=boardRows[cid];
  if(!rows.length){fT=setTimeout(rFlip,2e3);return}
  const row=rows[Math.floor(Math.random()*rows.length)];
  if(!row?._cells){fT=setTimeout(rFlip,2e3);return}
  const fld=FIELDS[Math.floor(Math.random()*FIELDS.length)];
  for(let i=fld.s;i<fld.e;i++){
    const c=row._cells[i], oc=c._ch;
    const delay=(i-fld.s)*20+Math.random()*15;
    setTimeout(()=>{
      if(gen!==flipGen)return;
      qFlip(c,DRUM[Math.floor(Math.random()*DRUM.length)])
        .then(()=>fFlip(c,oc,160+Math.random()*50));
    },delay);
  }
  fT=setTimeout(rFlip,3000+Math.random()*4000);
}

/* ═══ AUTO-PAGINATION ═══ */
async function autoP(){
  userIdle++;
  /* Only auto-page if user has been idle for at least 1 cycle */
  if(userIdle<2){pT=setTimeout(autoP,30e3);return}

  const pages=totalPages();
  const nextPg=pg+1;

  if(nextPg>=pages||needsRefresh){
    /* Reached end or stale — refresh & return to now */
    const a=AP[cur];
    if(useRealData){
      const [rd,ra]=await Promise.all([
        fetchRealFlights(a.c,'dep'),
        fetchRealFlights(a.c,'arr')
      ]);
      lastFetchTime=Date.now();
      if(rd&&rd.length) depF=rd;
      else depF=genF(a,500,false,0);
      if(ra&&ra.length) arrF=ra;
      else arrF=genF(a,500,true,0);
    }else{
      depF=genF(a,500,false,0);
      arrF=genF(a,500,true,0);
    }
    extendAndBalance(a);
    renderStats();
    pg=findNowPage(depF);
    needsRefresh=false;
  }else{
    /* Forward only — never jump backward */
    pg=nextPg;
  }
  updatePage(true);
  pT=setTimeout(autoP,30e3);
}

/* ═══ AIRPORT SWITCH ═══ */
async function sw(i){
  if(i===cur)return;
  clearTimeout(fT); clearTimeout(pT);
  if(flipQueue){flipQueue.cancelled=true;clearDimState();flipQueue=null}
  flipGen++;
  cur=i;
  userIdle=0;
  trackRecent(AP[i].c);
  await loadAirport(i,true);
  fT=setTimeout(rFlip,1200);
  pT=setTimeout(autoP,30e3);
}

/* ═══ FAVORITES ═══ */
function toggleFav(){
  const code=AP[cur].c;
  const idx=favs.indexOf(code);
  if(idx>=0) favs.splice(idx,1);
  else favs.push(code);
  localStorage.setItem('fav_airports',JSON.stringify(favs));
  renderNav(cur);
}
let lastFetchTime=0;
/* Build nav structure once, then update parts */
function initNav(){
  _elNavF.innerHTML=
    '<button class="mute-btn" id="nb-mute"></button>'+
    '<button class="fav-btn" id="nb-fav"></button>'+
    '<span class="live-tag" id="nb-live"><span class="live-dot-sm"></span><span id="nb-live-txt">LIVE</span></span>';
  _elNavS.innerHTML=
    '<div class="nav-recent" id="nb-recent"></div>'+
    '<span class="nav-div" id="nb-d1"></span>'+
    '<div class="nav-stats" id="nb-stats"></div>'+
    '<span class="nav-div" id="nb-d2"></span>'+
    '<button class="nav-pg" id="nb-pg" onclick="navNextPage()"><span id="nb-pg-txt"></span><div class="nav-pg-bar" id="nb-pg-bar"></div></button>'+
    '<span class="nav-div"></span>'+
    '<div class="nav-search" onclick="openSearch()"><span class="ns-key">/</span>SEARCH</div>';
  document.getElementById('nb-mute').onclick=()=>toggleMute();
  document.getElementById('nb-fav').onclick=()=>toggleFav();
}
function renderNav(idx){
  /* Mute */
  const mb=document.getElementById('nb-mute');
  mb.textContent='\u266A';mb.className='mute-btn'+(audioMuted?'':' on');
  /* Fav */
  const isFav=favs.includes(AP[idx].c);
  const fb=document.getElementById('nb-fav');
  fb.textContent=isFav?'\u2605':'\u2606';fb.className='fav-btn'+(isFav?' on':'');
  /* LIVE + age */
  const lv=document.getElementById('nb-live');
  lv.style.display=useRealData?'flex':'none';
  if(useRealData){
    const ago=lastFetchTime?Math.floor((Date.now()-lastFetchTime)/60000):0;
    document.getElementById('nb-live-txt').textContent=ago>0?'LIVE \u00b7 '+ago+'M':'LIVE';
  }
  /* Recent airports */
  const rc=document.getElementById('nb-recent');
  let rh='';
  recent.slice(0,5).forEach(c=>{
    const fi=AP.findIndex(a=>a.c===c);
    if(fi<0)return;
    rh+=`<button onclick="sw(${fi})" class="${fi===idx?'act':''}">${c}</button>`;
  });
  rc.innerHTML=rh;
  document.getElementById('nb-d1').style.display=rh?'':'none';
  /* Stats */
  updateNavStats();
  /* Page */
  updateNavPage();
}
function updateNavStats(){
  const el=document.getElementById('nb-stats');
  if(!el)return;
  const all=[...depF,...arrF];
  if(!all.length){el.innerHTML='';document.getElementById('nb-d2').style.display='none';return}
  document.getElementById('nb-d2').style.display='';
  const c={};
  all.forEach(f=>{if(f.sr)c[f.sr]=(c[f.sr]||0)+1});
  const onTime=(c['ON TIME']||0)+(c['GATE OPEN']||0)+(c['EXPECTED']||0);
  const boarding=(c['BOARDING']||0)+(c['ARRIVING']||0);
  const delayed=(c['DELAYED']||0)+(c['LAST CALL']||0)+(c['CANCELLED']||0);
  const h=[];
  if(onTime)h.push(`<span class="ns-item ns-on"><span class="ns-dot"></span>${onTime}</span>`);
  if(boarding)h.push(`<span class="ns-item ns-bo"><span class="ns-dot"></span>${boarding}</span>`);
  if(delayed)h.push(`<span class="ns-item ns-de"><span class="ns-dot"></span>${delayed}</span>`);
  el.innerHTML=h.join('');
}
function updateNavPage(){
  const t=document.getElementById('nb-pg-txt');
  const b=document.getElementById('nb-pg-bar');
  if(!t)return;
  const tp=totalPages();
  t.textContent=(pg+1)+'/'+tp;
  b.style.width=tp>1?((pg+1)/tp*100).toFixed(1)+'%':'100%';
}
function navNextPage(){
  userIdle=0;clearTimeout(pT);
  const pages=totalPages();
  pg=(pg+1)%pages;updatePage(true);
  updateNavPage();
  pT=setTimeout(autoP,30e3);
}

/* ═══ JUMP TO NOW ═══ */
function jumpToNow(){
  clearTimeout(pT);
  userIdle=0;
  pg=findNowPage(depF);
  updatePage(true);
  pT=setTimeout(autoP,30e3);
}

/* ═══ FULLSCREEN ═══ */
function toggleFullscreen(){
  if(!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
  else document.exitFullscreen().catch(()=>{});
}

/* ═══ CLOCK & DATE ═══ */
/* Cache formatted timezone abbreviation per airport */
const _tzAbbr={};
function getTzAbbr(code){
  if(_tzAbbr[code])return _tzAbbr[code];
  const tz=TZ[code];
  if(!tz)return '';
  try{
    const parts=new Date().toLocaleTimeString('en-US',{timeZone:tz,timeZoneName:'short'}).split(' ');
    const abbr=parts[parts.length-1];
    _tzAbbr[code]=abbr;
    return abbr;
  }catch(e){return ''}
}

function tick(){
  const code=AP[cur].c;
  const tz=TZ[code]||undefined;
  const t=new Date();
  const ts=t.toLocaleTimeString('en-GB',{timeZone:tz,hour12:false});
  for(let i=0;i<8;i++){
    if(!_clockCells[i])continue;
    hFlip(_clockCells[i],ts[i]||' ',140+Math.random()*30);
  }
  _elDate.textContent=t.toLocaleDateString('en-US',{timeZone:tz,weekday:'short',day:'numeric',month:'short',year:'numeric'}).toUpperCase();
  _elTz.textContent=getTzAbbr(code);
  /* Update LIVE age every tick */
  if(useRealData&&lastFetchTime){
    const ago=Math.floor((Date.now()-lastFetchTime)/60000);
    const el=document.getElementById('nb-live-txt');
    if(el)el.textContent=ago>0?'LIVE \u00b7 '+ago+'M':'LIVE';
  }
}

/* ═══ DUST PARTICLES ═══ */
function initDust(){
  const c=_elFlights;
  for(let i=0;i<8;i++){
    const d=document.createElement('div');d.className='dust';
    const sz=1+Math.random()*1.5;
    const x=Math.random()*100, y=15+Math.random()*75;
    const dx=(Math.random()-.5)*120, dy=-(30+Math.random()*80);
    const dur=18+Math.random()*22, del=Math.random()*dur;
    const op=0.03+Math.random()*0.04;
    d.style.cssText=`left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;`+
      `background:rgba(255,240,200,${op*3});`+
      `--dx:${dx}px;--dy:${dy}px;--do:${op};`+
      `animation-duration:${dur}s;animation-delay:-${del}s`;
    c.appendChild(d);
  }
}

/* ═══ RECENT AIRPORTS ═══ */
function trackRecent(code){
  recent=recent.filter(c=>c!==code);
  recent.unshift(code);
  if(recent.length>5)recent=recent.slice(0,5);
  localStorage.setItem('recent_airports',JSON.stringify(recent));
}

/* ═══ STATS BAR ═══ */
function renderStats(){
  const bar=document.getElementById('stats-bar');
  if(!bar)return;
  const all=[...depF,...arrF];
  const counts={};
  all.forEach(f=>{if(f.sr)counts[f.sr]=(counts[f.sr]||0)+1});
  const total=all.length||1;
  const segs=[
    ['ON TIME','#3a3828'],['GATE OPEN','#2a4a3a'],['EXPECTED','#2a3a4a'],
    ['BOARDING','#50d070'],['ARRIVING','#50d070'],
    ['DELAYED','#e05040'],['LAST CALL','#c04030'],
    ['DEPARTED','#1a1810'],['LANDED','#1a1810'],
    ['CANCELLED','#802020']
  ];
  bar.innerHTML=segs.map(([s,c])=>{
    const n=counts[s]||0;
    if(!n)return'';
    return`<div class="stat-seg" style="width:${(n/total*100).toFixed(1)}%;background:${c}" title="${s}: ${n}"></div>`;
  }).join('');
}

/* ═══ HELP OVERLAY ═══ */
let helpOpen=false;
function toggleHelp(){
  helpOpen=!helpOpen;
  document.getElementById('help').classList.toggle('open',helpOpen);
}

/* ═══ SEARCH ═══ */
let srchOpen=false, srchIdx=0;
let srchTab='ap';
let srchFlFilter='ALL';
let srchItems=[], srchFlRes=[];
let _srchT;

const SR_COLORS={
  'ON TIME':'#d8d0b0','BOARDING':'#44c060','GATE OPEN':'#4890c0',
  'DELAYED':'#c84840','DEPARTED':'#302e28','LAST CALL':'#c84840',
  'CANCELLED':'rgba(180,64,52,.6)','LANDED':'#302e28','ARRIVING':'#44c060',
  'EXPECTED':'#4890c0'
};

function buildFlightFilters(){
  const el=document.getElementById('search-filters');
  const chips=['ALL','BOARDING','DELAYED','GATE OPEN','DEPARTED','LANDED','CANCELLED'];
  el.innerHTML=chips.map(f=>`<button class="sf-chip${f===srchFlFilter?' act':''}" onclick="setFlFilter('${f}')">${f}</button>`).join('');
}
function setFlFilter(f){
  srchFlFilter=f;srchIdx=0;
  document.querySelectorAll('.sf-chip').forEach(b=>b.classList.toggle('act',b.textContent===f));
  filterFlights(document.getElementById('search-input').value);
}
function setSearchTab(tab){
  srchTab=tab;srchIdx=0;srchFlFilter='ALL';
  document.querySelectorAll('.stab').forEach(t=>t.classList.toggle('act',t.textContent.trim()===(tab==='ap'?'AIRPORTS':'FLIGHTS')));
  const inp=document.getElementById('search-input');
  const filters=document.getElementById('search-filters');
  inp.placeholder=tab==='ap'?'AIRPORT CODE OR NAME...':'FLIGHT, AIRLINE, OR DESTINATION...';
  inp.value='';inp.focus();
  if(tab==='ap'){filters.innerHTML='';filterSearch('')}
  else{buildFlightFilters();filterFlights('')}
}

function openSearch(){
  document.getElementById('search').classList.add('open');
  const inp=document.getElementById('search-input');
  inp.value='';inp.focus();
  srchIdx=0;srchFlFilter='ALL';
  if(srchTab==='ap'){document.getElementById('search-filters').innerHTML='';filterSearch('')}
  else{buildFlightFilters();filterFlights('')}
  srchOpen=true;
}
function closeSearch(){
  document.getElementById('search').classList.remove('open');
  srchOpen=false;srchIdx=0;
}

function highlightMatch(text,q){
  if(!q)return text;
  const idx=text.toUpperCase().indexOf(q);
  if(idx<0)return text;
  return text.substring(0,idx)+'<span class="si-match">'+text.substring(idx,idx+q.length)+'</span>'+text.substring(idx+q.length);
}
function filterSearch(q){
  q=q.toUpperCase().trim();
  srchItems=[];
  if(!q){
    /* Empty: recent → favorites → by region */
    const recentIdxs=recent.map(c=>AP.findIndex(a=>a.c===c)).filter(i=>i>=0);
    if(recentIdxs.length){
      srchItems.push({divider:'RECENT'});
      recentIdxs.forEach(i=>srchItems.push({idx:i}));
    }
    const favIdxs=favs.map(c=>AP.findIndex(a=>a.c===c)).filter(i=>i>=0&&!recent.includes(AP[i].c));
    if(favIdxs.length){
      srchItems.push({divider:'FAVORITES'});
      favIdxs.forEach(i=>srchItems.push({idx:i}));
    }
    for(const region of Object.keys(REGIONS)){
      const codes=REGIONS[region];
      const idxs=codes.map(c=>AP.findIndex(a=>a.c===c)).filter(i=>i>=0);
      if(idxs.length){
        srchItems.push({divider:region});
        idxs.forEach(i=>srchItems.push({idx:i}));
      }
    }
  }else{
    /* Score-based fuzzy ranking */
    const scored=[];
    AP.forEach((a,i)=>{
      let score=0;
      const code=a.c,name=a.n.toUpperCase(),sub=(a.s||'').toUpperCase();
      if(code===q)score=100;
      else if(code.startsWith(q))score=80;
      else if(code.includes(q))score=60;
      else if(name.includes(q))score=40;
      else if(sub.includes(q))score=20;
      if(score){
        if(favs.includes(a.c))score+=5;
        if(recent.includes(a.c))score+=3;
        scored.push({idx:i,score});
      }
    });
    scored.sort((a,b)=>b.score-a.score);
    scored.forEach(s=>srchItems.push({idx:s.idx}));
  }
  srchIdx=Math.min(srchIdx,Math.max(0,countSelectable(srchItems)-1));
  renderSearch();
}
function renderSearch(){
  const box=document.getElementById('search-results');
  const selCount=countSelectable(srchItems);
  if(!selCount){
    box.innerHTML='<div class="search-empty">NO AIRPORTS FOUND</div>';
    return;
  }
  const q=document.getElementById('search-input').value.toUpperCase().trim();
  let si=0;
  box.innerHTML=srchItems.map(item=>{
    if(item.divider)return`<div class="search-group">${item.divider}</div>`;
    const a=AP[item.idx];
    const cls=si===srchIdx?'search-item active':'search-item';
    const region=AP_REGION[a.c]||'';
    const isFav=favs.includes(a.c);
    const codeTxt=highlightMatch(a.c,q);
    const nameTxt=highlightMatch(a.n,q);
    const favIcon=isFav?'<span style="color:#c8a830;margin-right:4px">\u2605</span>':'';
    const regionTag=region&&!q?`<span class="si-region">${region}</span>`:'';
    const sub=a.s&&a.s!=='DEPARTURES'&&q?`<span class="si-sub">${a.s}</span>`:'';
    si++;
    return`<div class="${cls}" onmousedown="selectSearch(${item.idx})">${favIcon}<span class="si-code">${codeTxt}</span><span class="si-name">${nameTxt}</span>${sub}${regionTag}</div>`;
  }).join('');
  const act=box.querySelector('.active');
  if(act)act.scrollIntoView({block:'nearest'});
}
function selectSearch(idx){
  closeSearch();
  if(idx!==cur)sw(idx);
}

function filterFlights(q){
  q=q.toUpperCase().trim();
  srchFlRes=[];
  const curCode=AP[cur].c;
  const local=[];
  for(let i=0;i<depF.length;i++){
    const fl=depF[i];
    if(srchFlFilter!=='ALL'&&fl.sr!==srchFlFilter)continue;
    if(!q||matchFlight(fl,q,curCode)) local.push({fl,idx:i,col:'L',apIdx:-1,from:curCode,to:fl.ds.trim()});
  }
  for(let i=0;i<arrF.length;i++){
    const fl=arrF[i];
    if(srchFlFilter!=='ALL'&&fl.sr!==srchFlFilter)continue;
    if(!q||matchFlight(fl,q,curCode)) local.push({fl,idx:i,col:'R',apIdx:-1,from:fl.ds.trim(),to:curCode});
  }
  srchFlRes=local;
  if(q.length>=2){
    const global=searchFamous(q);
    if(global.length){
      srchFlRes.push({divider:'GLOBAL FLIGHTS'});
      srchFlRes.push(...global);
    }
  }
  srchIdx=Math.min(srchIdx,Math.max(0,countSelectable(srchFlRes)-1));
  renderFlightResults();
}

function matchFlight(fl,q,curCode){
  const al=fl.al.trim(),fn=fl.fn.trim(),ds=fl.ds.trim(),sr=fl.sr;
  if(al.includes(q)||(al+fn).includes(q)||fn.includes(q)||ds.includes(q)||sr.includes(q))return true;
  /* Also match origin/destination IATA codes */
  if(curCode&&curCode.includes(q))return true;
  /* Match IATA code in DS_MAP by destination name */
  for(const code in DS_MAP){if(code.includes(q)&&DS_MAP[code][0].toUpperCase()===ds)return true}
  return false;
}

function searchFamous(q){
  const results=[];
  const seen=new Set();
  for(const key in FAMOUS){
    const parts=key.split(':');
    const al=parts[0], from=parts[1], to=parts[2];
    const fn=FAMOUS[key].toString();
    const fullCode=al+fn;
    if(al.includes(q)||fullCode.includes(q)||(al+' '+fn).includes(q)||from.includes(q)||to.includes(q)){
      if(from===AP[cur].c) continue;
      if(seen.has(key)) continue;
      seen.add(key);
      const apIdx=AP.findIndex(a=>a.c===from);
      if(apIdx<0) continue;
      const dsEntry=DS_MAP[to];
      const dsName=dsEntry?dsEntry[0]:'';
      results.push({
        fl:{al:al.padEnd(W_AL),fn:fn.padStart(W_FN),ds:dsName.padEnd(W_DS).substring(0,W_DS),
            tm:'     ',gt:'    ',st:'         ',sr:''},
        idx:-1,apIdx,apCode:from,from,to
      });
      if(results.length>=15) break;
    }
  }
  return results;
}

function countSelectable(arr){let n=0;for(let i=0;i<arr.length;i++){if(!arr[i].divider)n++}return n}
function getSelectableIdx(arr,si){
  let n=0;
  for(let i=0;i<arr.length;i++){
    if(arr[i].divider) continue;
    if(n===si) return i;
    n++;
  }
  return -1;
}

function renderFlightResults(){
  const box=document.getElementById('search-results');
  if(!srchFlRes.length||countSelectable(srchFlRes)===0){
    box.innerHTML='<div class="search-empty">NO FLIGHTS FOUND</div>';
    return;
  }
  let si=0;
  box.innerHTML=srchFlRes.map((r,i)=>{
    if(r.divider) return `<div class="search-divider">${r.divider}</div>`;
    const fl=r.fl;
    const cls=si===srchIdx?'search-flight active':'search-flight';
    const stColor=SR_COLORS[fl.sr]||'#e0d8b8';
    let routeTag='';
    if(r.from&&r.to){
      routeTag=`<span class="sf-route">${r.col==='L'?AP[cur].c:r.from}→${r.col==='L'?r.to:AP[cur].c}</span>`;
    }else if(r.apIdx>=0){
      routeTag=`<span class="sf-ap">${r.apCode||AP[r.apIdx].c}</span>`;
    }else if(r.col){
      routeTag=`<span class="sf-ap">${r.col==='L'?'DEP':'ARR'}</span>`;
    }
    const html=`<div class="${cls}" onmousedown="selectFlight(${i})">
      <span class="sf-al">${fl.al.trim()}</span>
      <span class="sf-fn">${fl.fn.trim()}</span>
      <span class="sf-ds">${fl.ds.trim()}</span>
      <span class="sf-tm">${fl.tm.trim()}</span>
      <span class="sf-st" style="color:${stColor}">${fl.sr}</span>${routeTag}</div>`;
    si++;
    return html;
  }).join('');
  const act=box.querySelector('.search-flight.active');
  if(act) act.scrollIntoView({block:'nearest'});
}

function selectFlight(rawIdx){
  const r=srchFlRes[rawIdx];
  if(!r||r.divider) return;
  closeSearch();
  if(r.apIdx>=0) goToFamous(r.apIdx,r.fl.al.trim(),r.fl.fn.trim());
  else navigateToFlight(r.idx,r.col||'L');
}

function navigateToFlight(flightIdx,col){
  const targetPg=Math.floor(flightIdx/ROWS);
  if(targetPg!==pg){
    clearTimeout(pT);
    pg=targetPg;
    updatePage(true);
    pT=setTimeout(autoP,30e3);
  }
  const ri=flightIdx-targetPg*ROWS;
  const cid=col==='R'?'colR':'colL';
  const rows=boardRows[cid];
  if(rows[ri]){
    const row=rows[ri];
    row.classList.remove('highlight');
    void row.offsetWidth;
    row.classList.add('highlight');
    row.addEventListener('animationend',()=>row.classList.remove('highlight'),{once:true});
  }
}

async function goToFamous(apIdx,al,fn){
  const wasAp=cur;
  if(apIdx!==cur){
    clearTimeout(fT);clearTimeout(pT);
    if(flipQueue){flipQueue.cancelled=true;clearDimState();flipQueue=null}
    flipGen++;
    cur=apIdx;
    await loadAirport(apIdx,true);
    fT=setTimeout(rFlip,1200);
    pT=setTimeout(autoP,30e3);
  }
  let target=depF.findIndex(f=>f.al.trim()===al&&f.fn.trim()===fn);
  let col='L';
  if(target<0){target=arrF.findIndex(f=>f.al.trim()===al&&f.fn.trim()===fn);col='R'}
  if(target>=0){
    setTimeout(()=>navigateToFlight(target,col),apIdx!==wasAp?400:50);
  }
}

document.getElementById('search').addEventListener('mousedown',e=>{
  if(e.target===e.currentTarget) closeSearch();
});
document.getElementById('search-input').addEventListener('input',e=>{
  srchIdx=0;
  clearTimeout(_srchT);
  _srchT=setTimeout(()=>{
    if(srchTab==='ap')filterSearch(e.target.value);
    else filterFlights(e.target.value);
  },60);
});

/* ═══ KEYBOARD NAV ═══ */
document.addEventListener('keydown',e=>{
  /* Help overlay — any key closes */
  if(helpOpen){e.preventDefault();toggleHelp();return}

  if(srchOpen){
    if(e.key==='Escape'){e.preventDefault();closeSearch();return}
    if(e.key==='Tab'){e.preventDefault();setSearchTab(srchTab==='ap'?'fl':'ap');return}
    const maxAp=countSelectable(srchItems),maxFl=countSelectable(srchFlRes);
    if(e.key==='ArrowDown'){
      e.preventDefault();
      const max=srchTab==='ap'?maxAp:maxFl;
      srchIdx=Math.min(srchIdx+1,max-1);
      srchTab==='ap'?renderSearch():renderFlightResults();return;
    }
    if(e.key==='ArrowUp'){
      e.preventDefault();srchIdx=Math.max(srchIdx-1,0);
      srchTab==='ap'?renderSearch():renderFlightResults();return;
    }
    if(e.key==='PageDown'){
      e.preventDefault();
      const max=srchTab==='ap'?maxAp:maxFl;
      srchIdx=Math.min(srchIdx+10,max-1);
      srchTab==='ap'?renderSearch():renderFlightResults();return;
    }
    if(e.key==='PageUp'){
      e.preventDefault();srchIdx=Math.max(srchIdx-10,0);
      srchTab==='ap'?renderSearch():renderFlightResults();return;
    }
    if(e.key==='Home'){
      e.preventDefault();srchIdx=0;
      srchTab==='ap'?renderSearch():renderFlightResults();return;
    }
    if(e.key==='End'){
      e.preventDefault();
      srchIdx=(srchTab==='ap'?maxAp:maxFl)-1;
      srchTab==='ap'?renderSearch():renderFlightResults();return;
    }
    if(e.key==='Enter'){
      e.preventDefault();
      if(srchTab==='ap'){const ri=getSelectableIdx(srchItems,srchIdx);if(ri>=0)selectSearch(srchItems[ri].idx)}
      else{const ri=getSelectableIdx(srchFlRes,srchIdx);if(ri>=0)selectFlight(ri)}
      return;
    }
    return;
  }

  if(e.key==='?'){toggleHelp();return}
  if(e.key==='/'){e.preventDefault();openSearch();return}
  if(e.key==='m'||e.key==='M'){toggleMute();return}
  if(e.key==='n'||e.key==='N'){jumpToNow();return}
  if(e.key==='f'||e.key==='F'){toggleFullscreen();return}
  if(e.key==='s'||e.key==='S'){toggleFav();return}
  /* Number keys 1-9: jump to page */
  if(e.key>='1'&&e.key<='9'){
    const tp=parseInt(e.key)-1,pages=totalPages();
    if(tp<pages){userIdle=0;clearTimeout(pT);pg=tp;updatePage(true);pT=setTimeout(autoP,30e3)}
    return;
  }
  if(e.key==='ArrowUp'){e.preventDefault();userIdle=0;clearTimeout(pT);const pages=totalPages();pg=(pg-1+pages)%pages;updatePage(true);pT=setTimeout(autoP,30e3)}
  if(e.key==='ArrowDown'){e.preventDefault();userIdle=0;clearTimeout(pT);const pages=totalPages();pg=(pg+1)%pages;updatePage(true);pT=setTimeout(autoP,30e3)}
  if(e.key==='ArrowRight'){e.preventDefault();sw((cur+1)%AP.length)}
  if(e.key==='ArrowLeft'){e.preventDefault();sw((cur-1+AP.length)%AP.length)}
});

/* ═══ TOUCH / TRACKPAD SWIPE ═══ */
let tx0=0,ty0=0,swT=0;
_elFlights=document.getElementById('flights');
_elFlights.addEventListener('touchstart',e=>{
  tx0=e.touches[0].clientX;ty0=e.touches[0].clientY;
},{passive:true});
_elFlights.addEventListener('touchend',e=>{
  if(Date.now()-swT<400)return;
  const dx=e.changedTouches[0].clientX-tx0;
  const dy=e.changedTouches[0].clientY-ty0;
  if(Math.abs(dx)>Math.abs(dy)*1.5&&Math.abs(dx)>50){
    swT=Date.now();
    if(dx>0) sw((cur-1+AP.length)%AP.length);
    else sw((cur+1)%AP.length);
  }
},{passive:true});

/* ═══ WHEEL NAV ═══ */
let whlT=0;
_elFlights.addEventListener('wheel',e=>{
  if(Date.now()-whlT<350)return;
  whlT=Date.now();
  e.preventDefault();
  if(e.deltaY>0||e.deltaX>0) sw((cur+1)%AP.length);
  else sw((cur-1+AP.length)%AP.length);
},{passive:false});

/* ═══ PAGE CLICK ═══ */
document.getElementById('pginfo').addEventListener('click',()=>{
  userIdle=0;
  const pages=totalPages();
  if(pages>1){
    clearTimeout(pT);
    pg=(pg+1)%pages;
    updatePage(true);
    pT=setTimeout(autoP,30e3);
  }
});

/* ═══ INIT ═══ */
cacheDom();
initHeaderCells();
initNav();
initLayout();
initBoard();
fitLayout();
tick(); setInterval(tick,1e3);

setTimeout(async ()=>{
  await loadAirport(0,false);
  fitLayout(); /* re-fit after content loaded */
  requestAnimationFrame(fitLayout); /* and once more after paint */
  fT=setTimeout(rFlip,1500);
  pT=setTimeout(autoP,30e3);
},100);

document.addEventListener('click',()=>initAudio(),{once:true});

/* Refresh flight data every 5 min */
setInterval(()=>{needsRefresh=true},5*60*1e3);
/* Live status recompute every 30s — statuses evolve with time */
setInterval(refreshStatuses,30e3);

/* Resize: fast path (every frame) + slow path (debounced rebuild) */
let _resizeRaf,_resizeT;
window.addEventListener('resize',()=>{
  /* Fast: just re-fit cells to new container size — runs every frame, no jank */
  cancelAnimationFrame(_resizeRaf);
  _resizeRaf=requestAnimationFrame(fitLayout);
  /* Slow: check if row count changed, rebuild board if needed */
  clearTimeout(_resizeT);
  _resizeT=setTimeout(async ()=>{
    const oldRows=ROWS;
    initLayout();
    if(ROWS!==oldRows){
      initBoard();
      fitLayout();
      await loadAirport(cur,false);
    }
  },400);
});

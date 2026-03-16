/* ═══ APPLICATION ═══ */

let ROWS;
let cur=0, pg=0;
let favs=JSON.parse(localStorage.getItem('fav_airports')||'[]');
let _clockCells=[], _iataCells=[];
let depF=[], arrF=[];
let fT, pT;
let flipQueue=null;
let needsRefresh=false;
let flipGen=0;
let userIdle=0; /* auto-page pauses while user active */

const boardRows={colL:[], colR:[]};

/* ═══ CACHED DOM REFS ═══ */
let _elClock,_elDate,_elTz,_elPg,_elApIata,_elApName,_elApSub,_elNavF,_elNavS,_elFlights;
function cacheDom(){
  _elClock=document.getElementById('clock');
  _elDate=document.getElementById('date-info');
  _elTz=document.getElementById('tz-label');
  _elPg=document.getElementById('pginfo');
  _elApIata=document.getElementById('ap-iata');
  _elApName=document.getElementById('ap-name');
  _elApSub=document.getElementById('ap-sub');
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

/* ═══ SUBTITLE LOOKUP ═══ */
const ARR_LABELS={
  'DEPARTURES':'ARRIVALS','DEPARTS':'ARRIVÉES',
  'ABFLUG':'ANKUNFT','VERTREK':'AANKOMST',
  'PARTENZE':'ARRIVI','KALKIŞLAR':'VARIŞLAR',
  'SALIDAS':'LLEGADAS','PARTIDAS':'CHEGADAS',
  'AVGANGER':'ANKOMSTER','AVGÅNGAR':'ANKOMSTER',
  'LÄHDÖT':'SAAPUVAT','ODLOTY':'PRZYLOTY',
  'ODLETY':'PŘÍLETY','INDULÁS':'ÉRKEZÉS',
  'ΑΝΑΧΩΡΗΣΕΙΣ':'ΑΦΙΞΕΙΣ',
  '出発':'到着','出发':'到达',
  '離港':'抵港','출발':'도착','出境':'入境'
};
const _arrRe=new RegExp(Object.keys(ARR_LABELS).join('|'),'g');
function getSubtitle(ap,mode){
  const s=ap.s||'DEPARTURES';
  if(mode!=='arr')return s;
  return s.replace(_arrRe,m=>ARR_LABELS[m]||m);
}
function getDualSubtitle(ap){
  const s=ap.s||'DEPARTURES';
  const arrS=getSubtitle(ap,'arr');
  const dp=s.split(' · '), ap2=arrS.split(' · ');
  if(dp[0]&&ap2[0]&&dp[0]!==ap2[0]) return dp[0]+' · '+ap2[0];
  return 'DEPARTURES · ARRIVALS';
}

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
  const cw=Math.max(13,Math.min(30,(window.innerWidth-84)/84));
  const ch=cw*1.68;
  const hdr=document.getElementById('hdr');
  const nav=document.getElementById('nav');
  const used=(hdr?hdr.offsetHeight:50)+(nav?nav.offsetHeight:30)+12;
  const av=window.innerHeight-used;
  return Math.min(22,Math.max(8,Math.floor(av/(ch+3))));
}
function initLayout(){
  ROWS=calcRows();
  document.documentElement.style.setProperty('--rows',ROWS);
  const hdr=document.getElementById('hdr');
  const nav=document.getElementById('nav');
  const used=(hdr?hdr.offsetHeight:50)+(nav?nav.offsetHeight:30)+12;
  document.documentElement.style.setProperty('--board-offset',used+'px');
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

  if(st==='cancelled') return 'CANCELLED';
  if(st==='diverted') return 'CANCELLED';

  if(type==='dep'){
    if(st==='landed'||st==='active') return 'DEPARTED';
    if(dep.actual) return 'DEPARTED';
    const sched=dep.scheduled?new Date(dep.scheduled):null;
    if(sched){
      const diff=(sched.getTime()-Date.now())/60000;
      if(diff<-5) return 'DEPARTED';
      if(diff<0) return 'LAST CALL';
      if(diff<=10) return 'BOARDING';
      if(diff<=25) return delay>0?'DELAYED':'GATE OPEN';
      if(diff<=45) return delay>0?'DELAYED':'GATE OPEN';
    }
    return delay>0?'DELAYED':'ON TIME';
  }else{
    if(st==='landed') return 'LANDED';
    if(arr.actual) return 'LANDED';
    const sched=arr.scheduled?new Date(arr.scheduled):null;
    if(sched){
      const diff=(sched.getTime()-Date.now())/60000;
      if(diff<-5) return 'LANDED';
      if(diff<=5) return 'ARRIVING';
      if(diff<=30) return delay>0?'DELAYED':'EXPECTED';
    }
    return delay>0?'DELAYED':'ON TIME';
  }
}

function parseApiFlights(data,type){
  if(!data||!data.data||!data.data.length) return [];
  const flights=[];
  const items=data.data;
  for(let i=0;i<items.length;i++){
    const f=items[i];
    const dep=f.departure||{}, arr=f.arrival||{};
    const al=(f.airline?.iata||'').padEnd(W_AL).substring(0,W_AL);
    if(!al.trim()) continue;
    const fn=(f.flight?.number||'').padStart(W_FN).substring(0,W_FN);
    const dsAirport=type==='dep'?(arr.iata||''):(dep.iata||'');
    const dsName=type==='dep'?(arr.airport||dsAirport):(dep.airport||dsAirport);
    const ds=dsName.toUpperCase().substring(0,W_DS).padEnd(W_DS);
    const schedStr=type==='dep'?dep.scheduled:arr.scheduled;
    let tm='     ', rawMin=0;
    if(schedStr){
      const d=new Date(schedStr);
      tm=p2(d.getHours())+':'+p2(d.getMinutes());
      rawMin=d.getHours()*60+d.getMinutes();
    }
    const gate=type==='dep'?(dep.gate||''):(arr.gate||'');
    const terminal=type==='dep'?(dep.terminal||''):(arr.terminal||'');
    const gtRaw=gate?String(gate):(terminal?'T'+terminal:'');
    const gt=gtRaw.substring(0,W_GT).padEnd(W_GT);
    const sr=mapStatus(f,type);
    const st=sr.padEnd(W_ST).substring(0,W_ST);
    flights.push({al,fn,ds,tm,gt,st,sr,_t:rawMin});
  }
  flights.sort((a,b)=>a._t-b._t);
  return flights;
}

async function fetchRealFlights(airport,type){
  try{
    const r=await fetch(`/api/flights?airport=${airport}&type=${type}`);
    const data=await r.json();
    return parseApiFlights(data,type);
  }catch(e){
    console.warn('API fetch failed:',e);
    return null;
  }
}

/* ═══ LOAD AIRPORT ═══ */
async function loadAirport(idx,animate){
  const a=AP[idx];
  for(let i=0;i<3;i++) hFlip(_iataCells[i],a.c[i]||' ',180+i*50);
  _elApName.textContent=a.n;
  _elApSub.textContent=getDualSubtitle(a);
  document.title=a.c+' \u2014 DEPARTURES \u00b7 ARRIVALS';

  /* Loading state */
  _elFlights.classList.add('loading');

  if(useRealData){
    const [rd,ra]=await Promise.all([
      fetchRealFlights(a.c,'dep'),
      fetchRealFlights(a.c,'arr')
    ]);
    if(rd&&rd.length) depF=rd;
    else depF=genF(a,350,false,0);
    if(ra&&ra.length) arrF=ra;
    else arrF=genF(a,350,true,0);
  }else{
    depF=genF(a,350,false,0);
    arrF=genF(a,350,true,0);
  }

  _elFlights.classList.remove('loading');

  pg=findNowPage(depF);
  updatePage(animate);

  renderNav(idx);

  /* Update clock immediately for new timezone */
  tick();
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
    const delay=(i-fld.s)*18+Math.random()*12;
    setTimeout(()=>{
      if(gen!==flipGen)return;
      const steps=2+Math.floor(Math.random()*3);
      let chain=Promise.resolve();
      for(let j=0;j<steps;j++){
        const rc=DRUM[Math.floor(Math.random()*DRUM.length)];
        chain=chain.then(()=>qFlip(c,rc));
      }
      chain.then(()=>fFlip(c,oc,180+Math.random()*60));
    },delay);
  }
  fT=setTimeout(rFlip,1500+Math.random()*2500);
}

/* ═══ AUTO-PAGINATION ═══ */
async function autoP(){
  userIdle++;
  /* Only auto-page if user has been idle for at least 1 cycle */
  if(userIdle<2){pT=setTimeout(autoP,12e3);return}
  if(needsRefresh){
    if(useRealData){
      const [rd,ra]=await Promise.all([
        fetchRealFlights(AP[cur].c,'dep'),
        fetchRealFlights(AP[cur].c,'arr')
      ]);
      if(rd&&rd.length) depF=rd;
      if(ra&&ra.length) arrF=ra;
    }else{
      depF=genF(AP[cur],350,false,0);
      arrF=genF(AP[cur],350,true,0);
    }
    pg=findNowPage(depF);
    needsRefresh=false;
  }
  const pages=totalPages();
  if(pages>1){pg=(pg+1)%pages; updatePage(true)}
  pT=setTimeout(autoP,12e3);
}

/* ═══ AIRPORT SWITCH ═══ */
async function sw(i){
  if(i===cur)return;
  clearTimeout(fT); clearTimeout(pT);
  if(flipQueue){flipQueue.cancelled=true;clearDimState();flipQueue=null}
  flipGen++;
  cur=i;
  userIdle=0;
  await loadAirport(i,true);
  fT=setTimeout(rFlip,1200);
  pT=setTimeout(autoP,12e3);
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
function renderNav(idx){
  const liveTag=useRealData?'<button class="live-btn" disabled>LIVE</button>':'';
  const isFav=favs.includes(AP[idx].c);
  _elNavF.innerHTML=
    `<button onclick="toggleMute()" id="mute-btn" class="mute-btn${audioMuted?'':' on'}">${audioMuted?'\u266A OFF':'\u266A ON'}</button>`+
    '<button onclick="openSearch()" class="search-btn">/  SEARCH</button>'+
    `<button onclick="toggleFav()" class="fav-btn${isFav?' on':''}">${isFav?'\u2605':'\u2606'}</button>`+
    liveTag;

  /* Build nav: favorites first, then divider, then all */
  let html='';
  const favIdxs=[];
  favs.forEach(code=>{const fi=AP.findIndex(a=>a.c===code);if(fi>=0)favIdxs.push(fi)});
  if(favIdxs.length){
    favIdxs.forEach(fi=>{
      html+=`<button onclick="sw(${fi})" class="fav${fi===idx?' act':''}">${AP[fi].c}</button>`;
    });
    html+='<span class="nav-div"></span>';
  }
  AP.forEach((x,i)=>{
    html+=`<button onclick="sw(${i})" class="${i===idx?'act':''}">${x.c}</button>`;
  });
  _elNavS.innerHTML=html;
  setTimeout(()=>{
    const b=_elNavS.querySelector('.act');
    if(b) b.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
  },60);
}

/* ═══ JUMP TO NOW ═══ */
function jumpToNow(){
  clearTimeout(pT);
  userIdle=0;
  pg=findNowPage(depF);
  updatePage(true);
  pT=setTimeout(autoP,12e3);
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
}

/* ═══ DUST PARTICLES ═══ */
function initDust(){
  const c=_elFlights;
  for(let i=0;i<16;i++){
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

/* ═══ SEARCH ═══ */
let srchOpen=false, srchIdx=0, srchRes=[];
let srchTab='ap';
let srchFlRes=[];

const SR_COLORS={
  'ON TIME':'#e0d8b8','BOARDING':'#50d070','GATE OPEN':'#58a0d8',
  'DELAYED':'#e05040','DEPARTED':'#4a4838','LAST CALL':'#e05040',
  'CANCELLED':'rgba(224,80,64,.7)','LANDED':'#4a4838','ARRIVING':'#50d070',
  'EXPECTED':'#58a0d8'
};

function setSearchTab(tab){
  srchTab=tab;
  srchIdx=0;
  const tabs=document.querySelectorAll('.stab');
  tabs.forEach(t=>t.classList.toggle('act',t.textContent.trim()===(tab==='ap'?'AIRPORTS':'FLIGHTS')));
  const inp=document.getElementById('search-input');
  inp.placeholder=tab==='ap'?'AIRPORT CODE OR NAME...':'FLIGHT, AIRLINE, OR DESTINATION...';
  inp.value='';
  inp.focus();
  if(tab==='ap') filterSearch('');
  else filterFlights('');
}

function openSearch(){
  const el=document.getElementById('search');
  el.classList.add('open');
  const inp=document.getElementById('search-input');
  inp.value='';
  inp.focus();
  srchIdx=0;
  if(srchTab==='ap') filterSearch('');
  else filterFlights('');
  srchOpen=true;
}
function closeSearch(){
  document.getElementById('search').classList.remove('open');
  srchOpen=false;
  srchIdx=0;
}

function filterSearch(q){
  q=q.toUpperCase().trim();
  if(!q){
    srchRes=AP.map((_,i)=>i);
  }else{
    const code=[],name=[];
    AP.forEach((a,i)=>{
      if(a.c.toUpperCase().includes(q)) code.push(i);
      else if(a.n.toUpperCase().includes(q)||a.s.toUpperCase().includes(q)) name.push(i);
    });
    srchRes=[...code,...name];
  }
  srchIdx=Math.min(srchIdx,Math.max(0,srchRes.length-1));
  renderSearch();
}
function renderSearch(){
  const box=document.getElementById('search-results');
  if(!srchRes.length){
    box.innerHTML='<div class="search-empty">NO AIRPORTS FOUND</div>';
    return;
  }
  box.innerHTML=srchRes.map((apIdx,i)=>{
    const a=AP[apIdx];
    const cls=i===srchIdx?'search-item active':'search-item';
    const sub=a.s&&a.s!=='DEPARTURES'?`<span class="si-sub">${a.s}</span>`:'';
    return `<div class="${cls}" onmousedown="selectSearch(${apIdx})">
      <span class="si-code">${a.c}</span><span class="si-name">${a.n}</span>${sub}</div>`;
  }).join('');
  const act=box.querySelector('.search-item.active');
  if(act) act.scrollIntoView({block:'nearest'});
}
function selectSearch(idx){
  closeSearch();
  if(idx!==cur) sw(idx);
}

function filterFlights(q){
  q=q.toUpperCase().trim();
  srchFlRes=[];
  const local=[];
  for(let i=0;i<depF.length;i++){
    if(!q||matchFlight(depF[i],q)) local.push({fl:depF[i],idx:i,col:'L',apIdx:-1});
  }
  for(let i=0;i<arrF.length;i++){
    if(!q||matchFlight(arrF[i],q)) local.push({fl:arrF[i],idx:i,col:'R',apIdx:-1});
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

function matchFlight(fl,q){
  const al=fl.al.trim(), fn=fl.fn.trim(), ds=fl.ds.trim(), sr=fl.sr;
  return al.includes(q)||(al+fn).includes(q)||fn.includes(q)||ds.includes(q)||sr.includes(q);
}

function searchFamous(q){
  const results=[];
  const seen=new Set();
  for(const key in FAMOUS){
    const parts=key.split(':');
    const al=parts[0], from=parts[1], to=parts[2];
    const fn=FAMOUS[key].toString();
    const fullCode=al+fn;
    if(al.includes(q)||fullCode.includes(q)||(al+' '+fn).includes(q)){
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
        idx:-1,apIdx,apCode:from
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
    const apTag=r.apIdx>=0?`<span class="sf-ap">${r.apCode||AP[r.apIdx].c}</span>`:
      (r.col?`<span class="sf-ap">${r.col==='L'?'DEP':'ARR'}</span>`:'');
    const html=`<div class="${cls}" onmousedown="selectFlight(${i})">
      <span class="sf-al">${fl.al.trim()}</span>
      <span class="sf-fn">${fl.fn.trim()}</span>
      <span class="sf-ds">${fl.ds.trim()}</span>
      <span class="sf-tm">${fl.tm.trim()}</span>
      <span class="sf-st" style="color:${stColor}">${fl.sr}</span>${apTag}</div>`;
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
    pT=setTimeout(autoP,12e3);
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
    pT=setTimeout(autoP,12e3);
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
  if(srchTab==='ap') filterSearch(e.target.value);
  else filterFlights(e.target.value);
});

/* ═══ KEYBOARD NAV ═══ */
document.addEventListener('keydown',e=>{
  if(srchOpen){
    if(e.key==='Escape'){e.preventDefault();closeSearch();return}
    if(e.key==='Tab'){e.preventDefault();setSearchTab(srchTab==='ap'?'fl':'ap');return}
    if(e.key==='ArrowDown'){
      e.preventDefault();
      if(srchTab==='ap'){srchIdx=Math.min(srchIdx+1,srchRes.length-1);renderSearch()}
      else{srchIdx=Math.min(srchIdx+1,countSelectable(srchFlRes)-1);renderFlightResults()}
      return;
    }
    if(e.key==='ArrowUp'){
      e.preventDefault();
      if(srchTab==='ap'){srchIdx=Math.max(srchIdx-1,0);renderSearch()}
      else{srchIdx=Math.max(srchIdx-1,0);renderFlightResults()}
      return;
    }
    if(e.key==='Enter'){
      e.preventDefault();
      if(srchTab==='ap'){if(srchRes.length)selectSearch(srchRes[srchIdx])}
      else{const ri=getSelectableIdx(srchFlRes,srchIdx);if(ri>=0) selectFlight(ri)}
      return;
    }
    return;
  }
  if(e.key==='/'){e.preventDefault();openSearch();return}
  if(e.key==='m'||e.key==='M'){toggleMute();return}
  if(e.key==='n'||e.key==='N'){jumpToNow();return}
  if(e.key==='f'||e.key==='F'){toggleFullscreen();return}
  if(e.key==='s'||e.key==='S'){toggleFav();return}
  if(e.key==='ArrowUp'){e.preventDefault();userIdle=0;clearTimeout(pT);const pages=totalPages();pg=(pg-1+pages)%pages;updatePage(true);pT=setTimeout(autoP,12e3)}
  if(e.key==='ArrowDown'){e.preventDefault();userIdle=0;clearTimeout(pT);const pages=totalPages();pg=(pg+1)%pages;updatePage(true);pT=setTimeout(autoP,12e3)}
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
    pT=setTimeout(autoP,12e3);
  }
});

/* ═══ INIT ═══ */
cacheDom();
initHeaderCells();
initLayout();
initBoard();
initDust();
tick(); setInterval(tick,1e3);

setTimeout(async ()=>{
  await loadAirport(0,false);
  fT=setTimeout(rFlip,1500);
  pT=setTimeout(autoP,12e3);
},150);

document.addEventListener('click',()=>initAudio(),{once:true});

/* Refresh flight data every 5 min */
setInterval(()=>{needsRefresh=true},5*60*1e3);

/* Debounced resize */
let _resizeT;
window.addEventListener('resize',()=>{
  clearTimeout(_resizeT);
  _resizeT=setTimeout(async ()=>{
    const oldRows=ROWS;
    CELL_W=0;CELL_H=0;
    initLayout();
    if(ROWS!==oldRows) initBoard();
    await loadAirport(cur,false);
  },150);
});

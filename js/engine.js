/* ═══ SPLIT-FLAP FLIP ENGINE ═══ */

const DRUM='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-:. ';

/* Status color lookup — eliminates getComputedStyle calls */
const STATUS_COLORS={
  'c-on':'#e0d8b8','c-bo':'#50d070','c-de':'#e05040',
  'c-go':'#58a0d8','c-dp':'#5a5440','c-lc':'#e05040','c-cx':'rgba(224,80,64,.75)'
};
function getCellColor(cell){
  const cls=cell.className;
  for(const k in STATUS_COLORS){if(cls.includes(k))return STATUS_COLORS[k]}
  return '#e0d8b8';
}

/* ═══ ELEMENT POOL — avoids createElement/remove on every flip ═══ */
const _pool={top:[],bot:[],sh:[]};
function _get(type){
  const p=_pool[type];
  if(p.length)return p.pop();
  const d=document.createElement('div');
  d.className=type==='top'?'flip-top':type==='bot'?'flip-bot':'flip-shadow';
  return d;
}
function _ret(el,type){if(_pool[type].length<24)_pool[type].push(el)}

/* Pre-computed shadow heights */
let _shH18='',_shH06='';

/*
 * qFlip — Quick intermediate flip (~55ms, no bounce, no shadow).
 * Uses pooled overlay elements.
 */
function qFlip(cell,nc){
  if(cell._flipping)return Promise.resolve();
  cell._flipping=true;
  const dur=45+Math.random()*20;
  const oc=cell._ch;
  cell._ch=nc;
  return new Promise(res=>{
    if(!CELL_W){CELL_W=cell.offsetWidth;CELL_H=cell.offsetHeight;_shH18=Math.round(CELL_H*0.18)+'px';_shH06=Math.round(CELL_H*0.06)+'px'}
    const w=CELL_W,ht=CELL_H;
    const fr=cell._fr,col=getCellColor(cell);
    const t=_get('top');
    t.style.cssText=`width:${w}px;height:${ht/2}px;line-height:${ht}px;color:${col}`;
    t.textContent=oc;
    const b=_get('bot');
    b.style.cssText=`width:${w}px;height:${ht/2}px;line-height:0;color:${col}`;
    b.textContent=nc;
    cell.appendChild(t);cell.appendChild(b);
    flipSound(0.5);
    const a1=t.animate([
      {transform:'rotateX(0deg)',filter:'brightness(1)'},
      {transform:'rotateX(-90deg)',filter:'brightness(.12)'}
    ],{duration:dur*.4,easing:'linear',fill:'forwards'});
    a1.onfinish=()=>{
      t.remove();_ret(t,'top');
      fr.textContent=nc;
      const a2=b.animate([
        {transform:'rotateX(90deg)',filter:'brightness(.08)'},
        {transform:'rotateX(0deg)',filter:'brightness(1)'}
      ],{duration:dur*.6,easing:'ease-out',fill:'forwards'});
      a2.onfinish=()=>{
        b.remove();_ret(b,'bot');
        cell._flipping=false;res();
      };
    };
  });
}

/*
 * fFlip — Final flip with pronounced mechanical bounce + shadow.
 */
function fFlip(cell,nc,dur){
  if(cell._flipping||cell._ch===nc)return Promise.resolve();
  cell._flipping=true;
  dur=dur||(200+Math.random()*80);
  return new Promise(res=>{
    if(!CELL_W){CELL_W=cell.offsetWidth;CELL_H=cell.offsetHeight;_shH18=Math.round(CELL_H*0.18)+'px';_shH06=Math.round(CELL_H*0.06)+'px'}
    const w=CELL_W,ht=CELL_H,oc=cell._ch;
    cell._ch=nc;
    const fr=cell._fr,col=getCellColor(cell);
    const t=_get('top');
    t.style.cssText=`width:${w}px;height:${ht/2}px;line-height:${ht}px;color:${col}`;
    t.textContent=oc;
    const b=_get('bot');
    b.style.cssText=`width:${w}px;height:${ht/2}px;line-height:0;color:${col}`;
    b.textContent=nc;
    const sh=_get('sh');
    cell.appendChild(t);cell.appendChild(b);cell.appendChild(sh);
    flipSound(0.7);
    sh.animate([
      {height:'0px',opacity:0},
      {height:_shH18,opacity:.65,offset:.35},
      {height:_shH06,opacity:.25,offset:.7},
      {height:'0px',opacity:0}
    ],{duration:dur,easing:'ease-out',fill:'forwards'});
    const a1=t.animate([
      {transform:'rotateX(0deg)',filter:'brightness(1)'},
      {transform:'rotateX(-90deg)',filter:'brightness(.08)'}
    ],{duration:dur*.34,easing:'ease-in',fill:'forwards'});
    a1.onfinish=()=>{
      t.remove();_ret(t,'top');
      fr.textContent=nc;
      const a2=b.animate([
        {transform:'rotateX(90deg)',filter:'brightness(.05)'},
        {transform:'rotateX(-6deg)',filter:'brightness(1)',offset:.45},
        {transform:'rotateX(3deg)',filter:'brightness(1)',offset:.68},
        {transform:'rotateX(-1deg)',filter:'brightness(1)',offset:.85},
        {transform:'rotateX(0deg)',filter:'brightness(1)'}
      ],{duration:dur*.66,easing:'ease-out',fill:'forwards'});
      a2.onfinish=()=>{
        b.remove();_ret(b,'bot');
        sh.remove();_ret(sh,'sh');
        cell._flipping=false;res();
      };
    };
  });
}

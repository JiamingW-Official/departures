/* ═══ SPLIT-FLAP FLIP ENGINE — Performance optimized ═══ */

const DRUM='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-:. ';

const STATUS_COLORS={
  'c-on':'#d8d0b0','c-bo':'#44c060','c-de':'#c84840',
  'c-go':'#4890c0','c-dp':'#302e28','c-lc':'#c84840','c-cx':'rgba(180,64,52,.6)'
};
function getCellColor(cell){
  const cls=cell.className;
  for(const k in STATUS_COLORS){if(cls.includes(k))return STATUS_COLORS[k]}
  return '#d8d0b0';
}

/* ═══ ELEMENT POOL ═══ */
const _pool={top:[],bot:[]};
function _get(type){
  const p=_pool[type];
  if(p.length)return p.pop();
  const d=document.createElement('div');
  d.className=type==='top'?'flip-top':'flip-bot';
  return d;
}
function _ret(el,type){if(_pool[type].length<24)_pool[type].push(el)}

/*
 * qFlip — Quick flip. No bounce, no shadow. Uses opacity instead of filter.
 */
function qFlip(cell,nc){
  if(cell._flipping)return Promise.resolve();
  cell._flipping=true;
  const dur=38+Math.random()*16;
  const oc=cell._ch;
  cell._ch=nc;
  return new Promise(res=>{
    if(!CELL_W){CELL_W=cell.offsetWidth;CELL_H=cell.offsetHeight}
    const w=CELL_W,ht=CELL_H;
    const fr=cell._fr,col=getCellColor(cell);
    const t=_get('top');
    t.style.cssText=`width:${w}px;height:${ht/2}px;line-height:${ht}px;color:${col}`;
    t.textContent=oc;
    const b=_get('bot');
    b.style.cssText=`width:${w}px;height:${ht/2}px;line-height:0;color:${col}`;
    b.textContent=nc;
    cell.appendChild(t);cell.appendChild(b);
    flipSound(0.35);
    const a1=t.animate([
      {transform:'rotateX(0)',opacity:1},
      {transform:'rotateX(-90deg)',opacity:0}
    ],{duration:dur*.4,easing:'ease-in',fill:'forwards'});
    a1.onfinish=()=>{
      t.remove();_ret(t,'top');
      fr.textContent=nc;
      const a2=b.animate([
        {transform:'rotateX(90deg)',opacity:0},
        {transform:'rotateX(0)',opacity:1}
      ],{duration:dur*.6,easing:'ease-out',fill:'forwards'});
      a2.onfinish=()=>{
        b.remove();_ret(b,'bot');
        cell._flipping=false;res();
      };
    };
  });
}

/*
 * fFlip — Final flip with bounce. No shadow element, opacity instead of filter.
 */
function fFlip(cell,nc,dur){
  if(cell._flipping||cell._ch===nc)return Promise.resolve();
  cell._flipping=true;
  dur=dur||(160+Math.random()*50);
  return new Promise(res=>{
    if(!CELL_W){CELL_W=cell.offsetWidth;CELL_H=cell.offsetHeight}
    const w=CELL_W,ht=CELL_H,oc=cell._ch;
    cell._ch=nc;
    const fr=cell._fr,col=getCellColor(cell);
    const t=_get('top');
    t.style.cssText=`width:${w}px;height:${ht/2}px;line-height:${ht}px;color:${col}`;
    t.textContent=oc;
    const b=_get('bot');
    b.style.cssText=`width:${w}px;height:${ht/2}px;line-height:0;color:${col}`;
    b.textContent=nc;
    cell.appendChild(t);cell.appendChild(b);
    flipSound(0.55);
    const a1=t.animate([
      {transform:'rotateX(0)',opacity:1},
      {transform:'rotateX(-90deg)',opacity:0}
    ],{duration:dur*.3,easing:'ease-in',fill:'forwards'});
    a1.onfinish=()=>{
      t.remove();_ret(t,'top');
      fr.textContent=nc;
      const a2=b.animate([
        {transform:'rotateX(90deg)',opacity:0},
        {transform:'rotateX(-4deg)',opacity:1,offset:.45},
        {transform:'rotateX(1.5deg)',opacity:1,offset:.7},
        {transform:'rotateX(0)',opacity:1}
      ],{duration:dur*.7,easing:'ease-out',fill:'forwards'});
      a2.onfinish=()=>{
        b.remove();_ret(b,'bot');
        cell._flipping=false;res();
      };
    };
  });
}

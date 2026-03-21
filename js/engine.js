/* ═══ SPLIT-FLAP FLIP ENGINE ═══ */

const DRUM='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-:. ';

/* Status color lookup */
const STATUS_COLORS={
  'c-on':'#ddd6b6','c-bo':'#50d070','c-de':'#e05040',
  'c-go':'#58a0d8','c-dp':'#4a4838','c-lc':'#e05040','c-cx':'rgba(224,80,64,.7)'
};
function getCellColor(cell){
  const cls=cell.className;
  for(const k in STATUS_COLORS){if(cls.includes(k))return STATUS_COLORS[k]}
  return '#ddd6b6';
}

/* ═══ ELEMENT POOL ═══ */
const _pool={top:[],bot:[],sh:[]};
function _get(type){
  const p=_pool[type];
  if(p.length)return p.pop();
  const d=document.createElement('div');
  d.className=type==='top'?'flip-top':type==='bot'?'flip-bot':'flip-shadow';
  return d;
}
function _ret(el,type){if(_pool[type].length<32)_pool[type].push(el)}

let _shH18='',_shH06='';

/*
 * qFlip — Quick intermediate flip. Snappy, no bounce.
 */
function qFlip(cell,nc){
  if(cell._flipping)return Promise.resolve();
  cell._flipping=true;
  const dur=40+Math.random()*18;
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
    flipSound(0.4);
    const a1=t.animate([
      {transform:'rotateX(0)',filter:'brightness(1)'},
      {transform:'rotateX(-90deg)',filter:'brightness(.1)'}
    ],{duration:dur*.38,easing:'ease-in',fill:'forwards'});
    a1.onfinish=()=>{
      t.remove();_ret(t,'top');
      fr.textContent=nc;
      const a2=b.animate([
        {transform:'rotateX(90deg)',filter:'brightness(.06)'},
        {transform:'rotateX(0)',filter:'brightness(1)'}
      ],{duration:dur*.62,easing:'cubic-bezier(.22,.68,.36,1)',fill:'forwards'});
      a2.onfinish=()=>{
        b.remove();_ret(b,'bot');
        cell._flipping=false;res();
      };
    };
  });
}

/*
 * fFlip — Final flip with mechanical bounce + drop shadow.
 * 4-keyframe bounce: overshoot → settle → micro-overshoot → rest
 */
function fFlip(cell,nc,dur){
  if(cell._flipping||cell._ch===nc)return Promise.resolve();
  cell._flipping=true;
  dur=dur||(180+Math.random()*60);
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
    flipSound(0.65);
    /* Drop shadow animation */
    sh.animate([
      {height:'0',opacity:0},
      {height:_shH18,opacity:.5,offset:.3},
      {height:_shH06,opacity:.2,offset:.65},
      {height:'0',opacity:0}
    ],{duration:dur,easing:'ease-out',fill:'forwards'});
    /* Top half falls away */
    const a1=t.animate([
      {transform:'rotateX(0)',filter:'brightness(1)'},
      {transform:'rotateX(-90deg)',filter:'brightness(.06)'}
    ],{duration:dur*.32,easing:'ease-in',fill:'forwards'});
    a1.onfinish=()=>{
      t.remove();_ret(t,'top');
      fr.textContent=nc;
      /* Bottom half swings down with natural bounce */
      const a2=b.animate([
        {transform:'rotateX(90deg)',filter:'brightness(.04)'},
        {transform:'rotateX(-5deg)',filter:'brightness(1)',offset:.42},
        {transform:'rotateX(2.5deg)',filter:'brightness(1)',offset:.65},
        {transform:'rotateX(-.8deg)',filter:'brightness(1)',offset:.82},
        {transform:'rotateX(0)',filter:'brightness(1)'}
      ],{duration:dur*.68,easing:'cubic-bezier(.22,.68,.36,1)',fill:'forwards'});
      a2.onfinish=()=>{
        b.remove();_ret(b,'bot');
        sh.remove();_ret(sh,'sh');
        cell._flipping=false;res();
      };
    };
  });
}

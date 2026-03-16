/* ═══ AUDIO ENGINE — Mechanical split-flap sounds ═══ */

const _ACx=window.AudioContext||window.webkitAudioContext;
let _ac=null,_ag=null,audioMuted=true;
const _nBufs=[];let _nIdx=0;

function initAudio(){
  if(_ac)return;
  try{
    _ac=new _ACx();_ag=_ac.createGain();_ag.gain.value=0.06;_ag.connect(_ac.destination);
    /* Pre-allocate 12 noise buffers — varied mechanical character */
    const sr=_ac.sampleRate;
    const len=Math.floor(sr*0.018);
    for(let i=0;i<12;i++){
      const buf=_ac.createBuffer(1,len,sr),ch=buf.getChannelData(0);
      /* Sharp attack → fast exponential decay with resonant click */
      const clickPos=Math.floor(len*0.05);
      for(let j=0;j<len;j++){
        const e=Math.exp(-j/len*6);
        let s=(Math.random()*2-1)*e*e;
        /* Add a sharp transient click at the start */
        if(j<clickPos) s+=Math.sin(j/clickPos*Math.PI)*0.8*(1-j/clickPos);
        ch[j]=s;
      }
      _nBufs.push(buf);
    }
  }catch(e){}
}

/* Mechanical click — pre-allocated buffer + pitch variation */
function flipSound(v){
  if(!_ac||audioMuted||!_nBufs.length)return;
  const buf=_nBufs[_nIdx];_nIdx=(_nIdx+1)%_nBufs.length;
  const s=_ac.createBufferSource();s.buffer=buf;
  s.playbackRate.value=0.6+Math.random()*0.7;
  const bp=_ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=800+Math.random()*2400;bp.Q.value=0.8;
  const g=_ac.createGain();g.gain.value=Math.min(1,v||0.5);
  s.connect(bp);bp.connect(g);g.connect(_ag);
  s.start();s.stop(_ac.currentTime+0.018);
}

/* Throttled sound for mass transitions */
let _lst=0;
function massFlipSound(){const n=performance.now();if(n-_lst<25)return;_lst=n;flipSound(0.15)}

function toggleMute(){
  if(!_ac)initAudio();
  audioMuted=!audioMuted;
  if(_ac&&_ac.state==='suspended')_ac.resume();
  const b=document.getElementById('mute-btn');
  if(b){b.textContent=audioMuted?'\u266A OFF':'\u266A ON';b.className='mute-btn'+(audioMuted?'':' on')}
}

/* ═══ AUDIO ENGINE — Premium mechanical split-flap ═══ */

const _ACx=window.AudioContext||window.webkitAudioContext;
let _ac=null,_ag=null,_aComp=null,audioMuted=true;
const _nBufs=[];let _nIdx=0;
/* Resonant body buffer for richer sound */
let _bodyBuf=null;

function initAudio(){
  if(_ac)return;
  try{
    _ac=new _ACx();
    /* Compressor — prevents clipping, glues sounds together */
    _aComp=_ac.createDynamicsCompressor();
    _aComp.threshold.value=-18;_aComp.knee.value=12;
    _aComp.ratio.value=4;_aComp.attack.value=0.002;_aComp.release.value=0.08;
    _aComp.connect(_ac.destination);
    /* Master gain */
    _ag=_ac.createGain();_ag.gain.value=0.055;_ag.connect(_aComp);

    const sr=_ac.sampleRate;

    /* 8 varied click buffers */
    const len=Math.floor(sr*0.018);
    for(let i=0;i<8;i++){
      const buf=_ac.createBuffer(1,len,sr),ch=buf.getChannelData(0);
      const clickW=Math.floor(len*(0.03+i*0.005));
      const resonance=1200+i*180; /* each buffer has slightly different tone */
      for(let j=0;j<len;j++){
        const env=Math.exp(-j/len*7);
        /* Noise body */
        let s=(Math.random()*2-1)*env*env*0.6;
        /* Sharp mechanical click transient */
        if(j<clickW){
          const t=j/clickW;
          s+=Math.sin(t*Math.PI)*0.7*(1-t*t);
          /* Add metallic ring */
          s+=Math.sin(j/sr*resonance*Math.PI*2)*0.15*(1-t);
        }
        /* Subtle low thud */
        if(j<len*0.15) s+=Math.sin(j/sr*180*Math.PI*2)*0.12*Math.exp(-j/len*12);
        ch[j]=s;
      }
      _nBufs.push(buf);
    }

    /* Body resonance buffer — longer, for the "room" feel */
    const bLen=Math.floor(sr*0.06);
    _bodyBuf=_ac.createBuffer(1,bLen,sr);
    const bCh=_bodyBuf.getChannelData(0);
    for(let j=0;j<bLen;j++){
      const env=Math.exp(-j/bLen*4);
      bCh[j]=(Math.random()*2-1)*env*0.08;
    }
  }catch(e){}
}

/* Single flap click — varied pitch, filtered, with room body */
function flipSound(v){
  if(!_ac||audioMuted||!_nBufs.length)return;
  const buf=_nBufs[_nIdx];_nIdx=(_nIdx+1)%_nBufs.length;
  const s=_ac.createBufferSource();s.buffer=buf;
  s.playbackRate.value=0.55+Math.random()*0.6;
  /* Bandpass for mechanical character */
  const bp=_ac.createBiquadFilter();bp.type='bandpass';
  bp.frequency.value=900+Math.random()*2000;bp.Q.value=0.6+Math.random()*0.4;
  const g=_ac.createGain();g.gain.value=Math.min(1,v||0.5);
  s.connect(bp);bp.connect(g);g.connect(_ag);
  s.start();s.stop(_ac.currentTime+0.022);
  /* Room body removed for performance */
}

/* Mass flip — tighter throttle, quieter */
let _lst=0;
function massFlipSound(){const n=performance.now();if(n-_lst<20)return;_lst=n;flipSound(0.12)}

function toggleMute(){
  if(!_ac)initAudio();
  audioMuted=!audioMuted;
  if(_ac&&_ac.state==='suspended')_ac.resume();
  /* Update nav button via cached ref */
  const b=document.getElementById('nb-mute');
  if(b){b.textContent='\u266A';b.className='mute-btn'+(audioMuted?'':' on')}
}

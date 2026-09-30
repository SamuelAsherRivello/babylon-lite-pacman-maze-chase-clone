export class ArcadeAudio {
  constructor(){this.context=null;this.muted=false;this.lastPellet=0;}
  unlock(){
    try{if(!this.context)this.context=new (window.AudioContext||window.webkitAudioContext)();this.context.resume().catch(()=>{});}catch{}
  }
  setMuted(muted){this.muted=muted;}
  play(type){
    if(this.muted||!this.context||this.context.state!=='running')return;
    const now=this.context.currentTime;
    if(type==='pellet'&&now-this.lastPellet<.055)return;
    if(type==='pellet')this.lastPellet=now;
    const cues={pellet:[[760,.045],[980,.035]],power:[[330,.09],[660,.09],[990,.16]],capture:[[700,.06],[1000,.08],[1400,.12]],death:[[220,.11],[165,.13],[82,.24]],clear:[[520,.08],[660,.08],[780,.08],[1040,.2]]};
    let offset=0;
    for(const[frequency,duration]of cues[type]??[]){
      const oscillator=this.context.createOscillator(),gain=this.context.createGain();
      oscillator.type='square';oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(0,now+offset);gain.gain.linearRampToValueAtTime(.035,now+offset+.005);gain.gain.exponentialRampToValueAtTime(.001,now+offset+duration);
      oscillator.connect(gain);gain.connect(this.context.destination);oscillator.start(now+offset);oscillator.stop(now+offset+duration+.01);offset+=duration;
    }
  }
  dispose(){this.context?.close().catch(()=>{});}
}

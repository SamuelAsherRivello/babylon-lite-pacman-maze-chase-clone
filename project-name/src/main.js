import './arcade.css';
import {Game} from './game.js';
import {createRenderer} from './renderer.js';
import {ArcadeAudio} from './audio.js';
import versionText from '../../version.txt?raw';
const game=new Game(),audio=new ArcadeAudio();
const $=id=>document.getElementById(id);
const canvas=$('game'),overlay=$('overlay'),primary=$('primary'),dialog=$('instructions');
let renderer=null, failure=null, lastState=null, savedBest=0, running=true, frameId=null;
try{const stored=Number(localStorage.getItem('neon-nibbler.best'));if(Number.isFinite(stored)&&stored>=0)game.best=Math.floor(stored);}catch{}
savedBest=game.best;$('version').textContent=`v${versionText.trim().split('=')[1]}`;
const format=number=>String(number).padStart(6,'0');
const screens={
  title:['READY TO GET LOST?','NEON<br><span>NIBBLER</span>','Eat the dots. Outsmart the rivals.<br>Turn the chase around.','START THE CHASE','ARROWS / WASD TO MOVE · ENTER TO START'],
  paused:['TAKE A BREATHER','CHASE<br><span>PAUSED</span>','Your maze is waiting.<br>Pick up right where you left off.','RESUME CHASE','P / ESC TO RESUME · TIMERS ARE FROZEN'],
  'game-over':['THE RIVALS CAUGHT UP','GAME<br><span>OVER</span>','Every chase is a fresh start.','TRY AGAIN','ENTER TO REPLAY'],
  victory:['ALL THREE BOARDS CLEARED','MAZE<br><span>MASTER</span>','You stayed hungry. You stayed electric.','CHASE AGAIN','ENTER TO REPLAY'],
};
function present(){
  document.body.dataset.state=failure?'error':game.state;
  $('score').textContent=format(game.score);$('best').textContent=format(game.best);
  $('lives').textContent=Array.from({length:3},(_,i)=>i<game.lives?'◆':'◇').join(' ');$('lives').setAttribute('aria-label',`${game.lives} lives`);
  $('board').innerHTML=`0${game.board+1}<span> / 03</span>`;$('board-label').textContent=`0${game.board+1} — ${game.maze.name.toUpperCase()}`;
  $('pellet-count').textContent=`${game.pellets.size} DOTS LEFT · ${Math.round((1-game.pellets.size/game.total)*100)}% CLEAR`;
  $('charge-fill').style.width=`${game.power/6*100}%`;
  $('charge-label').textContent=game.power>0?`CHASE BACK / ${game.power.toFixed(1)}s`:'POWER UP. CHASE BACK.';
  $('charge-fill').style.background=game.power>0&&game.power<=2?'#b6a0ff':'#ffe447';
  $('pause').disabled=!renderer||!!failure||!['playing','ready','paused','board-clear'].includes(game.state);
  $('pause').textContent=game.state==='paused'?'▶ RESUME':'Ⅱ PAUSE';
  $('ready').hidden=!!failure||!['ready','board-clear'].includes(game.state);
  $('ready').textContent=game.state==='board-clear'?'BOARD CLEAR!':`READY ${Math.max(1,Math.ceil(game.timer))}`;
  if(failure)return;
  if(lastState!==game.state){
    lastState=game.state;const screen=screens[game.state];overlay.hidden=!screen;
    if(screen){const[kicker,title,copy,label,note]=screen;
      $('overlay-kicker').textContent=kicker;$('overlay-title').innerHTML=title;
      $('overlay-copy').innerHTML=copy+(['game-over','victory'].includes(game.state)?`<br><strong style="color:#ffe447">${format(game.score)} POINTS</strong>`:'');
      primary.innerHTML=`${label} <span>→</span>`;$('overlay-note').textContent=note;
      $('mascot').hidden=game.state!=='title';
    }
  }
}
function action(){
  if(failure){location.reload();return;}
  if(!renderer)return;audio.unlock();
  if(game.state==='paused')game.resume();else if(['title','game-over','victory'].includes(game.state))game.restart();
  primary.blur();present();
}
function togglePause(){if(!renderer||failure)return;if(game.state==='paused')game.resume();else game.pause();releaseControls();present();}
function releaseControls(){for(const button of document.querySelectorAll('.dpad button'))button.classList.remove('pressed');game.wanted=null;}
function fail(error){
  game.pause();failure=error;overlay.hidden=false;$('ready').hidden=true;$('content_layer').dataset.error='true';$('mascot').hidden=true;
  $('overlay-kicker').textContent='GRAPHICS CONNECTION';$('overlay-title').innerHTML='LET’S GET<br><span>CONNECTED</span>';
  $('overlay-copy').textContent=error.message;primary.disabled=false;primary.innerHTML='RETRY <span>→</span>';
  $('overlay-note').textContent='WEBGPU + HARDWARE ACCELERATION REQUIRED';present();
}
primary.addEventListener('click',action);$('pause').addEventListener('click',()=>{togglePause();$('pause').blur();});
$('mute').addEventListener('click',()=>{audio.unlock();audio.setMuted(!audio.muted);$('mute').textContent=audio.muted?'♪ SOUND OFF':'♪ SOUND ON';$('mute').setAttribute('aria-pressed',String(audio.muted));$('mute').blur();});
$('help').addEventListener('click',()=>{game.pause();releaseControls();present();dialog.showModal();});
function closeHelp(){dialog.close();$('help').focus();}
$('close-help').addEventListener('click',closeHelp);$('help-done').addEventListener('click',closeHelp);
dialog.addEventListener('cancel',()=>releaseControls());
const keyDirections={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
window.addEventListener('keydown',event=>{
  if(dialog.open)return;const direction=keyDirections[event.key]??keyDirections[event.key.toLowerCase()];
  if(direction){event.preventDefault();audio.unlock();game.request(direction);}
  else if(event.key==='Enter'){if(event.target instanceof HTMLButtonElement||event.target instanceof HTMLAnchorElement)return;event.preventDefault();if(!event.repeat)action();}
  else if(event.key.toLowerCase()==='p'||event.key==='Escape'){event.preventDefault();if(!event.repeat)togglePause();}
});
for(const button of document.querySelectorAll('[data-dir]')){
  button.addEventListener('pointerdown',event=>{event.preventDefault();audio.unlock();button.setPointerCapture(event.pointerId);button.classList.add('pressed');game.request(button.dataset.dir);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>button.classList.remove('pressed'));
  // Native keyboard activation remains available to users navigating by Tab.
  button.addEventListener('click',event=>{if(event.detail===0)game.request(button.dataset.dir);});
}
window.addEventListener('blur',()=>{game.pause();releaseControls();present();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){game.pause();releaseControls();present();}});
let previous=performance.now();
function frame(now){
  if(!running)return;const delta=Math.min(100,now-previous);previous=now;
  if(!failure&&!window.__arcade?.manual)game.update(delta/1000);
  for(const event of game.drainEvents())audio.play(event.type);
  if(savedBest!==game.best){savedBest=game.best;try{localStorage.setItem('neon-nibbler.best',String(savedBest));}catch{}}
  present();if(renderer&&!failure)renderer.draw(game,delta);frameId=requestAnimationFrame(frame);
}
present();
try{renderer=await createRenderer(canvas,fail);primary.disabled=false;document.body.dataset.renderer='webgpu';}
catch(error){fail(error);}
// Test controls are omitted from the production build.
if(import.meta.env.DEV && new URLSearchParams(location.search).has('test')){
  window.__arcade={game,manual:false,snapshot:()=>game.snapshot(),tick:seconds=>{for(let t=0;t<seconds;t+=1/120)game.update(1/120);present();renderer?.draw(game);return game.snapshot();},draw:()=>{present();renderer?.draw(game);},drawCalls:()=>renderer?.drawCalls,audio};
}
frameId=requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{running=false;cancelAnimationFrame(frameId);renderer?.dispose();audio.dispose();},{once:true});

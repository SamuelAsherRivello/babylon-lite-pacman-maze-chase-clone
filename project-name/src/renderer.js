import {createEngine,createDynamicTexture,updateDynamicTexture,createGridSpriteAtlas,createSprite2DLayer,addSprite2D,updateSprite2D,createSpriteRenderer,registerSpriteRenderer,renderFrame,resizeEngine,disposeSpriteRenderer,disposeSpriteAtlas,disposeEngine,enableDeviceLostSpriteRecovery} from '@babylonjs/lite';
import {COLS,ROWS,xy,key} from './mazes.js';
import {position,STEP} from './game.js';
const TILE=32, WIDTH=COLS*TILE, HEIGHT=ROWS*TILE;
const colors=['#ff566f','#ff86cb','#55e4ee','#ffac55'];
const pixelPosition=(a,alpha)=>{
  const current=position(a), old=a.previous??current;
  return {x:(old.x+(current.x-old.x)*alpha)*TILE+TILE/2,y:(old.y+(current.y-old.y)*alpha)*TILE+TILE/2};
};

export async function createRenderer(canvas,onFailure) {
  if (!navigator.gpu) throw new Error('WebGPU is unavailable. Try Chrome or Edge with hardware acceleration enabled.');
  let engine;
  try {engine=await createEngine(canvas,{maxDevicePixelRatio:2,msaaSamples:1});}
  catch(cause){throw new Error('No usable WebGPU device was found. Enable hardware acceleration, then retry.',{cause});}
  const surface=document.createElement('canvas'); surface.width=WIDTH; surface.height=HEIGHT;
  const ctx=surface.getContext('2d'); ctx.imageSmoothingEnabled=false;
  const background=document.createElement('canvas'); background.width=WIDTH; background.height=HEIGHT;
  const bg=background.getContext('2d');
  const texture=createDynamicTexture(engine,WIDTH,HEIGHT,{minFilter:'nearest',magFilter:'nearest'});
  const atlas=createGridSpriteAtlas(texture,{cellWidthPx:WIDTH,cellHeightPx:HEIGHT});
  const layer=createSprite2DLayer(atlas,{capacity:1});
  const sprite=addSprite2D(layer,{positionPx:[canvas.width/2,canvas.height/2],sizePx:[canvas.width,canvas.height],frame:0});
  const renderer=createSpriteRenderer(engine,{layers:[layer]}); registerSpriteRenderer(renderer);
  let disposed=false, lastMaze=null;
  const recovery=enableDeviceLostSpriteRecovery(engine,{onLost:()=>onFailure(new Error('Graphics connection interrupted. Retry to reconnect your graphics device.'))});

  function drawBackground(maze){
    bg.fillStyle='#000'; bg.fillRect(0,0,WIDTH,HEIGHT);
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(!maze.floor[key(x,y)]){
      const px=x*TILE,py=y*TILE;
      bg.fillStyle='#030918';bg.fillRect(px,py,TILE,TILE);
      // Exposed wall edges outline each island; interior edges stay invisible.
      bg.strokeStyle='#355eff'; bg.lineWidth=3; bg.beginPath();
      if(y>0 && maze.floor[key(x,y-1)]){bg.moveTo(px,py+1.5);bg.lineTo(px+TILE,py+1.5);}
      if(y<ROWS-1 && maze.floor[key(x,y+1)]){bg.moveTo(px,py+TILE-1.5);bg.lineTo(px+TILE,py+TILE-1.5);}
      if(x>0 && maze.floor[key(x-1,y)]){bg.moveTo(px+1.5,py);bg.lineTo(px+1.5,py+TILE);}
      if(x<COLS-1 && maze.floor[key(x+1,y)]){bg.moveTo(px+TILE-1.5,py);bg.lineTo(px+TILE-1.5,py+TILE);}
      bg.stroke();
      if(x%2===0 && y%2===0){bg.fillStyle='#0b1631';bg.fillRect(px+14,py+14,3,3);}
    }
    bg.strokeStyle='#1f3476';bg.lineWidth=2;bg.strokeRect(7,7,WIDTH-14,HEIGHT-14);
    bg.fillStyle='#19254b'; for(let i=0;i<7;i++)bg.fillRect((11+i)*TILE+12,7*TILE+25,8,2);
  }
  function drawPlayer(game,alpha){
    const p=pixelPosition(game.player,alpha);
    ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
    ctx.rotate({right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[game.player.facing]??0);
    if(game.protection>0 && game.state==='playing'){
      ctx.strokeStyle='#fff7bd';ctx.lineWidth=2;ctx.strokeRect(-15,-15,30,30);
    }
    ctx.fillStyle='#ffe447';
    ctx.beginPath();ctx.moveTo(-9,-12);ctx.lineTo(7,-12);ctx.lineTo(12,-7);ctx.lineTo(12,7);ctx.lineTo(7,12);ctx.lineTo(-9,12);ctx.lineTo(-12,8);ctx.lineTo(-12,-8);ctx.closePath();ctx.fill();
    ctx.fillStyle='#000';const mouth=game.player.next!==null && Math.floor(game.elapsed*12)%2===0;
    ctx.fillRect(mouth?1:7,-(mouth?5:2),13,mouth?10:4);
    ctx.fillRect(1,-8,4,4);ctx.fillStyle='#fff6ae';ctx.fillRect(-8,-7,3,6);
    // Paired tail pixels make Nib an original little circuit creature.
    ctx.fillStyle='#e1b72a';ctx.fillRect(-16,-7,4,3);ctx.fillRect(-16,4,4,3);ctx.restore();
  }
  function drawEnemy(e,game,alpha){
    const p=pixelPosition(e,alpha);ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
    const frightened=game.power>0 && e.mode==='active', warning=game.power<=2 && Math.floor(game.elapsed*4)%2===0;
    const color=frightened?(warning?'#f0eaff':'#7978ff'):colors[e.index];
    if(e.mode==='returning'){
      ctx.strokeStyle=colors[e.index];ctx.lineWidth=2;ctx.strokeRect(-5,-5,10,10);ctx.fillStyle='#fff';ctx.fillRect(-2,-2,4,4);ctx.restore();return;
    }
    if(e.mode==='waiting')ctx.globalAlpha=.65;
    ctx.fillStyle=color;
    if(e.index===0){ctx.fillRect(-10,-10,20,20);ctx.fillRect(-7,-13,14,3);ctx.fillRect(-13,-5,3,10);ctx.fillRect(10,-5,3,10);}
    if(e.index===1){ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(13,0);ctx.lineTo(0,12);ctx.lineTo(-13,0);ctx.closePath();ctx.fill();ctx.fillRect(-10,9,5,4);ctx.fillRect(5,9,5,4);}
    if(e.index===2){ctx.fillRect(-9,-10,18,21);ctx.fillRect(-13,-5,26,11);ctx.fillRect(-2,-15,4,5);ctx.fillRect(-7,11,4,3);ctx.fillRect(3,11,4,3);}
    if(e.index===3){ctx.beginPath();ctx.moveTo(-11,10);ctx.lineTo(-10,-5);ctx.lineTo(-5,-13);ctx.lineTo(0,-8);ctx.lineTo(5,-13);ctx.lineTo(11,-4);ctx.lineTo(12,10);ctx.closePath();ctx.fill();ctx.fillRect(-7,10,5,3);ctx.fillRect(4,10,5,3);}
    ctx.fillStyle='#090c19';
    if(frightened){ctx.fillRect(-6,-3,3,3);ctx.fillRect(3,-3,3,3);ctx.fillRect(-5,4,10,2);}
    else{
      ctx.fillRect(-7,-4,6,7);ctx.fillRect(1,-4,6,7);ctx.fillStyle='#f6f8ff';
      const shift={left:-1,right:1,up:0,down:0}[e.facing]??0,sy=e.facing==='up'?-1:e.facing==='down'?1:0;
      ctx.fillRect(-5+shift,-2+sy,3,3);ctx.fillRect(3+shift,-2+sy,3,3);
    }
    ctx.restore();
  }
  function draw(game,delta=16.67){
    if(disposed)return;
    if(lastMaze!==game.maze){lastMaze=game.maze;drawBackground(game.maze);}
    ctx.clearRect(0,0,WIDTH,HEIGHT);ctx.drawImage(background,0,0);
    const t=game.elapsed,alpha=game.state==='playing'?game.accumulator/STEP:1;
    for(const[id,type]of game.pellets){const{x,y}=xy(id),px=x*TILE+16,py=y*TILE+16;
      ctx.fillStyle=type===2?'#fff7bd':'#e3e8fb';
      if(type===2){const size=Math.floor(t*2)%2===0?11:9;ctx.fillRect(px-size/2,py-size/2,size,size);ctx.strokeStyle='#4e4560';ctx.lineWidth=1;ctx.strokeRect(px-8,py-8,16,16);}
      else ctx.fillRect(px-2,py-2,4,4);
    }
    for(const e of game.enemies)drawEnemy(e,game,alpha);
    drawPlayer(game,alpha);
    for(const f of game.floats){ctx.font='bold 18px monospace';ctx.textAlign='center';ctx.fillStyle='#d6c5ff';ctx.fillText(f.text,f.x*TILE+16,f.y*TILE-(1-f.life)*22);}
    updateDynamicTexture(engine,texture,surface,{invertY:false});resizeEngine(engine);
    updateSprite2D(sprite,{positionPx:[canvas.width/2,canvas.height/2],sizePx:[canvas.width,canvas.height]});renderFrame(engine,delta);
  }
  return {draw,get drawCalls(){return engine.drawCallCount;},dispose(){if(disposed)return;disposed=true;recovery.disable();disposeSpriteRenderer(renderer);disposeSpriteAtlas(atlas);disposeEngine(engine);}};
}

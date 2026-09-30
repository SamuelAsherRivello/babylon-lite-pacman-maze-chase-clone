import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP,position,sweptContact} from '../src/game.js';
import {MAZES,key,xy,neighbors,distanceMap,validateMaze} from '../src/mazes.js';
function playing(){const g=new Game();g.restart();g.state='playing';g.enemies.forEach(e=>e.release=10000);return g;}
function put(a,x,y,direction=null){Object.assign(a,{tile:key(x,y),next:null,progress:0,direction,facing:direction??'left',previous:{x,y}});}
function advance(g,seconds){for(let i=0;i<Math.round(seconds/STEP);i++)g.step(STEP);}

test('three original connected boards with reachable spawns, closed boundaries, loops and four power pellets',()=>{
  const signatures=new Set();
  for(const maze of MAZES){assert.equal(validateMaze(maze),true);signatures.add(maze.floor.join(''));assert.equal([...maze.pellets.values()].filter(v=>v===2).length,4);
    const distances=distanceMap(maze,maze.spawn);assert.ok([...maze.pellets.keys()].every(id=>distances[id]>=0));
    const vertices=maze.floor.reduce((sum,v)=>sum+v,0),edges=maze.floor.reduce((sum,v,id)=>sum+(v?neighbors(maze,id).length:0),0)/2;assert.ok(edges>=vertices,'maze contains loops');}
  assert.equal(signatures.size,3);
});
test('movement speed is the same at 30 and 60 FPS',()=>{
  const a=playing(),b=playing();a.request('left');b.request('left');for(let i=0;i<30;i++)a.update(1/30);for(let i=0;i<60;i++)b.update(1/60);assert.deepEqual(position(a.player),position(b.player));assert.equal(a.score,b.score);
});
test('blocked turns are buffered until a valid intersection',()=>{
  const g=playing();put(g.player,13,15,'left');g.request('up');advance(g,1.12);assert.equal(g.player.facing,'up');assert.equal(position(g.player).x,7);assert.ok(position(g.player).y<15);
});
test('immediate reversal preserves continuous position and returns along the corridor',()=>{
  const g=playing();g.request('left');advance(g,.08);const before=position(g.player);g.request('right');assert.deepEqual(position(g.player),before);advance(g,.05);assert.ok(position(g.player).x>before.x);
});
test('wall clipping is prevented even when a blocked input is held',()=>{
  const g=playing();put(g.player,1,1);g.request('left');advance(g,2);assert.deepEqual(position(g.player),{x:1,y:1});assert.equal(g.player.next,null);
});
test('each collectible scores once; power refreshes to six seconds and resets capture multiplier',()=>{
  const g=playing(),dot=[...g.pellets].find(([,v])=>v===1)[0];g.collect(dot);g.collect(dot);assert.equal(g.score,10);g.collect(g.maze.powers[0]);assert.equal(g.score,60);assert.equal(g.power,6);g.combo=3;advance(g,1);g.collect(g.maze.powers[1]);assert.equal(g.power,6);assert.equal(g.combo,0);
});
test('relative swept collisions detect actors exchanging tiles but not separated lanes',()=>{
  assert.equal(sweptContact({x:0,y:0},{x:1,y:0},{x:1,y:0},{x:0,y:0}),true);
  assert.equal(sweptContact({x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}),false);
});
test('dangerous collision removes exactly one life and preserves board and score',()=>{
  const g=playing();g.collect(key(1,3));const count=g.pellets.size,score=g.score;put(g.player,14,15);g.protection=0;for(const e of g.enemies){put(e,14,15);e.mode='active';}g.step(STEP);assert.equal(g.lives,2);assert.equal(g.state,'ready');assert.equal(g.pellets.size,count);assert.equal(g.score,score);assert.equal(g.protection,1);assert.equal(g.power,0);
});
test('visible protection prevents dangerous respawn collision',()=>{
  const g=playing();put(g.player,14,15);put(g.enemies[0],14,15);g.enemies[0].mode='active';g.step(STEP);assert.equal(g.lives,3);
});
test('four powered captures use the bonus sequence and cannot score a returning enemy twice',()=>{
  const g=playing();put(g.player,14,15);g.power=6;for(const e of g.enemies){put(e,14,15);e.mode='active';}g.step(STEP);assert.equal(g.score,3000);assert.equal(g.combo,4);assert.ok(g.enemies.every(e=>e.mode==='returning'));g.step(STEP);assert.equal(g.score,3000);
});
test('captured enemies return home and wait before re-entry',()=>{
  const g=playing();g.player.direction=null;const e=g.enemies[0];put(e,14,9);e.mode='returning';let found=false;for(let i=0;i<3000;i++){g.step(STEP);if(e.mode==='waiting'){found=true;break;}}assert.equal(found,true);assert.equal(e.tile,g.maze.homes[0]);assert.equal(e.release,2);advance(g,1);assert.equal(e.mode,'waiting');advance(g,1.1);assert.equal(e.mode,'active');
});
test('enemy release is staggered and personalities select different targets',()=>{
  const g=playing();g.resetActors();g.state='playing';assert.ok(g.enemies[0].release<g.enemies[1].release);advance(g,1.4);assert.equal(g.enemies[0].mode,'active');assert.equal(g.enemies[1].mode,'waiting');put(g.player,7,9,'right');g.power=0;assert.equal(g.enemyTarget(g.enemies[0]),key(7,9));assert.equal(g.enemyTarget(g.enemies[1]),key(11,9));put(g.enemies[2],27,1);assert.equal(g.enemyTarget(g.enemies[2]),key(1,1));g.boardTime=7;assert.equal(g.enemyTarget(g.enemies[3]),key(7,9));
});
test('enemies remain in legal corridors for extended simulation',()=>{
  for(let board=0;board<3;board++){const g=playing();g.board=board;g.loadBoard();g.state='playing';g.player.direction=null;g.protection=1000;advance(g,40);for(const e of g.enemies){assert.equal(g.maze.floor[e.tile],1);if(e.next!==null)assert.equal(g.maze.floor[e.next],1);assert.ok(e.progress>=0&&e.progress<1);}}
});
test('frightened enemies prefer escape routes and travel more slowly',()=>{
  const normal=playing(),powered=playing();
  for(const g of [normal,powered]){put(g.player,1,5);g.player.direction=null;put(g.enemies[0],7,5);g.enemies[0].mode='active';}
  assert.equal(normal.chooseEnemy(normal.enemies[0]),'left');powered.power=6;
  const escape=powered.chooseEnemy(powered.enemies[0]);const next=neighbors(powered.maze,powered.enemies[0].tile).find(n=>n.direction===escape);
  const distances=distanceMap(powered.maze,powered.player.tile);assert.ok(distances[next.id]>distances[powered.enemies[0].tile]);
  advance(normal,.1);advance(powered,.1);
  const displacement=g=>{const p=position(g.enemies[0]);return Math.abs(p.x-7)+Math.abs(p.y-5);};
  assert.ok(displacement(powered)<displacement(normal));
});
test('pause freezes all timers and resume clears stale queued input',()=>{
  const g=playing();g.power=5;g.wanted='up';const timer=g.boardTime;g.pause();g.update(.2);assert.equal(g.power,5);assert.equal(g.boardTime,timer);g.resume();assert.equal(g.state,'playing');assert.equal(g.wanted,null);
});
test('the final pellet takes precedence over dangerous collision',()=>{
  const g=playing();put(g.player,14,15,'left');g.pellets=new Map([[key(13,15),1]]);g.protection=0;for(const e of g.enemies){put(e,13,15);e.mode='active';}g.move(g.player,1,()=>g.choosePlayer(),id=>g.collect(id));assert.equal(g.state,'board-clear');assert.equal(g.lives,3);
  const h=playing();put(h.player,14,15,'left');h.player.next=key(13,15);h.player.progress=.99;h.pellets=new Map([[key(13,15),1]]);h.protection=0;put(h.enemies[0],13,15);h.enemies[0].mode='active';h.step(STEP);assert.equal(h.state,'board-clear');assert.equal(h.lives,3);
});
test('zero lives ends the chase and restart resets round data but preserves best',()=>{
  const g=playing();g.award(800,'capture');g.lives=1;g.protection=0;put(g.player,14,15);put(g.enemies[0],14,15);g.enemies[0].mode='active';g.step(STEP);assert.equal(g.state,'game-over');g.restart();assert.equal(g.lives,3);assert.equal(g.score,0);assert.equal(g.best,800);assert.equal(g.board,0);assert.equal(g.power,0);assert.equal(g.pellets.size,g.total);assert.equal(g.state,'ready');
});
test('full three-board sweep follows legal movement and reaches victory',()=>{
  const g=playing();let steps=0;
  while(g.state!=='victory' && steps++<150000){
    if(g.state==='playing'){
      g.enemies.forEach(e=>{e.mode='waiting';e.release=10000;});
      const from=g.player.next??g.player.tile;
      const distances=distanceMap(g.maze,from);
      const target=[...g.pellets.keys()].sort((a,b)=>distances[a]-distances[b])[0];
      if(target===from)g.wanted=null;
      else{const toTarget=distanceMap(g.maze,target);const n=neighbors(g.maze,from).sort((a,b)=>toTarget[a.id]-toTarget[b.id])[0];g.request(n.direction);}
    }
    g.step(STEP);
  }
  assert.equal(g.state,'victory');assert.equal(g.board,2);assert.equal(g.pellets.size,0);assert.equal(g.lives,3);
  const expected=MAZES.reduce((sum,maze)=>sum+[...maze.pellets.values()].reduce((points,v)=>points+(v===2?50:10),0),0);
  assert.equal(g.score,expected);assert.ok(steps<150000);
});

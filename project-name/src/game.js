import { MAZES, DIRECTIONS, OPPOSITE, neighbors, distanceMap, xy, key } from './mazes.js';
export const STEP = 1 / 120;
export const PLAYER_SPEED = 5.5;
export const ENEMY_NAMES = ['Rivet','Blip','Flux','Ember'];
const actor = tile => ({ tile, next: null, progress: 0, direction: 'left', facing: 'left', previous: xy(tile) });
export function position(a) {
  const from=xy(a.tile), to=xy(a.next ?? a.tile);
  return { x:from.x+(to.x-from.x)*a.progress, y:from.y+(to.y-from.y)*a.progress };
}
export function sweptContact(a0,a1,b0,b1,radius=0.64) {
  const rx=a0.x-b0.x, ry=a0.y-b0.y, dx=(a1.x-a0.x)-(b1.x-b0.x), dy=(a1.y-a0.y)-(b1.y-b0.y);
  const length=dx*dx+dy*dy, t=length ? Math.max(0,Math.min(1,-(rx*dx+ry*dy)/length)) : 0;
  return (rx+t*dx)**2+(ry+t*dy)**2 <= radius**2;
}

export class Game {
  constructor() { this.best=0; this.restart(false); }
  restart(start=true) {
    this.score=0; this.lives=3; this.board=0; this.elapsed=0; this.accumulator=0;
    this.seed=7341; this.events=[]; this.floats=[]; this.pausedState=null;
    this.loadBoard(); this.state=start?'ready':'title';
  }
  loadBoard() {
    this.maze=MAZES[this.board]; this.pellets=new Map(this.maze.pellets); this.total=this.pellets.size;
    this.resetActors(); this.events.push({type:'board',board:this.board});
  }
  resetActors() {
    this.player=actor(this.maze.spawn); this.wanted=null; this.power=0; this.combo=0;
    this.protection=1; this.boardTime=0; this.timer=1.5;
    this.enemies=this.maze.homes.map((tile,index)=>({...actor(tile), index, mode:'waiting',release:1.3+index*(1.25-this.board*0.15), patrol:0}));
  }
  random() { this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0; return this.seed/4294967296; }
  request(direction) {
    if (!DIRECTIONS[direction] || !['ready','playing'].includes(this.state)) return;
    this.wanted=direction;
    const p=this.player;
    if (p.next!==null && direction===OPPOSITE[p.direction]) {
      [p.tile,p.next]=[p.next,p.tile]; p.progress=1-p.progress; p.direction=direction; p.facing=direction;
    }
  }
  pause() {
    if (['playing','ready','board-clear'].includes(this.state)) { this.pausedState=this.state; this.state='paused'; this.wanted=null; this.accumulator=0; }
  }
  resume() { if (this.state==='paused') { this.state=this.pausedState; this.pausedState=null; this.wanted=null; this.accumulator=0; } }
  update(seconds) {
    if (!Number.isFinite(seconds) || seconds<=0) return;
    if (['title','paused','game-over','victory'].includes(this.state)) { this.accumulator=0; return; }
    this.accumulator+=Math.min(seconds,0.25);
    while (this.accumulator>=STEP) { this.accumulator-=STEP; this.step(STEP); }
  }
  step(dt) {
    if (['title','paused','game-over','victory'].includes(this.state)) return;
    this.elapsed+=dt;
    this.floats=this.floats.filter(f=>(f.life-=dt)>0);
    if (this.state==='ready' || this.state==='board-clear') {
      this.timer-=dt;
      if (this.timer<=0) {
        if (this.state==='board-clear') { this.board++; this.loadBoard(); this.state='ready'; }
        else this.state='playing';
      }
      return;
    }
    this.boardTime+=dt; this.power=Math.max(0,this.power-dt); this.protection=Math.max(0,this.protection-dt);
    const oldPlayer=position(this.player), oldEnemies=this.enemies.map(position);
    this.player.previous=oldPlayer;
    this.move(this.player,PLAYER_SPEED*dt,()=>this.choosePlayer(),id=>this.collect(id));
    if (this.state!=='playing') return;
    for (const e of this.enemies) {
      e.previous=oldEnemies[e.index];
      if (e.mode==='waiting') {
        e.release-=dt;
        if (e.release<=0) e.mode='active';
        else continue;
      }
      const speed=e.mode==='returning'?8:this.power>0?2.6:3.5+this.board*0.28;
      this.move(e,speed*dt,()=>this.chooseEnemy(e),()=>{
        if (e.mode==='returning' && e.tile===this.maze.homes[e.index]) { e.mode='waiting'; e.release=2; e.direction=null; }
      });
    }
    const newPlayer=position(this.player);
    for (const e of this.enemies) {
      if (e.mode!=='active' || !sweptContact(oldPlayer,newPlayer,oldEnemies[e.index],position(e))) continue;
      if (this.power>0) {
        e.mode='returning'; const bonus=200*2**Math.min(this.combo++,3); this.award(bonus,'capture');
        this.floats.push({...position(e),text:String(bonus),life:1});
      } else if (this.protection<=0) {
        this.lives--; this.events.push({type:'death'});
        if (this.lives===0) { this.state='game-over'; this.wanted=null; }
        else { this.resetActors(); this.state='ready'; }
        break;
      }
    }
  }
  move(a,distance,choose,onArrival) {
    let guard=0;
    while (distance>1e-8 && guard++<8) {
      if (a.next===null) {
        const direction=choose();
        const n=neighbors(this.maze,a.tile).find(n=>n.direction===direction);
        if (!n) { a.direction=null; break; }
        a.direction=direction; a.facing=direction; a.next=n.id; a.progress=0;
      }
      const travel=Math.min(distance,1-a.progress); a.progress+=travel; distance-=travel;
      if (a.progress>=1-1e-8) {
        a.tile=a.next; a.next=null; a.progress=0; onArrival(a.tile);
        if (this.state!=='playing' || a.mode==='waiting') break;
      }
    }
  }
  choosePlayer() {
    const choices=neighbors(this.maze,this.player.tile);
    if (this.wanted && choices.some(n=>n.direction===this.wanted)) return this.wanted;
    return this.player.direction;
  }
  chooseEnemy(e) {
    let choices=neighbors(this.maze,e.tile);
    if (e.mode!=='returning' && choices.length>1) choices=choices.filter(n=>n.direction!==OPPOSITE[e.direction]);
    const target=this.enemyTarget(e);
    const distances=distanceMap(this.maze,target);
    const fleeing=this.power>0 && e.mode!=='returning';
    choices.sort((a,b)=>fleeing?distances[b.id]-distances[a.id]:distances[a.id]-distances[b.id]);
    return choices[0]?.direction;
  }
  enemyTarget(e) {
    if (e.mode==='returning') return this.maze.homes[e.index];
    const p=this.player.next ?? this.player.tile;
    if (this.power>0 || e.index===0) return p;
    if (e.index===1) {
      let target=p;
      for (let i=0;i<4;i++) {
        const n=neighbors(this.maze,target).find(n=>n.direction===this.player.facing);
        if (!n) break; target=n.id;
      }
      return target;
    }
    if (e.index===2) {
      const pos=position(e), player=position(this.player);
      if (Math.abs(pos.x-player.x)+Math.abs(pos.y-player.y)<6) return p;
      const points=[key(1,1),key(27,1),key(27,15),key(1,15)];
      if (e.tile===points[e.patrol]) e.patrol=(e.patrol+1)%4;
      return points[e.patrol];
    }
    if (Math.floor(this.boardTime/6)%2===1) return p;
    if (e.roamTarget===undefined || e.tile===e.roamTarget) {
      const floors=[...this.maze.pellets.keys()]; e.roamTarget=floors[Math.floor(this.random()*floors.length)];
    }
    return e.roamTarget;
  }
  collect(id) {
    const pellet=this.pellets.get(id);
    if (!pellet) return;
    this.pellets.delete(id); this.award(pellet===2?50:10,pellet===2?'power':'pellet');
    if (pellet===2) { this.power=6; this.combo=0; }
    if (!this.pellets.size) {
      this.events.push({type:'clear'}); this.wanted=null;
      if (this.board===2) this.state='victory';
      else { this.state='board-clear'; this.timer=1.8; }
    }
  }
  award(points,type) { this.score+=points; this.best=Math.max(this.best,this.score); this.events.push({type,points}); }
  drainEvents() { return this.events.splice(0); }
  snapshot() {
    return {state:this.state,score:this.score,best:this.best,lives:this.lives,board:this.board,power:this.power,protection:this.protection,
      remaining:this.pellets.size,player:{...this.player,...position(this.player)},enemies:this.enemies.map(e=>({...e,...position(e)})),timer:this.timer};
  }
}

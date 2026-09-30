import {test,expect} from '@playwright/test';
const errors=[];
test.beforeEach(async({page})=>{errors.length=0;page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});});
async function open(page){await page.goto('?test');await expect(page.locator('body')).toHaveAttribute('data-renderer','webgpu');await expect(page.locator('#primary')).toBeEnabled();}

test('actual keyboard play, directional pointer input, pause, focus loss, audio and replay',async({page})=>{
  await open(page);await page.locator('#primary').click();await expect(page.locator('body')).toHaveAttribute('data-state','playing');
  await page.keyboard.press('ArrowLeft');await expect.poll(async()=>Number(await page.locator('#score').textContent())).toBeGreaterThan(0);
  await page.keyboard.press('p');await expect(page.locator('body')).toHaveAttribute('data-state','paused');
  const frozen=await page.evaluate(()=>window.__arcade.snapshot());await page.waitForTimeout(250);expect((await page.evaluate(()=>window.__arcade.snapshot())).player.x).toBe(frozen.player.x);
  await page.locator('#primary').click();await expect(page.locator('body')).toHaveAttribute('data-state','playing');
  const direction=page.getByRole('button',{name:'Move right'});const box=await direction.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await expect(direction).toHaveClass(/pressed/);await page.mouse.up();await expect(direction).not.toHaveClass(/pressed/);
  await page.locator('#mute').click();await expect(page.locator('#mute')).toHaveAttribute('aria-pressed','true');await page.locator('#mute').click();await expect(page.locator('#mute')).toHaveAttribute('aria-pressed','false');
  expect(await page.evaluate(()=>window.__arcade.audio.context?.state)).toBe('running');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('body')).toHaveAttribute('data-state','paused');
  await page.locator('#help').click();await expect(page.locator('#instructions')).toBeVisible();await page.locator('#help-done').click();await expect(page.locator('#instructions')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('power refresh, capture, expiry, life loss, game over, restart and best persistence',async({page})=>{
  await open(page);await page.locator('#primary').click();
  const result=await page.evaluate(()=>{
    const a=window.__arcade,g=a.game;a.manual=true;g.state='playing';g.player.direction=null;g.enemies.forEach(e=>e.release=10000);
    g.collect(g.maze.powers[0]);g.combo=2;a.tick(1);g.collect(g.maze.powers[1]);const refreshed=g.power,combo=g.combo;
    const e=g.enemies[0];Object.assign(e,{tile:g.player.tile,next:null,progress:0,mode:'active'});a.tick(.02);const captured=e.mode,score=g.score;
    g.enemies.forEach(e=>{e.mode='waiting';e.release=10000;});a.tick(6.1);const expired=g.power;
    for(let i=0;i<3;i++){g.state='playing';g.protection=0;g.player.direction=null;Object.assign(g.enemies[0],{tile:g.player.tile,next:null,progress:0,mode:'active'});a.tick(.02);}
    a.draw();return{refreshed,combo,captured,score,expired,state:g.state,lives:g.lives};
  });
  expect(result).toMatchObject({refreshed:6,combo:0,captured:'returning',score:300,expired:0,state:'game-over',lives:0});
  await expect(page.getByRole('heading',{name:'GAME OVER'})).toBeVisible();await expect.poll(()=>page.evaluate(()=>localStorage.getItem('neon-nibbler.best'))).toBe('300');
  await page.locator('#primary').click();expect(await page.evaluate(()=>window.__arcade.snapshot())).toMatchObject({score:0,lives:3,board:0,state:'ready'});
  await page.reload();await expect(page.locator('#best')).toHaveText('000300');expect(errors).toEqual([]);
});

test('three-board path sweep reaches victory using legal movement',async({page})=>{
  await open(page);await page.locator('#primary').click();
  const result=await page.evaluate(async()=>{
    const {neighbors,distanceMap}=await import('/babylon-lite-pacman-maze-chase-clone/src/mazes.js');const a=window.__arcade,g=a.game;a.manual=true;g.state='playing';
    const boards=[];let iterations=0,lastBoard=-1;
    while(g.state!=='victory'&&iterations++<150000){
      if(g.board!==lastBoard){boards.push(g.maze.name);lastBoard=g.board;}
      if(g.state==='playing'){
        g.enemies.forEach(e=>{e.mode='waiting';e.release=10000;});
        const from=g.player.next??g.player.tile,distance=distanceMap(g.maze,from),target=[...g.pellets.keys()].sort((x,y)=>distance[x]-distance[y])[0];
        if(target!==from){const toTarget=distanceMap(g.maze,target),n=neighbors(g.maze,from).sort((x,y)=>toTarget[x.id]-toTarget[y.id])[0];g.request(n.direction);}
      }
      g.step(1/120);
    }
    a.draw();return{...g.snapshot(),boards,iterations,drawCalls:a.drawCalls()};
  });
  expect(result.state).toBe('victory');expect(result.boards).toEqual(['The Circuit','Switchyard','After Hours']);expect(result.score).toBe(7740);expect(result.remaining).toBe(0);expect(result.drawCalls).toBeGreaterThan(0);
  await expect(page.getByRole('heading',{name:'MAZE MASTER'})).toBeVisible();await page.locator('#primary').click();expect(await page.evaluate(()=>window.__arcade.snapshot())).toMatchObject({state:'ready',score:0,lives:3,board:0});expect(errors).toEqual([]);
});

test('desktop and mobile layouts fit the landscape board and reachable controls',async({page})=>{
  await open(page);await page.screenshot({path:'project-name/documentation/title-desktop.png'});
  await page.locator('#primary').click();await page.evaluate(()=>{window.__arcade.manual=true;window.__arcade.tick(1.6);});
  await page.screenshot({path:'project-name/documentation/screenshot01.png'});
  for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(100);
    const geometry=await page.evaluate(()=>{const canvas=document.querySelector('#game').getBoundingClientRect(),pad=document.querySelector('.dpad').getBoundingClientRect();return{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,canvas:{x:canvas.x,y:canvas.y,w:canvas.width,h:canvas.height},pad:{x:pad.x,y:pad.y,w:pad.width,h:pad.height}};});
    expect(geometry.canvas.w/geometry.canvas.h).toBeCloseTo(29/17,1);expect(geometry.scrollWidth).toBeLessThanOrEqual(viewport.width);expect(geometry.scrollHeight).toBeLessThanOrEqual(viewport.height+1);expect(geometry.pad.y+geometry.pad.h).toBeLessThanOrEqual(viewport.height);
    if(viewport.width===390)await page.screenshot({path:'project-name/documentation/mobile-portrait.png'});
    if(viewport.width===844)await page.screenshot({path:'project-name/documentation/mobile-landscape.png'});
    await page.evaluate(()=>{window.__arcade.game.state='title';window.__arcade.draw();});
    const cardFits=await page.evaluate(()=>{const card=document.querySelector('.overlay-card').getBoundingClientRect(),screen=document.querySelector('.screen').getBoundingClientRect();return card.top>=screen.top && card.bottom<=screen.bottom && card.left>=screen.left && card.right<=screen.right;});
    expect(cardFits).toBe(true);await page.evaluate(()=>{window.__arcade.game.state='playing';window.__arcade.draw();});
  }
  expect(errors).toEqual([]);
});

test('emulated touch activates directional movement and releases visual input',async({browser})=>{
  const context=await browser.newContext({baseURL:'http://127.0.0.1:5173/babylon-lite-pacman-maze-chase-clone/',viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();await open(page);await page.locator('#primary').tap();await expect(page.locator('body')).toHaveAttribute('data-state','playing');await page.getByRole('button',{name:'Move up'}).tap();
  await expect.poll(()=>page.evaluate(()=>window.__arcade.game.wanted)).toBe('up');await expect(page.getByRole('button',{name:'Move up'})).not.toHaveClass(/pressed/);await context.close();
});

test('unavailable storage still permits play',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('Unavailable');};Storage.prototype.setItem=()=>{throw new Error('Unavailable');};});await open(page);await page.locator('#primary').click();await expect(page.locator('body')).toHaveAttribute('data-state','playing');await expect.poll(async()=>Number(await page.locator('#score').textContent())).toBeGreaterThan(0);expect(errors).toEqual([]);
});

test('unsupported WebGPU explains recovery with a retry button',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,'gpu',{value:undefined}));await page.goto('./');await expect(page.locator('body')).toHaveAttribute('data-state','error');await expect(page.locator('#overlay-copy')).toContainText('WebGPU is unavailable');await expect(page.locator('#primary')).toHaveText(/RETRY/);await expect(page.locator('#primary')).toBeEnabled();expect(errors).toEqual([]);
});

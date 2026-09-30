import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./project-name/test/browser',timeout:60000,workers:1,
  use:{channel:'chromium',baseURL:'http://127.0.0.1:5173/babylon-lite-pacman-maze-chase-clone/',viewport:{width:1440,height:900},
    launchOptions:{args:['--enable-unsafe-webgpu','--ignore-gpu-blocklist','--disable-dawn-features=tint_ir']},trace:'retain-on-failure'},
  webServer:{command:'npm run dev -- --port 5173',url:'http://127.0.0.1:5173/babylon-lite-pacman-maze-chase-clone/',reuseExistingServer:true},
});

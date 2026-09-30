export const COLS = 29;
export const ROWS = 17;
export const key = (x, y) => y * COLS + x;
export const xy = id => ({ x: id % COLS, y: Math.floor(id / COLS) });
export const DIRECTIONS = {
  up: { x: 0, y: -1 }, right: { x: 1, y: 0 },
  down: { x: 0, y: 1 }, left: { x: -1, y: 0 },
};
export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

// Explicit, original corridor runs: [row, first column, last column] and vice versa.
const layouts = [
  {
    name: 'The Circuit', subtitle: 'Find your rhythm.',
    horizontal: [[1,1,27],[5,1,27],[9,1,27],[13,1,27],[15,1,27],[3,3,11],[3,17,25],[7,11,17],[11,3,11],[11,17,25]],
    vertical: [[1,1,15],[7,1,15],[14,1,15],[21,1,15],[27,1,15],[3,1,5],[11,1,5],[17,1,5],[25,1,5],[3,9,13],[11,9,13],[17,9,13],[25,9,13],[11,5,9],[17,5,9]],
  },
  {
    name: 'Switchyard', subtitle: 'Every turn is a decision.',
    horizontal: [[1,1,27],[3,1,27],[7,1,27],[11,1,27],[15,1,27],[5,5,11],[5,17,23],[9,3,9],[9,19,25],[13,5,23]],
    vertical: [[1,1,15],[5,1,15],[11,1,15],[17,1,15],[23,1,15],[27,1,15],[14,3,15],[3,7,11],[9,7,11],[19,7,11],[25,7,11],[8,11,15],[20,11,15]],
  },
  {
    name: 'After Hours', subtitle: 'Keep moving. Stay electric.',
    horizontal: [[1,1,27],[5,1,27],[7,1,27],[11,1,27],[15,1,27],[3,3,9],[3,19,25],[9,5,11],[9,17,23],[13,3,11],[13,17,25]],
    vertical: [[1,1,15],[9,1,15],[14,1,15],[19,1,15],[27,1,15],[3,1,5],[25,1,5],[5,5,11],[11,5,15],[17,5,15],[23,5,11],[3,11,15],[25,11,15]],
  },
];

export function makeMaze(index) {
  const layout = layouts[index];
  const floor = new Uint8Array(COLS * ROWS);
  for (const [y, from, to] of layout.horizontal) for (let x = from; x <= to; x++) floor[key(x,y)] = 1;
  for (const [x, from, to] of layout.vertical) for (let y = from; y <= to; y++) floor[key(x,y)] = 1;
  const spawn = key(14,15), home = key(14,7);
  const homes = [key(11,7),key(13,7),key(15,7),key(17,7)];
  for (let x = 11; x <= 17; x++) floor[key(x,7)] = 1;
  const powers = [key(1,1),key(27,1),key(1,15),key(27,15)];
  const pellets = new Map();
  floor.forEach((open,id) => { if (open && id !== spawn && !homes.includes(id) && id !== home) pellets.set(id, powers.includes(id) ? 2 : 1); });
  const maze = { ...layout, floor, spawn, home, homes, powers, pellets };
  validateMaze(maze);
  return maze;
}

export function neighbors(maze, id) {
  const {x,y} = xy(id);
  return Object.entries(DIRECTIONS).flatMap(([direction,d]) => {
    const nx=x+d.x, ny=y+d.y;
    return nx>=0 && nx<COLS && ny>=0 && ny<ROWS && maze.floor[key(nx,ny)] ? [{id:key(nx,ny),direction}] : [];
  });
}

export function distanceMap(maze, target) {
  const distances = new Int16Array(COLS * ROWS).fill(-1);
  if (!maze.floor[target]) return distances;
  const queue = [target]; distances[target] = 0;
  for (let i=0; i<queue.length; i++) for (const n of neighbors(maze,queue[i])) if (distances[n.id]<0) {
    distances[n.id] = distances[queue[i]]+1; queue.push(n.id);
  }
  return distances;
}

export function validateMaze(maze) {
  const reachable = distanceMap(maze,maze.spawn);
  for (let id=0; id<maze.floor.length; id++) if (maze.floor[id]) {
    const {x,y} = xy(id);
    if (x===0 || y===0 || x===COLS-1 || y===ROWS-1) throw new Error('Maze boundary is open');
    if (reachable[id]<0) throw new Error(`Disconnected corridor ${id}`);
    if (!neighbors(maze,id).length) throw new Error(`Trapped tile ${id}`);
  }
  if (maze.powers.length!==4 || maze.powers.some(id=>maze.pellets.get(id)!==2)) throw new Error('Invalid power pellets');
  if ([maze.spawn,...maze.homes].some(id=>!maze.floor[id])) throw new Error('Invalid spawn');
  return true;
}

export const MAZES = layouts.map((_,index)=>makeMaze(index));

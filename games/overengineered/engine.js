(function(root){
  'use strict';
  const W=8,H=6,DIRS=[[1,0],[0,1],[-1,0],[0,-1]],ARROWS=['→','↓','←','↑'];
  const TYPES={ramp:{name:'Ramp',step:1,color:'#ffbf58',verb:'roll',hint:'Rolls 1 socket in the arrow direction.'},domino:{name:'Dominoes',step:1,color:'#f082a5',verb:'clack',hint:'Topple a row; pass the marble 1 socket.'},spring:{name:'Spring',step:2,color:'#b5a2ff',verb:'boing',hint:'Jumps 2 sockets, skipping one in between.'},fan:{name:'Fan',step:3,color:'#67d9cb',verb:'whoosh',hint:'Blows 3 sockets, skipping two in between.'}};
  const piece=(x,y,t,d=0)=>({x,y,t,d});
  const levels=[
    {name:'A very long doorbell',brief:'Fill the three empty sockets between the marble and bell.',hint:'Place ramps at B3 and E3, and dominoes at C3. All arrows point right.',start:[0,2],goal:[5,2],fixed:[piece(3,2,'domino')],solution:[piece(1,2,'ramp'),piece(2,2,'domino'),piece(4,2,'ramp')],keys:[],blocks:[]},
    {name:'Take the scenic route',brief:'Turn the corner. Touch the brass checkpoint on your way.',hint:'Send B2 down to the fixed dominoes, then turn right at B4.',start:[0,1],goal:[4,3],fixed:[piece(1,2,'domino',1),piece(2,3,'domino')],solution:[piece(1,1,'ramp',1),piece(1,3,'ramp'),piece(3,3,'ramp')],keys:[[1,3]],blocks:[[2,1],[3,1],[3,2]]},
    {name:'A spring in your step',brief:'Springs leap over one socket. Mind where they land.',hint:'Jump from B4 to D4. Climb to D2, then spring across to F2.',start:[0,3],goal:[6,1],fixed:[],solution:[piece(1,3,'spring'),piece(3,3,'ramp',3),piece(3,2,'domino',3),piece(3,1,'spring'),piece(5,1,'ramp')],keys:[[3,3],[3,1]],blocks:[[2,3],[4,1],[2,2],[4,2]]},
    {name:'A lot of hot air',brief:'Fans carry the marble three sockets. Aim before you launch.',hint:'A fan at B5 lands on E5. The next fan at E3 lands on H3.',start:[0,4],goal:[7,1],fixed:[],solution:[piece(1,4,'fan'),piece(4,4,'domino',3),piece(4,3,'ramp',3),piece(4,2,'fan'),piece(7,2,'ramp',3)],keys:[[4,3]],blocks:[[2,4],[3,4],[5,2],[6,2],[6,1]]},
    {name:'Unnecessary detour',brief:'Go down, across, and back up. All to ring one tiny bell.',hint:'Spring down from B2. The fan belongs on C5, aimed at F5.',start:[0,1],goal:[6,2],fixed:[piece(1,3,'domino')],solution:[piece(1,1,'spring',1),piece(2,3,'ramp',1),piece(2,4,'fan'),piece(5,4,'spring',3),piece(5,2,'ramp')],keys:[[2,4],[5,2]],blocks:[[1,2],[3,4],[4,4],[5,3],[3,2]]},
    {name:'The upstairs department',brief:'Every handoff matters. A fixed domino row waits upstairs.',hint:'Fan up from B5 to B2. Jump across to E2, then down and across to G4.',start:[0,4],goal:[6,1],fixed:[piece(4,2,'domino',1)],solution:[piece(1,4,'fan',3),piece(1,1,'ramp'),piece(2,1,'spring'),piece(4,1,'ramp',1),piece(4,3,'spring'),piece(6,3,'ramp',3),piece(6,2,'domino',3)],keys:[[4,2],[6,3]],blocks:[[1,2],[1,3],[3,1],[5,3],[5,1]]},
    {name:'Bureau of extra steps',brief:'Three checkpoints. Two fans. One questionable use of time.',hint:'Visit B5, E4, then G2. The final fan blows down from G2 to G5.',start:[0,1],goal:[7,4],fixed:[],solution:[piece(1,1,'fan',1),piece(1,4,'ramp'),piece(2,4,'spring'),piece(4,4,'domino',3),piece(4,3,'ramp'),piece(5,3,'spring',3),piece(5,1,'ramp'),piece(6,1,'fan',1),piece(6,4,'ramp')],keys:[[1,4],[4,3],[6,1]],blocks:[[1,2],[1,3],[3,4],[5,2],[6,2],[6,3]]},
    {name:'The entire department',brief:'An elaborate, utterly avoidable tour of the whole workbench.',hint:'Go B3 → B1 → E1 → F2 → F4 → E4 → B4 → B6 → E6 → G6 → G5.',start:[0,2],goal:[6,4],fixed:[piece(4,1,'domino')],solution:[piece(1,2,'spring',3),piece(1,0,'fan'),piece(4,0,'ramp',1),piece(5,1,'spring',1),piece(5,3,'ramp',2),piece(4,3,'fan',2),piece(1,3,'spring',1),piece(1,5,'fan'),piece(4,5,'spring'),piece(6,5,'ramp',3)],keys:[[4,0],[5,3],[1,5]],blocks:[[1,1],[2,0],[3,0],[5,2],[3,3],[2,3],[1,4],[2,5],[3,5],[5,5]]}
  ];
  for(const l of levels){l.inventory={};for(const p of l.solution)l.inventory[p.t]=(l.inventory[p.t]||0)+1;}
  const key=(x,y)=>`${x},${y}`;
  function trace(level,placed){
    const all=new Map([...level.fixed,...placed].map(p=>[key(p.x,p.y),p]));
    const blocks=new Set(level.blocks.map(p=>key(...p))),visited=new Set(),hit=new Set();
    const path=[{x:level.start[0],y:level.start[1],t:'start',d:0,step:1}];
    let x=level.start[0]+1,y=level.start[1];
    for(let i=0;i<64;i++){
      const k=key(x,y);path.push({x,y,t:'empty',d:0,step:0});
      if(x<0||x>=W||y<0||y>=H)return {path,ok:false,reason:'Off the workbench! Turn the last part toward a socket.',hit:[...hit]};
      if(blocks.has(k))return {path,ok:false,reason:'That landing is blocked. A spring or fan can skip over it.',hit:[...hit]};
      if(level.keys.some(p=>key(...p)===k))hit.add(k);
      if(x===level.goal[0]&&y===level.goal[1])return {path,ok:hit.size===level.keys.length,reason:hit.size===level.keys.length?'Ding! An unreasonable amount of work. A beautiful result.':`Nearly! Touch all ${level.keys.length} brass checkpoints before ringing the bell.`,hit:[...hit]};
      if(visited.has(k))return {path,ok:false,reason:'A loop! Turn one of those parts to give the marble a way out.',hit:[...hit]};
      visited.add(k);const p=all.get(k);
      if(!p)return {path,ok:false,reason:`Missing a part at ${String.fromCharCode(65+x)}${y+1}. Give the marble its next move.`,hit:[...hit]};
      const step=TYPES[p.t].step;Object.assign(path[path.length-1],{...p,step});
      x+=DIRS[p.d][0]*step;y+=DIRS[p.d][1]*step;
    }
    return {path,ok:false,reason:'This machine has too many loops.',hit:[...hit]};
  }
  const api={W,H,DIRS,ARROWS,TYPES,levels,piece,key,trace};
  if(typeof module!=='undefined')module.exports=api;else root.Machine=api;
})(typeof window!=='undefined'?window:{});

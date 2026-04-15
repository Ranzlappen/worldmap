import { nodeMap } from './nodes.js';

export function buildConnections(){
  let seed=12345;
  function rng(){seed=(seed*1664525+1013904223)&0x7FFFFFFF;return seed/0x7FFFFFFF;}
  function j(base,range=12){return Math.min(99,Math.max(20,Math.round(base+(rng()-.5)*range*2)));}

  const C={culture:[],religion:[],politics:[],economics:[],media:[],military:[],technology:[],migration:[]};
  const seen={};

  function add(layer,a,b,base,range=12){
    if(!nodeMap[a]||!nodeMap[b]||a===b) return;
    const k=[a,b].sort().join('|')+':'+layer;
    if(seen[k]) return;
    seen[k]=1;
    C[layer].push([a,b,j(base,range)]);
  }

  function group(layer,ids,base,range=12){
    for(let i=0;i<ids.length;i++)
      for(let j2=i+1;j2<ids.length;j2++)
        add(layer,ids[i],ids[j2],base,range);
  }

  const W=['usa','uk','france','germany','italy','spain','canada','netherlands','sweden','norway','poland','portugal','greece','ukraine','israel','russia'];
  const LA=['brazil','mexico','argentina','colombia','chile','peru','venezuela','ecuador','cuba','uruguay','bolivia'];
  const EA=['china','japan','southkorea','vietnam','thailand','malaysia','philippines','singapore','indonesia'];
  const SA=['india','pakistan','bangladesh','srilanka','nepal'];
  const ME=['saudi','iran','turkey','egypt','iraq','uae','jordan','qatar','syria','morocco','algeria'];
  const AF=['nigeria','southafrica','ethiopia','kenya','ghana','tanzania','angola','senegal','drcongo','mozambique'];
  const OC=['australia','newzealand','papuang'];

  //  CULTURE
  group('culture',['usa','uk','canada','australia','newzealand'],90,7);
  group('culture',['france','belgium','switzerland','canada','monaco'],78,10);
  group('culture',['spain','mexico','argentina','colombia','chile','peru','venezuela','ecuador','cuba','uruguay','bolivia'],82,9);
  group('culture',['brazil','portugal','angola','mozambique'],72,12);
  group('culture',['china','japan','southkorea','vietnam'],63,14);
  group('culture',['india','nepal','srilanka','bangladesh'],70,11);
  group('culture',['saudi','egypt','iraq','jordan','uae','qatar','syria','morocco','algeria'],76,10);
  group('culture',['germany','austria','switzerland'],80,8);
  group('culture',['sweden','norway'],87,5);
  group('culture',['nigeria','ghana','senegal','drcongo'],58,14);
  group('culture',['kenya','ethiopia','tanzania','mozambique'],60,13);
  group('culture',['thailand','malaysia','singapore','vietnam','indonesia','philippines'],62,13);
  group('culture',['russia','ukraine','poland'],58,17);
  group('culture',['france','morocco','algeria','senegal','drcongo'],65,12);
  group('culture',['iran','iraq'],64,15);
  group('culture',['turkey','iran','iraq'],52,16);
  group('culture',['southkorea','japan'],70,10);
  add('culture','india','uk',68,10);
  add('culture','india','usa',63,12);
  add('culture','india','iran',56,14);
  add('culture','egypt','turkey',58,14);
  add('culture','nigeria','uk',55,14);
  add('culture','philippines','usa',68,10);
  add('culture','singapore','uk',60,12);
  add('culture','australia','usa',82,8);
  add('culture','newzealand','uk',80,8);
  add('culture','israel','usa',70,10);
  add('culture','france','uk',65,12);
  add('culture','japan','usa',68,12);
  add('culture','southafrica','uk',62,12);

  //  RELIGION
  group('religion',['usa','uk','germany','sweden','norway','netherlands','canada','australia','newzealand'],78,11);
  group('religion',['france','spain','italy','portugal','brazil','mexico','argentina','colombia','chile','peru','venezuela','ecuador','cuba','uruguay','bolivia','philippines','poland'],80,9);
  group('religion',['russia','greece','ukraine','ethiopia'],78,12);
  group('religion',['saudi','egypt','turkey','pakistan','bangladesh','indonesia','malaysia','nigeria','morocco','senegal','iraq','jordan','uae','qatar','syria','algeria'],82,9);
  group('religion',['iran','iraq','syria'],80,11);
  group('religion',['india','nepal','srilanka'],80,9);
  group('religion',['thailand','vietnam','srilanka','japan','southkorea'],63,14);
  add('religion','israel','usa',75,9);
  add('religion','israel','uk',60,12);
  add('religion','nigeria','ghana',70,11);
  add('religion','kenya','ethiopia',65,13);
  add('religion','kenya','tanzania',65,12);
  add('religion','southafrica','nigeria',60,13);
  add('religion','india','pakistan',36,14);
  add('religion','india','saudi',44,14);
  add('religion','iran','turkey',50,16);
  add('religion','malaysia','indonesia',78,9);
  add('religion','india','iran',55,14);
  add('religion','ethiopia','egypt',60,14);

  //  POLITICS
  group('politics',['usa','uk','france','germany','italy','spain','netherlands','norway','sweden','poland','canada','turkey','greece','portugal'],83,9);
  group('politics',['usa','uk','france','germany','italy','canada','japan'],89,7);
  group('politics',['france','germany','italy','spain','netherlands','sweden','poland','greece','portugal'],80,9);
  group('politics',['usa','japan','india','australia'],80,9);
  group('politics',['china','russia','india','pakistan','iran'],65,14);
  group('politics',['brazil','russia','india','china','southafrica','iran','uae','egypt','ethiopia'],67,12);
  group('politics',['saudi','egypt','iraq','jordan','uae','qatar','syria','morocco','algeria'],71,11);
  group('politics',['vietnam','thailand','malaysia','philippines','singapore','indonesia'],75,9);
  group('politics',['nigeria','southafrica','ethiopia','kenya','ghana','tanzania','angola','senegal'],62,13);
  group('politics',['usa','uk','canada','australia','newzealand'],90,6);
  add('politics','usa','israel',93,4);
  add('politics','usa','saudi',76,10);
  add('politics','usa','japan',88,7);
  add('politics','usa','southkorea',85,7);
  add('politics','usa','india',70,10);
  add('politics','usa','australia',88,7);
  add('politics','usa','colombia',72,10);
  add('politics','usa','philippines',74,10);
  add('politics','russia','iran',68,12);
  add('politics','russia','syria',72,10);
  add('politics','russia','ukraine',22,20);
  add('politics','russia','china',75,10);
  add('politics','china','pakistan',80,8);
  add('politics','turkey','russia',50,16);
  add('politics','turkey','iran',48,16);
  add('politics','turkey','usa',62,14);
  add('politics','turkey','qatar',72,10);
  add('politics','india','russia',62,12);
  add('politics','india','iran',54,14);
  add('politics','india','israel',67,10);
  add('politics','india','usa',70,10);
  add('politics','japan','australia',68,11);
  add('politics','japan','india',62,12);
  add('politics','france','senegal',70,11);
  add('politics','france','morocco',68,11);
  add('politics','france','algeria',52,16);
  add('politics','china','uae',68,12);
  add('politics','china','egypt',65,12);
  add('politics','israel','uae',72,10);
  add('politics','israel','morocco',65,12);
  add('politics','israel','jordan',60,13);
  add('politics','southkorea','japan',58,15);

  //  ECONOMICS
  const G20=['usa','china','germany','japan','france','uk','india','brazil','canada','australia','southkorea','russia','italy','mexico','spain','indonesia','turkey','argentina','saudi','southafrica'];
  group('economics',G20,68,15);
  const BRI=['pakistan','bangladesh','srilanka','kenya','ethiopia','tanzania','angola','egypt','iran','iraq','malaysia','vietnam','thailand','philippines','singapore','greece','italy','portugal','drcongo','mozambique'];
  BRI.forEach(c=>add('economics','china',c,72,13));
  group('economics',['usa','mexico','canada'],90,5);
  group('economics',['france','germany','italy','spain','netherlands','sweden','poland','greece','portugal'],82,9);
  group('economics',['saudi','uae','iran','iraq','russia','nigeria','angola','venezuela','ecuador'],70,13);
  group('economics',['japan','canada','australia','newzealand','mexico','chile','peru','vietnam','malaysia','singapore'],75,11);
  group('economics',['saudi','uae','qatar'],85,7);
  ['india','pakistan','bangladesh','srilanka','egypt','jordan','philippines','indonesia','vietnam','kenya','ethiopia'].forEach(c=>{
    add('economics','uae',c,67,12);
    add('economics','saudi',c,62,13);
  });
  AF.forEach(c=>add('economics','china',c,64,14));
  group('economics',['brazil','argentina','uruguay','bolivia'],78,9);
  group('economics',['colombia','peru','ecuador','bolivia'],70,11);
  add('economics','india','usa',78,9);
  add('economics','india','uk',70,10);
  add('economics','india','china',70,11);
  add('economics','india','australia',63,12);
  add('economics','india','russia',60,13);
  add('economics','india','uae',72,10);
  add('economics','australia','china',85,8);
  add('economics','australia','japan',78,9);
  add('economics','australia','southkorea',72,10);
  add('economics','australia','india',64,12);
  add('economics','newzealand','australia',82,7);
  add('economics','newzealand','china',68,12);
  add('economics','japan','usa',82,8);
  add('economics','southkorea','usa',78,9);
  add('economics','southkorea','china',80,9);
  add('economics','singapore','usa',72,10);
  add('economics','singapore','china',74,10);
  add('economics','turkey','russia',62,14);
  add('economics','turkey','iran',55,15);
  add('economics','turkey','uae',65,12);
  add('economics','russia','china',80,9);

  //  MEDIA
  group('media',['usa','uk','canada','australia','newzealand'],88,7);
  ['india','nigeria','ghana','kenya','southafrica','singapore','philippines'].forEach(c=>{
    add('media','usa',c,63,13);
    add('media','uk',c,58,13);
  });
  group('media',['spain','mexico','argentina','colombia','chile','venezuela','cuba','uruguay','bolivia','ecuador','peru'],80,9);
  group('media',['saudi','egypt','uae','qatar','jordan','morocco','algeria','iraq','syria'],75,11);
  ['india','pakistan','bangladesh','srilanka','nepal','uae','saudi','uk','nigeria','kenya','southafrica','malaysia','singapore'].forEach(c=>{
    if(c!=='india') add('media','india',c,70,13);
  });
  ['southkorea','china','japan','vietnam','thailand','malaysia','philippines','singapore','indonesia','usa','france'].forEach(c=>{
    if(c!=='southkorea') add('media','southkorea',c,67,13);
  });
  group('media',['russia','ukraine'],65,17);
  ['france','senegal','morocco','algeria','drcongo'].forEach(c=>{
    if(c!=='france') add('media','france',c,64,13);
  });
  ['nigeria','ghana','kenya','ethiopia','tanzania','southafrica','angola','senegal','drcongo'].forEach(c=>{
    if(c!=='nigeria') add('media','nigeria',c,60,13);
  });
  ['china','singapore','malaysia','vietnam','southkorea'].forEach(c=>{
    if(c!=='china') add('media','china',c,60,13);
  });
  ['japan','usa','france','uk','china','southkorea','brazil','australia','germany'].forEach(c=>{
    if(c!=='japan') add('media','japan',c,67,11);
  });
  add('media','turkey','iran',52,16);
  add('media','turkey','egypt',58,14);
  add('media','turkey','russia',50,16);
  add('media','brazil','usa',68,11);
  add('media','brazil','portugal',65,12);
  add('media','australia','usa',78,9);
  add('media','newzealand','australia',72,10);
  add('media','indonesia','malaysia',65,12);
  add('media','philippines','usa',68,11);
  add('media','singapore','usa',62,12);

  //  MILITARY
  group('military',['usa','uk','france','germany','canada','netherlands','norway','sweden','poland','italy','spain','portugal','greece'],83,9);
  group('military',['usa','uk','australia'],92,5);
  group('military',['usa','uk','canada','australia','newzealand'],90,6);
  ['japan','southkorea','israel','saudi','uae','egypt','jordan','philippines','singapore','india','colombia','morocco'].forEach(c=>add('military','usa',c,71,13));
  group('military',['russia','iran','syria'],68,13);
  add('military','russia','china',65,14);
  add('military','russia','india',60,14);
  add('military','china','pakistan',82,7);
  group('military',['saudi','uae','egypt','jordan'],72,11);
  add('military','india','france',68,11);
  add('military','india','israel',70,9);
  add('military','india','usa',68,11);
  add('military','india','russia',62,13);
  add('military','india','japan',60,14);
  add('military','india','australia',62,13);
  group('military',['nigeria','ghana','kenya','southafrica'],55,17);
  add('military','france','senegal',72,9);
  add('military','france','morocco',65,11);
  add('military','france','egypt',62,11);
  add('military','turkey','qatar',68,11);
  add('military','turkey','ukraine',60,14);
  add('military','japan','australia',65,11);
  add('military','japan','india',60,14);
  add('military','southkorea','usa',86,7);
  add('military','southkorea','australia',60,14);
  add('military','israel','uae',65,12);
  add('military','israel','jordan',58,14);
  add('military','israel','morocco',55,15);
  add('military','australia','india',62,13);
  add('military','australia','japan',65,11);
  add('military','australia','singapore',68,11);
  add('military','newzealand','australia',80,8);
  add('military','singapore','usa',72,10);
  add('military','philippines','usa',74,10);
  add('military','egypt','russia',52,16);
  add('military','angola','russia',50,18);
  add('military','ethiopia','usa',55,16);
  add('military','kenya','usa',60,14);

  //  TECHNOLOGY
  group('technology',['usa','uk','canada','israel'],88,6);
  group('technology',['usa','japan','southkorea','china'],82,9);
  add('technology','usa','india',85,7);
  add('technology','usa','germany',75,10);
  add('technology','usa','france',68,11);
  add('technology','usa','australia',65,12);
  add('technology','usa','singapore',70,10);
  add('technology','usa','brazil',55,14);
  group('technology',['china','japan','southkorea','singapore'],78,10);
  add('technology','china','vietnam',65,12);
  add('technology','china','malaysia',60,13);
  add('technology','china','indonesia',55,14);
  add('technology','japan','vietnam',62,12);
  add('technology','japan','thailand',60,12);
  add('technology','southkorea','vietnam',68,10);
  group('technology',['uk','germany','france','netherlands','sweden'],72,11);
  add('technology','netherlands','southkorea',70,9);
  add('technology','netherlands','usa',72,9);
  add('technology','sweden','india',55,14);
  add('technology','germany','china',65,12);
  add('technology','india','uk',70,10);
  add('technology','india','singapore',62,12);
  add('technology','india','japan',58,13);
  add('technology','india','australia',55,14);
  add('technology','india','uae',60,12);
  add('technology','israel','india',65,11);
  add('technology','israel','singapore',60,12);
  add('technology','nigeria','india',48,16);
  add('technology','kenya','india',50,15);
  add('technology','southafrica','india',50,14);
  add('technology','brazil','china',52,14);
  add('technology','uae','india',58,13);
  add('technology','uae','usa',60,12);
  add('technology','egypt','china',48,16);
  add('technology','turkey','germany',55,14);
  add('technology','australia','japan',60,12);
  add('technology','australia','southkorea',58,13);
  add('technology','newzealand','australia',68,10);

  //  MIGRATION
  add('migration','india','uae',90,5);
  add('migration','india','saudi',85,6);
  add('migration','india','usa',82,7);
  add('migration','india','uk',80,7);
  add('migration','india','canada',78,8);
  add('migration','india','australia',72,9);
  add('migration','india','qatar',80,7);
  add('migration','pakistan','uae',82,7);
  add('migration','pakistan','saudi',80,8);
  add('migration','pakistan','uk',75,9);
  add('migration','bangladesh','uae',78,8);
  add('migration','bangladesh','saudi',75,9);
  add('migration','bangladesh','malaysia',72,10);
  add('migration','nepal','india',85,6);
  add('migration','srilanka','uae',70,10);
  add('migration','mexico','usa',92,4);
  add('migration','colombia','usa',70,10);
  add('migration','brazil','usa',62,12);
  add('migration','venezuela','colombia',85,6);
  add('migration','cuba','usa',75,9);
  add('migration','ecuador','usa',65,11);
  add('migration','peru','chile',68,10);
  add('migration','bolivia','argentina',72,9);
  add('migration','argentina','spain',68,10);
  add('migration','brazil','portugal',70,10);
  add('migration','nigeria','uk',72,10);
  add('migration','nigeria','usa',65,11);
  add('migration','ghana','uk',62,12);
  add('migration','ethiopia','usa',55,14);
  add('migration','ethiopia','saudi',68,10);
  add('migration','kenya','uk',60,12);
  add('migration','senegal','france',75,9);
  add('migration','morocco','france',80,7);
  add('migration','morocco','spain',78,8);
  add('migration','algeria','france',82,7);
  add('migration','drcongo','france',60,12);
  add('migration','mozambique','southafrica',72,10);
  add('migration','angola','portugal',70,10);
  add('migration','southafrica','uk',65,11);
  add('migration','southafrica','australia',62,12);
  add('migration','china','usa',80,8);
  add('migration','china','canada',75,9);
  add('migration','china','australia',78,8);
  add('migration','china','singapore',72,9);
  add('migration','china','uk',65,11);
  add('migration','philippines','usa',78,8);
  add('migration','philippines','uae',75,9);
  add('migration','philippines','saudi',72,10);
  add('migration','indonesia','saudi',68,10);
  add('migration','indonesia','malaysia',75,9);
  add('migration','vietnam','usa',62,12);
  add('migration','japan','usa',58,13);
  add('migration','japan','brazil',55,14);
  add('migration','southkorea','usa',68,10);
  add('migration','turkey','germany',82,7);
  add('migration','syria','turkey',88,5);
  add('migration','syria','germany',72,10);
  add('migration','iraq','jordan',70,10);
  add('migration','egypt','uae',72,9);
  add('migration','egypt','saudi',68,10);
  add('migration','jordan','uae',65,11);
  add('migration','uk','australia',78,8);
  add('migration','uk','canada',72,9);
  add('migration','uk','usa',70,10);
  add('migration','italy','argentina',65,11);
  add('migration','italy','usa',60,12);
  add('migration','poland','uk',78,8);
  add('migration','poland','germany',75,9);
  add('migration','ukraine','poland',85,6);
  add('migration','greece','germany',62,12);

  return C;
}

export const CONNECTIONS = buildConnections();

// Precomputed adjacency index: nodeId → Set<connectedNodeId>
// Avoids O(n*m) getConnected() calls in applyFilters
export const CONNECTION_INDEX = (() => {
  const idx = {};
  for (const [, arcs] of Object.entries(CONNECTIONS)) {
    for (const [a, b] of arcs) {
      (idx[a] ??= new Set()).add(b);
      (idx[b] ??= new Set()).add(a);
    }
  }
  return idx;
})();

const src=require("fs").readFileSync(__dirname + "/game.html","utf8");
const phys=src.split('//PHYS_START')[1].split('//PHYS_END')[0];
const sling=L=>8+1.6*L;
const stats=p=>({thrust:4.5+0.2*p.boost,fuel:p.boost?1+0.15*(p.boost-1):0,drag:0.0022/(1+0.08*p.aero),fric:0.8/(1+0.12*p.wheels)});
const cfg=JSON.parse(process.argv[2]); // {W:[...], pad:{every,first,tgt0,tgtStep,plus}}
eval(phys+`
global.run=function(lv,T){buildCourse(lv,cfg.W[lv]);const q=T/4;const p={sling:Math.ceil(q),wheels:Math.round(q),aero:Math.floor(q),boost:Math.max(0,Math.floor(q)-1)};const st=stats(p);
const c={s:START_S,y:trackH(START_S),u:sling(p.sling),vs:0,vy:0,grounded:true,fuel:st.fuel,air:0,maxS:START_S};let t=0,stop=0,nextPad=cfg.pad?cfg.pad.first:1e9;
while(t<900){physStep(c,1/120,st,c.s>VALLEY+20);t+=1/120; if(c.grounded&&c.u>0&&c.u<4.5) c.u=Math.max(0,c.u-(0.5+1.7*(1-c.u/4.5))/120);
 if(c.s>=nextPad){ if(c.grounded){ if(cfg.pad.C) c.u=Math.sqrt(c.u*c.u+cfg.pad.C); else {const tg=cfg.pad.tgt0+cfg.pad.tgtStep*lv; c.u=c.u<tg?tg:c.u+cfg.pad.plus;} } nextPad+=cfg.pad.every; }
if(c.grounded&&c.u<0.6&&t>0.3)stop+=1/120;else stop=0;if(stop>0.15)break; if(c.s>FINISH_S) return 'FIN';}
return Math.round(c.maxS-START_S)}
global.finT=function(lv){for(let T=0;T<=140;T+=4){if(run(lv,T)==='FIN')return T}return '>140'}`);
const out=[];for(let lv=0;lv<5;lv++)out.push('W'+lv+':'+finT(lv));console.log(out.join('  '));

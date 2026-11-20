const src=require("fs").readFileSync(__dirname + "/game.html","utf8");
const phys=src.split('//PHYS_START')[1].split('//PHYS_END')[0];
const sling=L=>8+1.6*L;
const stats=p=>({thrust:4.5+0.2*p.boost,fuel:p.boost?1+0.15*(p.boost-1):0,drag:0.0022/(1+0.08*p.aero),fric:0.8/(1+0.12*p.wheels)});
const W=[{g:9.8,ga:14,climb:0.8,rough:1,len:1300},{g:5.5,ga:7.5,climb:2.0,rough:1,len:1500},{g:9.8,ga:14,climb:1.2,rough:1.15,len:1900},{g:9.8,ga:14,climb:1.35,rough:1.15,len:2100},{g:9.8,ga:14,climb:1.5,rough:1.2,len:2600}];
eval(phys+`
global.run=function(lv,T){buildCourse(lv,W[lv]);const q=T/4;const p={sling:Math.ceil(q),wheels:Math.round(q),aero:Math.floor(q),boost:Math.max(0,Math.floor(q)-1)};const st=stats(p);
const c={s:START_S,y:trackH(START_S),u:sling(p.sling),vs:0,vy:0,grounded:true,fuel:st.fuel,air:0,maxS:START_S};let t=0,stop=0;
while(t<900){physStep(c,1/120,st,c.s>VALLEY+20);t+=1/120; if(c.grounded&&c.u>0&&c.u<4.5) c.u=Math.max(0,c.u-(0.5+1.7*(1-c.u/4.5))/120);
if(c.grounded&&c.u<0.6&&t>0.3)stop+=1/120;else stop=0;if(stop>0.15)break; if(c.s>FINISH_S) return 'FIN';}
return Math.round(c.maxS-START_S)}`);
for(let lv=0;lv<5;lv++){const o=[];for(let T=0;T<=140;T+=8)o.push(T+':'+run(lv,T));console.log('W'+lv,o.join(' '));}

// Deterministic film renderer: every frame is produced at an exact film time (25 fps),
// the page clock is virtual, and every motion (scroll, typing, cursor, captions) is a function of time.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'),cp=require('child_process');
const base=fs.readFileSync('t2.js','utf8').match(/const mock=`([\s\S]*?)`;/)[1];
const seed=require('./seed_fake.js');
const FFMPEG=cp.execSync("python3 -c \"import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())\"").toString().trim();
const FPS=25,TOTAL=75;
const SC=JSON.parse(fs.readFileSync('nl75/script.json','utf8'));
const ids=SC.map(s=>s.id),dur={};SC.forEach(s=>dur[s.id]=s.dur);
const gap=(TOTAL-0.5-ids.reduce((a,k)=>a+dur[k],0))/ids.length;
const LEN={};ids.forEach(k=>LEN[k]=dur[k]+gap+(k==='c12'?0.9:0));
const ONLY=process.env.ONLY?process.env.ONLY.split(','):null;      // render only these scenes (debug)
const OUTV=process.env.OUTV||'silent.mp4';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ease=p=>{p=Math.max(0,Math.min(1,p));return 1-Math.pow(1-p,3);};
const eio=p=>{p=Math.max(0,Math.min(1,p));return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;};
const KEYRE=/Accept all|ublish|Send offers|take it|At my limit|Offer to next best|Send help|Save as done|Add this task|Create event|Tap again|Add link|Mark finished/;

(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1920,height:1080}});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.clock.install({time:Date.now()});
 await p.addInitScript(base);await p.addInitScript(seed);
 await p.addInitScript(()=>{window.__q=function(css,re,exact){var l=document.querySelectorAll(css);for(var i=0;i<l.length;i++){var e=l[i];if(!e.getClientRects().length)continue;if(re==null)return e;var t=(e.innerText||e.value||'').replace(/\s+/g,' ').trim();if(exact?t===re:new RegExp(re,'i').test(t))return e;}return null;};
   window.__leaf=function(root,re){var l=(root||document).querySelectorAll('*');for(var i=0;i<l.length;i++){var e=l[i];if(e.children.length||!e.getClientRects().length)continue;if(new RegExp(re,'i').test(e.textContent||''))return e;}return null;};});
 await p.goto('file:///home/user/RoleFinder/demo/film_frame.html');
 const fA=await (await p.$('#fA')).contentFrame(),fB=await (await p.$('#fB')).contentFrame();
 const F={A:fA,B:fB};
 const settle=async(n)=>{for(let i=0;i<(n||3);i++){await p.clock.runFor(60);}};
 for(let i=0;i<80;i++){const ok=await fA.evaluate(()=>!!(window.__gcg&&window.__seedFake)).catch(()=>false)&&await fB.evaluate(()=>!!(window.__gcg&&window.__seedFake)).catch(()=>false);if(ok)break;await p.clock.runFor(100);await sleep(80);}
 for(const f of [fA,fB])await f.addStyleTag({content:'*{transition:none!important;animation:none!important;scroll-behavior:auto!important}'});
 await p.evaluate(()=>Promise.all([document.fonts.load('600 44px Caveat'),document.fonts.load('400 40px "Instrument Serif"'),document.fonts.load('500 30px Manrope'),document.fonts.load('600 30px Manrope'),document.fonts.load('700 30px Manrope'),document.fonts.ready]));

 // ---------- helpers ----------
 async function sync(from,to){const d=await F[from].evaluate(()=>JSON.stringify(window.__store));await F[to].evaluate(d=>{const s=window.__store;Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,JSON.parse(d));window.__notify();},d);await settle(4);}
 // box of an element (page coordinates), found by css + optional text, in frame w
 async function box(w,css,re,exact,leafRoot){
   const r=await F[w].evaluate(([css,re,exact,leafRoot])=>{var e=leafRoot?window.__leaf(document.querySelector(leafRoot),re):window.__q(css,re,exact);if(!e)return null;var r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};},[css,re,exact,leafRoot]);
   if(!r)return null;
   const fr=await p.evaluate(id=>{var r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};},w==='A'?'fA':'fB');
   const k=fr.w/390;return {x:fr.x+r.x*k,y:fr.y+r.y*k,w:r.w*k,h:r.h*k};
 }
 const scrollY=w=>F[w].evaluate(()=>window.scrollY);
 // y that puts the element near the top of the viewport (offset in css px)
 const yFor=(w,css,re,off,leafRoot)=>F[w].evaluate(([css,re,off,leafRoot])=>{var e=leafRoot?window.__leaf(document.querySelector(leafRoot),re):window.__q(css,re);if(!e)return null;return Math.max(0,e.getBoundingClientRect().top+window.scrollY-off);},[css,re,off,leafRoot]);

 const ff=cp.spawn(FFMPEG,['-y','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate',String(FPS),'-i','-','-c:v','libx264','-preset','fast','-crf','14','-pix_fmt','yuv420p',OUTV],{stdio:['pipe','inherit','inherit']});
 let frameNo=0;const sfx=[],FS={};let filmT=0;
 const SNAP=process.env.SNAP?process.env.SNAP.split(','):[];

 // ---------- scene engine ----------
 async function runScene(id,build,setup){
   const L=LEN[id],nF=Math.round(L*FPS);FS[id]=filmT;
   if(setup)await setup();
   const evs=[],tws=[];
   const S={chip:'PROJECT LEAD',chipP:0,head:'',sub:'',phone:'A',prev:null,note:null,ban:null,card:null,cur:null,rip:null,curPos:{x:1330,y:820},
     act:(t,fn)=>evs.push({t,fn,done:false}),
     tween:(t0,t1,fn)=>tws.push({t0,t1,fn,fin:false}),
     sfx:(t,k)=>sfx.push([filmT+t,k]),
     moveTo:(t0,t1,get)=>{let from,to;S.tween(t0,t1,async u=>{if(!to){to=await get();from=S.cur?{x:S.cur.x,y:S.cur.y}:S.curPos;if(!to){to=from;}}const e=eio(u);S.cur={x:from.x+(to.x-from.x)*e,y:from.y+(to.y-from.y)*e};S.curPos=S.cur;});},
     click:(t,w,fn,key)=>S.act(t,async()=>{S.rip=t;await fn();if(key)sfx.push([filmT+t,'key']);await settle(2);}),
     scrollTo:(t0,t1,w,getY)=>{let y0,y1;S.tween(t0,t1,async u=>{if(y1==null){y0=await scrollY(w);y1=await getY();if(y1==null)y1=y0;}await F[w].evaluate(y=>window.scrollTo(0,y),Math.round(y0+(y1-y0)*eio(u)));});},
     type:(t0,t1,w,css,text,re)=>{let started=false;S.tween(t0,t1,async u=>{await F[w].evaluate(([css,re,text,n,first])=>{var e=window.__q(css,re);if(!e)return;if(first)e.focus();e.value=text.slice(0,n);e.dispatchEvent(new Event('input',{bubbles:true}));},[css,re||null,text,Math.round(text.length*Math.min(1,u)),!started]);started=true;});},
     point:(t,text,w,css,re,leafRoot)=>S.act(t,async()=>{const bx=await box(w,css,re,false,leafRoot);if(!bx)return;S.note={id:id+text,text,tx:Math.min(bx.x+bx.w,1555),ty:bx.y+Math.min(bx.h/2,30),t0:t};}),
     banner:(t0,t1,text)=>{S.ban={text,t0,t1};},
   };
   build(S);
   const fadeIn=S.cardFadeIn||0;
   for(let f=0;f<nF;f++){
     const T=f/FPS;
     for(const e of evs)if(!e.done&&e.t<=T+1e-6){e.done=true;await e.fn();}
     for(const w of tws){if(T>=w.t0&&!w.fin){await w.fn(Math.min(1,(T-w.t0)/Math.max(0.001,w.t1-w.t0)));if(T>=w.t1)w.fin=true;}}
     await p.clock.runFor(40);
     if(ONLY&&!ONLY.includes(id)){continue;}
     // crossfade between the two phones at the start of a scene
     let a=S.phone==='A'?1:0,bb=S.phone==='B'?1:0;
     if(S.prev&&S.prev!==S.phone&&T<0.5){const x=ease(T/0.5);a=S.phone==='A'?x:1-x;bb=1-a;}
     const st={z:S.card?1:1+0.016*eio(T/L),chip:S.chip,chipP:S.chipP,head:S.head,sub:S.sub,ht:T+(S.htShift||0),out:(T>L-0.2&&!S.card)?Math.max(0,(L-T)/0.2):1,a,b:bb,
       note:S.note?{id:S.note.id,text:S.note.text,tx:S.note.tx,ty:S.note.ty,t:T-S.note.t0}:null,
       ban:S.ban&&T>=S.ban.t0&&T<=S.ban.t1?{text:S.ban.text,p:T<S.ban.t1-0.4?Math.min(1,(T-S.ban.t0)/0.6):Math.max(0,(S.ban.t1-T)/0.4)}:null,
       cur:S.cur&&!S.card?{x:S.cur.x,y:S.cur.y,rip:S.rip==null?null:T-S.rip}:null,
       card:S.card?Object.assign({},S.card,{t:T,z:1+0.028*eio(T/L),fade:Math.min(fadeIn?Math.min(1,T/fadeIn):1,S.cardFadeOut?Math.max(0,(L-T)/S.cardFadeOut):1)}):null};
     await p.evaluate(s=>window.__draw(s),st);
     const jpg=await p.screenshot({type:'jpeg',quality:95});
     if(SNAP.includes(id+':'+f))fs.writeFileSync('snap_'+id+'_'+f+'.jpg',jpg);
     if(!ff.stdin.write(jpg))await new Promise(r=>ff.stdin.once('drain',r));
     frameNo++;
   }
   filmT+=nF/FPS;prevPhone=S.phone;
 }
 let prevPhone='A';
 const run=async(id,build,setup)=>{ // wrap so ONLY works and the phone crossfade knows the previous phone
     await runScene(id,S=>{S.prev=prevPhone;build(S);},setup);
 };

 // ---------- the fake company, set up off-screen ----------
 await fA.evaluate(()=>{window.__seedFake();window.__as('admin1',true,'Nana');['u1','u2','u3','u4','u5'].forEach((u,i)=>{window.__store['crew/'+u]={name:['Ama','Kofi','Yaw','Efua','Selorm'][i],updated:'2026-04-21T10:00:00Z'};});window.__notify();window.__gcg.showView('events');});
 await settle(3);await sync('A','B');
 await fB.evaluate(()=>{window.__as('u4',false,'Efua');window.__gcg.showView('home');});await settle(3);
 const d6=new Date();d6.setDate(d6.getDate()+6);const DATE=d6.toISOString().slice(0,10);
 const HEAD=(S,h,s,chip,pp)=>{S.head=h;S.sub=s;S.chip=chip||'PROJECT LEAD';S.chipP=pp?1:0;};
 const clickBtn=(w,css,re,exact)=>()=>F[w].evaluate(([css,re,exact])=>{var e=window.__q(css,re,exact);if(e)e.click();else console.log('missing '+css+' '+re);},[css,re,exact||false]);
 const MISSING=[];

 // ===== opening card =====
 await run('c0',S=>{S.cardFadeOut=0.3;S.head='Add the project or event.';S.sub='A project lead adds it from a template.';S.htShift=-(LEN.c0-0.3);S.card={id:'c0',h:'Who should do this job?',s:'Game Plan helps teams decide with more than a hunch.',k:'GOLD COAST GAMES  ·  GAME PLAN',big:true};S.sfx(0,'whoosh');});

 // ===== n1 add the project or event =====
 await run('n1',S=>{HEAD(S,'Add the project or event.','A project lead adds it from a template.');S.htShift=0.3;
   S.moveTo(0.3,0.9,()=>box('A','summary','Add an event or project'));
   S.click(0.95,'A',async()=>{await F.A.evaluate(()=>{var e=window.__q('summary','Add an event or project');if(e)e.click();var d=document.querySelector('details.addev');if(d)d.open=true;window.__gcg.S.panel.newev=true;});},false);
   S.moveTo(1.3,1.8,()=>box('A','input[placeholder="Event name"]'));
   S.click(1.85,'A',clickBtn('A','input[placeholder="Event name"]'));
   S.type(1.9,3.1,'A','input[placeholder="Event name"]','Bill-pay agent launch day');
   S.act(3.15,async()=>{await F.A.evaluate(DATE=>{var s=document.querySelectorAll('select');if(s[0]){s[0].selectedIndex=0;s[0].dispatchEvent(new Event('change',{bubbles:true}));}var d=document.querySelector('input[type=date]');if(d){d.value=DATE;d.dispatchEvent(new Event('input',{bubbles:true}));d.dispatchEvent(new Event('change',{bubbles:true}));}if(s[1]){s[1].selectedIndex=0;s[1].dispatchEvent(new Event('change',{bubbles:true}));}},DATE);await settle(2);});
   S.moveTo(3.3,3.95,()=>box('A','button','Create event'));
   S.click(4.05,'A',clickBtn('A','button','Create event'),true);
 });


 // ===== n2 shape the tasks =====
 const cvBtn=t=>F.A.evaluate(t=>{var r=[].slice.call(document.querySelectorAll('.cvrow')).filter(x=>x.innerText.indexOf(t)>=0)[0];var b=r&&[].slice.call(r.querySelectorAll('button')).filter(x=>x.innerText.trim()==='Not needed')[0];if(!b)return null;var q=b.getBoundingClientRect();return {x:q.x,y:q.y,w:q.width,h:q.height};},t).then(async r=>{if(!r)return null;const fr=await p.evaluate(()=>{var q=document.getElementById('fA').getBoundingClientRect();return {x:q.x,y:q.y,w:q.width};});const k=fr.w/390;return {x:fr.x+(r.x+Math.min(r.w/2,40))*k,y:fr.y+(r.y+r.h/2)*k};});
 const cvClick=t=>()=>F.A.evaluate(t=>{var r=[].slice.call(document.querySelectorAll('.cvrow')).filter(x=>x.innerText.indexOf(t)>=0)[0];var b=r&&[].slice.call(r.querySelectorAll('button')).filter(x=>x.innerText.trim()==='Not needed')[0];if(b)b.click();},t);
 await run('n2',S=>{HEAD(S,'Shape the tasks.','Remove what you do not need. Add what you do.');
   S.scrollTo(0.3,1.3,'A',()=>F.A.evaluate(()=>{var e=[].slice.call(document.querySelectorAll('summary')).filter(x=>/Go through the tasks/.test(x.innerText))[0];return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-140):0;}));
   S.moveTo(1.4,1.9,()=>box('A','summary','Go through the tasks'));
   S.click(2.0,'A',clickBtn('A','summary','Go through the tasks'));
   S.scrollTo(2.2,2.9,'A',()=>F.A.evaluate(()=>{var r=[].slice.call(document.querySelectorAll('.cvrow')).filter(x=>/Agreement signed/.test(x.innerText))[0];return r?Math.max(0,r.getBoundingClientRect().top+window.scrollY-240):0;}));
   S.moveTo(2.9,3.4,()=>cvBtn('Agreement signed'));
   S.click(3.5,'A',cvClick('Agreement signed'),true);
   S.moveTo(3.9,4.4,async()=>{await settle(1);return cvBtn('Deposit received');});
   S.click(4.5,'A',cvClick('Deposit received'),true);
   S.act(5.0,async()=>{await F.A.evaluate(()=>{var d=[].slice.call(document.querySelectorAll('details')).filter(x=>/Go through the tasks/.test(x.innerText))[0];if(d)d.open=false;});await settle(2);});
   S.scrollTo(5.05,5.7,'A',()=>F.A.evaluate(()=>{var e=document.getElementById('addTaskBox');return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-150):0;}));
   S.moveTo(5.1,5.75,async()=>{await settle(1);return box('A','#addTaskBox summary');});
   S.click(5.85,'A',()=>F.A.evaluate(()=>{var e=document.querySelector('#addTaskBox summary');if(e)e.click();}));
   S.moveTo(6.0,6.4,async()=>{await settle(1);return box('A','input[placeholder^="Type any task"]');});
   S.type(6.45,7.25,'A','input[placeholder^="Type any task"]','Rehearse the agent demo with the client');
   S.act(7.3,async()=>{await F.A.evaluate(()=>{var s=document.querySelector('#addTaskBox select');if(s){s.selectedIndex=Math.min(3,s.options.length-1);s.dispatchEvent(new Event('change',{bubbles:true}));}});await settle(2);});
   S.moveTo(7.3,7.7,()=>box('A','#addTaskBox button','Add this task'));
   S.click(7.8,'A',clickBtn('A','#addTaskBox button','Add this task'),true);
 });

 // ===== n3 the system suggests =====
 await run('n3',S=>{HEAD(S,'The system suggests.','Profiles and track record. Best fit per task, with the reason.');
   S.scrollTo(0.2,1.3,'A',()=>F.A.evaluate(()=>{var e=document.getElementById('crewReview');return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-10):0;}));
   S.point(2.8,'every pick comes with a reason','A',null,'Said yes|Has planned|Has done|Brings','#crewReview');
   S.scrollTo(4.6,5.9,'A',()=>F.A.evaluate(()=>{var e=document.getElementById('crewReview');return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY+260):0;}));
 });

 // ===== n4 the project lead has the final say =====
 await run('n4',S=>{HEAD(S,'The project lead has the final say.','Accept or change. The computer only helps.');
   S.scrollTo(0.1,0.9,'A',()=>F.A.evaluate(()=>{var e=document.getElementById('crewReview');return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-10):0;}));
   S.moveTo(1.0,1.7,()=>box('A','#crewReview button','Change',true));
   S.click(1.8,'A',clickBtn('A','#crewReview button','Change',true));
   S.scrollTo(2.1,3.0,'A',()=>F.A.evaluate(()=>{var e=document.querySelector('#crewReview select');return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-260):0;}));
   S.moveTo(4.0,4.7,async()=>{await settle(1);return box('A','#crewReview button','Close',true);});
   S.click(4.8,'A',clickBtn('A','#crewReview button','Close',true));
   S.scrollTo(5.0,5.7,'A',()=>F.A.evaluate(()=>{var e=document.getElementById('crewReview');return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-10):0;}));
   S.moveTo(5.2,6.2,async()=>{await settle(1);return box('A','#crewReview button','Accept all');});
   S.click(6.3,'A',clickBtn('A','#crewReview button','Accept all'),true);
 });

 // ===== n5 send =====
 await run('n5',S=>{HEAD(S,'Send.','The whole team is told at once.');
   S.scrollTo(0.0,0.5,'A',()=>yFor('A','button','ublish',200));
   S.moveTo(0.55,1.0,()=>box('A','button','ublish'));
   S.click(1.05,'A',clickBtn('A','button','ublish'),true);
   S.moveTo(1.15,1.5,async()=>{await settle(1);return box('A','button','Tap again to publish');});
   S.click(1.6,'A',clickBtn('A','button','Tap again to publish'),true);
   S.scrollTo(1.75,2.1,'A',()=>yFor('A','button','Send offers for now',300));
   S.moveTo(2.15,2.65,async()=>{await settle(2);return box('A','button','Send offers for now');});
   S.click(2.75,'A',clickBtn('A','button','Send offers for now'),true);
 });

 // ===== n6 the team receives it =====
 await run('n6',S=>{S.phone='B';HEAD(S,'The team receives it.','Their own task, and why it fits.','TEAM MEMBER · EFUA',true);
   S.banner(0.9,3.4,'Efua, you have a new task: Confirm venue access');S.sfx(1.0,'chime');
   S.scrollTo(3.4,4.3,'B',()=>F.B.evaluate(()=>{var e=window.__leaf(document.body,'SUGGESTED FIRST');return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-90):0;}));
   S.moveTo(4.4,5.2,()=>box('B','button',"I'll take it"));
   S.click(5.4,'B',clickBtn('B','button',"I.ll take it"),true);
 },async()=>{await sync('A','B');await F.B.evaluate(()=>{const G=window.__gcg;G.S.extraMode=false;G.S.screen='profile';G.showView('home');window.scrollTo(0,0);});await settle(3);});

 // ===== n7 this one is full =====
 await run('n7',S=>{S.phone='B';HEAD(S,'This one is full.','One tap says so, with the reason.','TEAM MEMBER · YAW',true);
   S.banner(0.5,2.4,'Yaw, you have a new task: Deposit received');S.sfx(0.6,'chime');
   S.scrollTo(2.2,2.9,'B',()=>F.B.evaluate(()=>{var e=window.__leaf(document.body,'SUGGESTED FIRST');return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-90):0;}));
   S.moveTo(2.4,3.1,()=>box('B','button',"Can.t do it"));
   S.click(3.2,'B',clickBtn('B','button',"Can.t do it"));
   S.point(3.8,'one tap says why','B','button.addchip','At my limit');
   S.moveTo(4.1,4.7,async()=>{await settle(1);return box('B','button.addchip','At my limit',true);});
   S.click(4.8,'B',async()=>{await F.B.evaluate(()=>{var e=window.__q('button.addchip','At my limit',true);if(e)e.click();});S.note=null;},true);
 },async()=>{await F.B.evaluate(()=>{window.__as('u3',false,'Yaw');const G=window.__gcg;G.S.extraMode=false;G.S.screen='profile';G.showView('home');window.scrollTo(0,0);});await settle(3);});

 // ===== n8 the project lead sees why =====
 await run('n8',S=>{S.phone='A';HEAD(S,'The project lead sees why.','Offered to the next best person.');
   S.point(1.4,'the reason arrives with it','A',null,'AT MY LIMIT','body');
   S.moveTo(2.4,3.3,()=>box('A','button','Offer to next best'));
   S.click(3.4,'A',async()=>{await F.A.evaluate(()=>{var e=window.__q('button','Offer to next best');if(e)e.click();});S.note=null;},true);
 },async()=>{await sync('B','A');await F.A.evaluate(()=>{window.__gcg.showView('today');window.scrollTo(0,0);});await settle(3);});

 // ===== nu nothing gets lost =====
 await run('nu',S=>{S.phone='A';HEAD(S,'Nothing gets lost.','Share it out, or hire for it.');
   S.moveTo(0.3,0.9,()=>box('A','summary','^More$'));
   S.click(1.0,'A',clickBtn('A','summary','^More$'));
   S.moveTo(1.3,1.9,async()=>{await settle(1);return box('A','summary','Up for grabs');});
   S.click(2.0,'A',clickBtn('A','summary','Up for grabs'));
   S.scrollTo(2.3,3.2,'A',()=>F.A.evaluate(()=>{var e=document.querySelector('.gapbox');return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-150):0;}));
   S.point(3.5,'no one fits? think about a hire','A',null,'No one fits','.gapbox');
 },async()=>{await F.A.evaluate(()=>{const e=Object.values(window.__store).filter(v=>v&&v.name==='Bill-pay agent launch day')[0];if(e){e.tasks.forEach(t=>{if(['C8','F2','D7','G1','C10'].indexOf(t.job)>=0){t.owner='';t.offered=false;t.manual='';t.ok=false;t.passed=[];}});}window.__notify();window.__gcg.S.panel.todayMore=false;window.__gcg.S.panel.adminGrabs=false;window.__gcg.showView('today');window.scrollTo(0,0);});await settle(3);});

 // ===== n10 done, with proof =====
 await run('n10',S=>{S.phone='B';HEAD(S,'Done, with proof.','A link or file, saved with the task.','TEAM MEMBER · EFUA',true);
   S.moveTo(0.3,0.9,async()=>{const r=await F.B.evaluate(()=>{var bs=[].slice.call(document.querySelectorAll('button')).filter(b=>b.innerText.trim()==='Open');for(var i=0;i<bs.length;i++){var e=bs[i].parentElement;for(var k=0;k<5&&e;k++){if((e.innerText||'').indexOf('Write the client onboarding guide')>=0){var q=bs[i].getBoundingClientRect();return {x:q.x,y:q.y,w:q.width,h:q.height};}e=e.parentElement;}}return null;});if(!r)return null;const fr=await p.evaluate(()=>{var q=document.getElementById('fB').getBoundingClientRect();return {x:q.x,y:q.y,w:q.width};});const k=fr.w/390;return {x:fr.x+(r.x+r.w/2)*k,y:fr.y+(r.y+r.h/2)*k};});
   S.click(1.0,'B',()=>F.B.evaluate(()=>{var bs=[].slice.call(document.querySelectorAll('button')).filter(b=>b.innerText.trim()==='Open');for(var i=0;i<bs.length;i++){var e=bs[i].parentElement;for(var k=0;k<5&&e;k++){if((e.innerText||'').indexOf('Write the client onboarding guide')>=0){bs[i].click();return;}e=e.parentElement;}}}));
   S.scrollTo(1.2,1.8,'B',()=>F.B.evaluate(()=>{var e=[].slice.call(document.querySelectorAll('h3')).filter(x=>/Proof and documents/.test(x.innerText))[0];return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-200):0;}));
   S.moveTo(1.9,2.3,async()=>{await settle(1);return box('B','input[placeholder^="Name, e.g."]');});
   S.click(2.35,'B',clickBtn('B','input[placeholder^="Name, e.g."]'));
   S.type(2.4,3.0,'B','input[placeholder^="Name, e.g."]','Onboarding guide (Drive)');
   S.moveTo(3.05,3.4,()=>box('B','input[placeholder^="Link (optional)"]'));
   S.click(3.45,'B',clickBtn('B','input[placeholder^="Link (optional)"]'));
   S.type(3.5,4.1,'B','input[placeholder^="Link (optional)"]','drive.google.com/onboarding-guide');
   S.moveTo(4.15,4.5,()=>box('B','button','Add link',true));
   S.click(4.55,'B',clickBtn('B','button','Add link',true),true);
   S.point(4.8,'saved with the task','B',null,'Onboarding guide \\(Drive\\)','body');
   S.scrollTo(4.9,5.3,'B',()=>F.B.evaluate(()=>{var e=[].slice.call(document.querySelectorAll('button')).filter(b=>b.innerText.trim()==='Mark finished')[0];return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-300):null;}));
   S.moveTo(5.3,5.65,async()=>{await settle(1);return box('B','button','Mark finished',true);});
   S.click(5.7,'B',async()=>{await F.B.evaluate(()=>{var e=window.__q('button','Mark finished',true);if(e)e.click();});S.note=null;},true);
 },async()=>{
   await fA.evaluate(()=>{const d=new Date();const iso=n=>{const x=new Date(d);x.setDate(x.getDate()+n);return x.toISOString().slice(0,10);};
     const st=(id,title,owner,due,sec)=>({addedAt:'',addedBy:'',brief:null,claimedAt:'',claimedBy:'',days:0,done:null,doneAt:'',due:iso(due),grab:false,hours:2,how:'Write down the steps and who owns each.',id:id,note:'',offDay:false,owner:owner,par:false,parent:'',review:null,section:sec,spent:0,startOn:iso(due-1),status:'',statusAt:'',title:title});
     window.__store['projects/pfake1']={about:'Roll the bill-pay agent out to the first three clients.',created:new Date().toISOString(),files:[],flyer:'',items:{},name:'Agent pilot rollout',noWeekends:false,packed:'',secGoals:{},start:iso(-2),steps:[st('s1','Write the client onboarding guide','u4',0,'Onboarding'),st('s2','Set up the pilot dashboard','u3',2,'Onboarding'),st('s3','Collect first feedback','u4',4,'Feedback')],target:iso(20),thumb:'',updated:new Date().toISOString()};window.__notify();});
   await settle(8);await sync('A','B');
   await fB.evaluate(()=>{window.__as('u4',false,'Efua');const G=window.__gcg;G.S.extraMode=false;G.S.screen='profile';window.__notify();G.showView('home');window.scrollTo(0,0);});await settle(4);});

 // ===== n11 her work is on record =====
 await run('n11',S=>{S.phone='B';HEAD(S,'Her work is on record.','Progress, title and trail. Less time, less error.','TEAM MEMBER · EFUA',true);
   S.act(0.1,async()=>{await F.B.evaluate(()=>{var b=window.__q('button','Mark finished',true);});});
   S.moveTo(0.2,0.8,()=>box('B','button','Back to Home'));
   S.click(0.9,'B',clickBtn('B','button','Back to Home'));
   S.scrollTo(1.1,1.8,'B',()=>F.B.evaluate(()=>{var e=window.__leaf(document.body,'^Your progress$');return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-90):0;}));
   S.moveTo(2.0,2.6,()=>box('B','.bottomnav .navb:nth-child(5)'));
   S.click(2.7,'B',()=>F.B.evaluate(()=>{var e=document.querySelector('.bottomnav .navb:nth-child(5)');if(e)e.click();}));
   S.scrollTo(3.0,3.8,'B',()=>F.B.evaluate(()=>{var e=[].slice.call(document.querySelectorAll('h3')).filter(x=>/My title/.test(x.innerText))[0];return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-80):0;}));
   S.scrollTo(4.0,4.9,'B',()=>F.B.evaluate(()=>{var e=[].slice.call(document.querySelectorAll('h3')).filter(x=>/Your GCG trail/.test(x.innerText))[0];return e?Math.max(0,e.getBoundingClientRect().top+window.scrollY-80):0;}));
 },async()=>{await settle(2);});

 // ===== closing card =====
 await run('c12',S=>{S.cardFadeIn=0.35;S.card={id:'c12',h:'The right person, for the right task.',s:'Gold Coast Games · The Human Layer',k:'',big:false};S.sfx(0,'whoosh');});

 ff.stdin.end();await new Promise(r=>ff.on('close',r));
 fs.writeFileSync('det_timeline.json',JSON.stringify({FS,LEN,sfx,total:filmT,frames:frameNo}));
 console.log('frames',frameNo,'film',filmT.toFixed(2),'errors',errs.slice(0,5));
 await b.close();
})();

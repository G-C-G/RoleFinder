const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
let base=fs.readFileSync('t2.js','utf8').match(/const mock=`([\s\S]*?)`;/)[1];
const seed=require('./seed_fake.js');
const NARR={};JSON.parse(fs.readFileSync('narr/script.json','utf8')).forEach(s=>NARR[s.id]=s);
const OUT=process.argv[2]||'one_video';const SHOTS=!!process.env.SHOTS;
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1920,height:1080},recordVideo:process.env.NOVID?undefined:{dir:OUT,size:{width:1920,height:1080}}});
 const T0=Date.now();const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(base);await p.addInitScript(seed);
 await p.goto('file:///home/user/RoleFinder/demo/one_phone.html');await sleep(1800);
 const fA=await (await p.$('#fA')).contentFrame(),fB=await (await p.$('#fB')).contentFrame();
 await fA.waitForFunction(()=>window.__gcg&&window.__seedFake);await fB.waitForFunction(()=>window.__gcg&&window.__seedFake);
 const F={A:fA,B:fB},offs={};
 const shot=async n=>{if(SHOTS){await sleep(300);await p.screenshot({path:'real_shots/o_'+n+'.png'});}};
 async function sync(from,to){const d=await F[from].evaluate(()=>JSON.stringify(window.__store));await F[to].evaluate(d=>{const s=window.__store;Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,JSON.parse(d));window.__notify();},d);await sleep(400);}
 async function tapQ(w,sel,after){const loc=F[w].locator(sel).first();await loc.scrollIntoViewIfNeeded();await sleep(50);const bx=await loc.boundingBox();
   await p.evaluate(([x,y])=>window.cur(x,y),[bx.x+Math.min(bx.width/2,50),bx.y+bx.height/2]);await sleep(360);await p.evaluate(()=>window.ripple());await sleep(80);await loc.click();await sleep(after==null?450:after);}
 async function tapV(w,sel,after,ver){await tapQ(w,sel,150);const loc=F[w].locator(sel).first();
   for(let k=0;k<3;k++){await sleep(220);const ok=await F[w].evaluate(ver).catch(()=>false);if(ok)break;try{await loc.evaluate(e=>e.click());}catch(e){break;}}
   await sleep(after==null?300:after);}
 async function smooth(w,sel,off){await F[w].locator(sel).first().evaluate((e,o)=>{window.scrollTo({top:e.getBoundingClientRect().top+window.scrollY-(o==null?70:o),behavior:'smooth'});},off);}
 async function beat(o,id,fn){offs[id]=Date.now()-T0;await p.evaluate(o=>window.beat(o),o);await Promise.all([fn(),sleep(NARR[id].dur*1000+900)]);}

 await fA.evaluate(()=>{window.__seedFake();window.__as('admin1',true,'Nana');['u1','u2','u3','u4','u5'].forEach((u,i)=>{window.__store['crew/'+u]={name:['Ama','Kofi','Yaw','Efua','Selorm'][i],updated:'2026-04-21T10:00:00Z'};});window.__notify();window.__gcg.showView('events');});
 await sync('A','B');
 await fB.evaluate(()=>{window.__as('u4',false,'Efua');window.__gcg.showView('home');});await sleep(900);

 await beat({group:'h',head:'Who should do this job?',sub:'The system suggests. You decide.',idx:-1,label:''},'n0',async()=>{await shot('0');});

 await beat({group:'h',head:'Add the job.',sub:'A project or an event. The template fills in every task.',idx:0,label:'ADD'},'n1',async()=>{
   await tapQ('A','text=+ Add an event or project',400);
   for(let k=0;k<3;k++){const open=await F.A.evaluate(()=>{window.__gcg.S.panel.newev=true;const d=document.querySelector('details.addev');if(d&&!d.open){d.open=true;}return d&&d.open;});if(open)break;await sleep(300);}
   await sleep(500);await shot('1a');
   await tapQ('A','input[placeholder="Event name"]',100);await F.A.locator('input[placeholder="Event name"]').pressSequentially('Bill-pay agent launch day',{delay:26});
   const sel=await fA.$$('select');await sel[0].selectOption({index:0});const d=new Date();d.setDate(d.getDate()+6);await fA.fill('input[type=date]',d.toISOString().slice(0,10));await sel[1].selectOption({index:0});await sleep(250);
   await tapQ('A','button:has-text("Create event")',300);const got=await F.A.waitForSelector('#crewReview',{timeout:1500}).catch(()=>null);if(!got){await F.A.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Create event/.test(x.innerText));if(b)b.click();});}
   await F.A.waitForSelector('#crewReview',{timeout:8000});await sleep(500);await shot('1');});

 await beat({group:'h',head:'The system suggests.',sub:'The best person for each task, with the reason.',idx:1,label:'SUGGEST'},'n2',async()=>{
   await F.A.evaluate(()=>document.getElementById('crewReview').scrollIntoView({block:'start'}));await sleep(1500);await shot('2');
   for(const o of [420,840]){await F.A.evaluate(o=>{const e=document.getElementById('crewReview');window.scrollTo({top:e.getBoundingClientRect().top+window.scrollY+o,behavior:'smooth'});},o);await sleep(2300);}});

 await beat({group:'h',head:'HR decides.',sub:'Accept, or change. One tap.',idx:2,label:'DECIDE'},'n3',async()=>{
   await F.A.evaluate(()=>document.getElementById('crewReview').scrollIntoView({block:'start'}));await sleep(250);
   await tapV('A','#crewReview button:text-is("Change")',300,()=>!!document.querySelector('#crewReview select'));await smooth('A','#crewReview select',260);await sleep(1300);await shot('3');
   await tapV('A','#crewReview button:text-is("Close")',150,()=>!document.querySelector('#crewReview select'));
   await tapV('A','#crewReview button:has-text("Accept all")',300,()=>![...document.querySelectorAll('#crewReview button')].some(b=>/Accept all/.test(b.innerText)));});

 await beat({group:'h',head:'Send.',sub:'Everyone is notified at once.',idx:3,label:'SEND'},'n4',async()=>{
   await F.A.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));await sleep(450);
   const pubSel='button:has-text("ublish")';await tapV('A',pubSel,150,()=>[...document.querySelectorAll('button')].some(b=>/Tap again to publish/.test(b.innerText)));await tapV('A','button:has-text("Tap again to publish")',500,()=>!/Tap again to publish|Publish to the team/.test(document.body.innerText)&&[...document.querySelectorAll('button')].some(b=>/Send offers for now/.test(b.innerText)));
   await F.A.evaluate(()=>window.scrollTo({top:0}));await tapV('A','button:has-text("Send offers for now")',500,()=>![...document.querySelectorAll('button')].some(b=>/Send offers for now/.test(b.innerText)));await shot('4');});

 await sync('A','B');
 await F.B.evaluate(()=>{const G=window.__gcg;G.S.extraMode=false;G.S.screen='profile';G.showView('home');});await sleep(500);
 await p.evaluate(()=>{window.show('B');window.buzz('pfB');});
 await beat({group:'p',head:'One clear thing to do.',sub:'Why it fits her. One tap to take it.',idx:4,label:'OFFER'},'n5',async()=>{
   await sleep(700);{const has=await F.B.locator('text=SUGGESTED FIRST').count();if(!has){console.log('B TEXT:',(await F.B.evaluate(()=>document.body.innerText.replace(/\n+/g,' | ').slice(0,500))));console.log('STORE u4:',await F.B.evaluate(()=>{const e=Object.entries(window.__store).filter(([k,v])=>k.startsWith('events/')&&v.name==='Bill-pay agent launch day')[0];if(!e)return 'no event';return JSON.stringify(e[1].tasks.filter(t=>t.owner==='u4').map(t=>[t.title,t.offered,t.ok,t.d]))+' published:'+e[1].published;}));await shot('5x');}}
   await smooth('B','text=SUGGESTED FIRST',90);await sleep(1900);await shot('5');
   await tapV('B','button:text-is("I\'ll take it")',700,()=>![...document.querySelectorAll('button')].some(b=>/^I.ll take it$/.test(b.innerText.trim())&&b.offsetParent));});

 await beat({group:'p',head:'Her work is on record.',sub:'Progress, title and trail. Where she stands.',idx:5,label:'RECORD'},'n6',async()=>{
   await F.B.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));await sleep(700);
   await smooth('B','text=Your progress',90);await sleep(2200);await shot('6');
   await tapV('B','.bottomnav .navb:nth-child(5)',1500,()=>/PLAYER CARD/i.test(document.body.innerText));await shot('7');
   await smooth('B','h3:has-text("My title")',80);await sleep(1900);});

 await beat({group:'p',head:'The right person for the right task.',sub:'With a reason you can check.',idx:6,label:'RESULT'},'n7',async()=>{
   await smooth('B','h3:has-text("Your GCG trail")',80);await sleep(1500);await shot('8');});
 await sleep(1200);
 fs.writeFileSync('narr/offsets.json',JSON.stringify(offs));
 console.log('offsets',JSON.stringify(offs),'errors',errs);
 await ctx.close();await b.close();
})();

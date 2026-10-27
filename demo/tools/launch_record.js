const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
let base=fs.readFileSync('t2.js','utf8').match(/const mock=`([\s\S]*?)`;/)[1];
const seed=require('./seed_fake.js');
const NARR={};JSON.parse(fs.readFileSync('nl/script.json','utf8')).forEach(s=>NARR[s.id]=s);
const OUT=process.argv[2]||'launch_video';const SHOTS=!!process.env.SHOTS;const STOP=process.env.STOP||'';
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1920,height:1080},recordVideo:process.env.NOVID?undefined:{dir:OUT,size:{width:1920,height:1080}}});
 const T0=Date.now();const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(base);await p.addInitScript(seed);
 await p.goto('file:///home/user/RoleFinder/demo/launch_frame.html');await sleep(1800);
 const fA=await (await p.$('#fA')).contentFrame(),fB=await (await p.$('#fB')).contentFrame();
 await fA.waitForFunction(()=>window.__gcg&&window.__seedFake);await fB.waitForFunction(()=>window.__gcg&&window.__seedFake);
 const F={A:fA,B:fB},offs={},sfx=[];
 const log=(k)=>sfx.push([Date.now()-T0,k]);
 const shot=async n=>{if(SHOTS){await sleep(300);await p.screenshot({path:'real_shots/l_'+n+'.png'});}};
 async function sync(from,to){const d=await F[from].evaluate(()=>JSON.stringify(window.__store));await F[to].evaluate(d=>{const s=window.__store;Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,JSON.parse(d));window.__notify();},d);await sleep(400);}
 async function tapQ(w,sel,after){const loc=F[w].locator(sel).first();await loc.scrollIntoViewIfNeeded();await sleep(50);const bx=await loc.boundingBox();
   await p.evaluate(([x,y])=>window.cur(x,y),[bx.x+Math.min(bx.width/2,50),bx.y+bx.height/2]);await sleep(380);await p.evaluate(()=>window.ripple());log('tap');await sleep(80);await loc.click();await sleep(after==null?450:after);}
 async function tapV(w,sel,after,ver){await tapQ(w,sel,150);const loc=F[w].locator(sel).first();
   for(let k=0;k<3;k++){await sleep(220);const ok=await F[w].evaluate(ver).catch(()=>false);if(ok)break;try{await loc.evaluate(e=>e.click());}catch(e){break;}}
   await sleep(after==null?300:after);}
 async function smooth(w,sel,off){await F[w].locator(sel).first().evaluate((e,o)=>{window.scrollTo({top:e.getBoundingClientRect().top+window.scrollY-(o==null?70:o),behavior:'smooth'});},off);}
 const H=(o,id,fn)=>beat(o,id,fn);
 async function beat(o,id,fn){offs[id]=Date.now()-T0;await p.evaluate(o=>window.beat(o),o);await Promise.all([fn(),sleep(NARR[id].dur*1000+900)]);}
 async function card(id,h,s,k){offs[id]=Date.now()-T0;await p.evaluate(a=>window.cardOn(a[0],a[1],a[2]),[h,s,k]);log('whoosh');await sleep(NARR[id].dur*1000+900);}
 const done=()=>STOP&&false;
 async function notify(txt){log('chime');await p.evaluate(t=>window.banner(t),txt);await sleep(2600);await p.evaluate(()=>window.banner(''));}

 // ---- set up the fake company (off screen) ----
 await fA.evaluate(()=>{window.__seedFake();window.__as('admin1',true,'Nana');['u1','u2','u3','u4','u5'].forEach((u,i)=>{window.__store['crew/'+u]={name:['Ama','Kofi','Yaw','Efua','Selorm'][i],updated:'2026-04-21T10:00:00Z'};});window.__notify();window.__gcg.showView('events');});
 await sync('A','B');
 await fB.evaluate(()=>{window.__as('u4',false,'Efua');window.__gcg.showView('home');});await sleep(600);

 await card('c0','Who should do this job?','','THE HUMAN LAYER');
 await p.evaluate(()=>window.cardOn(''));await sleep(500);

 await beat({group:'h',head:'Add the job.',sub:'The template fills in every task.',idx:0,label:'ADD',name:'HR'},'n1',async()=>{
   await tapQ('A','text=+ Add an event or project',400);
   for(let k=0;k<3;k++){const open=await F.A.evaluate(()=>{window.__gcg.S.panel.newev=true;const d=document.querySelector('details.addev');if(d&&!d.open){d.open=true;}return d&&d.open;});if(open)break;await sleep(300);}
   await sleep(500);
   await tapQ('A','input[placeholder="Event name"]',100);await F.A.locator('input[placeholder="Event name"]').pressSequentially('Bill-pay agent launch day',{delay:26});
   const sel=await fA.$$('select');await sel[0].selectOption({index:0});const d=new Date();d.setDate(d.getDate()+6);await fA.fill('input[type=date]',d.toISOString().slice(0,10));await sel[1].selectOption({index:0});await sleep(250);
   await tapQ('A','button:has-text("Create event")',300);const got=await F.A.waitForSelector('#crewReview',{timeout:1500}).catch(()=>null);if(!got){await F.A.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Create event/.test(x.innerText));if(b)b.click();});}
   await F.A.waitForSelector('#crewReview',{timeout:8000});await sleep(400);await shot('1');});

 await beat({group:'h',head:'Trim it. Add to it.',sub:'Not needed disappears. Extra tasks join the list.',idx:1,label:'SHAPE',name:'HR'},'n2',async()=>{
   await F.A.evaluate(()=>{const e=[...document.querySelectorAll('summary')].find(x=>/Go through the tasks/.test(x.innerText));if(e)e.scrollIntoView({block:'start'});});await sleep(500);
   await tapV('A','summary:has-text("Go through the tasks")',300,()=>{const d=[...document.querySelectorAll('details')].find(x=>/Go through the tasks/.test(x.innerText));return d&&d.open;});
   for(const title of ['Ask the client for a testimonial','Agreement signed']){
     const idx=await F.A.evaluate(t=>{const bs=[...document.querySelectorAll('button')].filter(b=>b.innerText.trim()==='Not needed');for(let i=0;i<bs.length;i++){let e=bs[i].parentElement;for(let k=0;k<6&&e;k++){const n=[...e.querySelectorAll('button')].filter(b=>b.innerText.trim()==='Not needed').length;if(n===1&&e.innerText.indexOf(t)>=0)return i;if(n>1)break;e=e.parentElement;}}return -1;},title);
     if(idx>=0){const loc=F.A.locator('button:text-is("Not needed")').nth(idx);await loc.scrollIntoViewIfNeeded();await sleep(350);await shot('2a');
       const bx=await loc.boundingBox();await p.evaluate(([x,y])=>window.cur(x,y),[bx.x+30,bx.y+bx.height/2]);await sleep(380);await p.evaluate(()=>window.ripple());log('tap');const hd=()=>F.A.evaluate(()=>[...document.querySelectorAll('summary')].find(x=>/Go through the tasks/.test(x.innerText)).innerText);const h0=await hd();await loc.click();await sleep(600);if(await hd()===h0){await loc.evaluate(e=>e.click());await sleep(500);}await sleep(500);console.log('after tap',title,idx,await F.A.evaluate(()=>[...document.querySelectorAll('summary')].find(x=>/Go through the tasks/.test(x.innerText)).innerText));}
     else console.log('no Not needed for',title);}
   await shot('2b');
   await F.A.evaluate(()=>{const d=[...document.querySelectorAll('details')].find(x=>/Go through the tasks/.test(x.innerText));if(d)d.open=false;});await sleep(300);
   await tapV('A','#addTaskBox summary',300,()=>document.querySelector('#addTaskBox').open);
   await F.A.locator('#addTaskBox').scrollIntoViewIfNeeded();await sleep(300);
   await tapQ('A','input[placeholder^="Type any task"]',100);await F.A.locator('input[placeholder^="Type any task"]').pressSequentially('Rehearse the agent demo with the client',{delay:24});
   await F.A.evaluate(()=>{const s=document.querySelector('#addTaskBox select');if(s){s.selectedIndex=Math.min(3,s.options.length-1);s.dispatchEvent(new Event('change',{bubbles:true}));}});
   await shot('2c');
   await tapQ('A','#addTaskBox button:has-text("Add this task")',500);await shot('2d');});

 await beat({group:'h',head:'The system suggests.',sub:'The best person for each task, with the reason.',idx:2,label:'SUGGEST',name:'HR'},'n3',async()=>{
   await F.A.evaluate(()=>document.getElementById('crewReview').scrollIntoView({block:'start'}));await sleep(1300);await shot('3');
   for(const o of [420,840]){await F.A.evaluate(o=>{const e=document.getElementById('crewReview');window.scrollTo({top:e.getBoundingClientRect().top+window.scrollY+o,behavior:'smooth'});},o);await sleep(1300);}});

 await beat({group:'h',head:'You decide.',sub:'Accept, or change. One tap.',idx:3,label:'DECIDE',name:'HR'},'n4',async()=>{
   await F.A.evaluate(()=>document.getElementById('crewReview').scrollIntoView({block:'start'}));await sleep(250);
   await tapV('A','#crewReview button:text-is("Change")',300,()=>!!document.querySelector('#crewReview select'));await smooth('A','#crewReview select',260);await sleep(1000);
   await tapV('A','#crewReview button:text-is("Close")',150,()=>!document.querySelector('#crewReview select'));
   await tapV('A','#crewReview button:has-text("Accept all")',300,()=>![...document.querySelectorAll('#crewReview button')].some(b=>/Accept all/.test(b.innerText)));});

 await beat({group:'h',head:'Send.',sub:'Everyone is told at once.',idx:4,label:'SEND',name:'HR'},'n5',async()=>{
   await F.A.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));await sleep(450);
   const pubSel='button:has-text("ublish")';await tapV('A',pubSel,150,()=>[...document.querySelectorAll('button')].some(b=>/Tap again to publish/.test(b.innerText)));await tapV('A','button:has-text("Tap again to publish")',500,()=>!/Tap again to publish|Publish to the team/.test(document.body.innerText)&&[...document.querySelectorAll('button')].some(b=>/Send offers for now/.test(b.innerText)));
   await F.A.evaluate(()=>window.scrollTo({top:0}));await tapV('A','button:has-text("Send offers for now")',500,()=>![...document.querySelectorAll('button')].some(b=>/Send offers for now/.test(b.innerText)));await shot('5');});
 if(STOP==='n5'){await ctx.close();await b.close();console.log('errs',errs);return;}

 await sync('A','B');
 await F.B.evaluate(()=>{const G=window.__gcg;G.S.extraMode=false;G.S.screen='profile';G.showView('home');});await sleep(400);
 await p.evaluate(()=>window.show('B'));
 await beat({group:'p',head:'One clear thing.',sub:'Why it fits her. One tap to take it.',idx:5,label:'OFFER',name:'EFUA'},'n6',async()=>{
   await notify('Efua, you have a new task: Confirm venue access');
   await smooth('B','text=SUGGESTED FIRST',90);await sleep(1400);await shot('6');
   await tapV('B','button:text-is("I\'ll take it")',700,()=>![...document.querySelectorAll('button')].some(b=>/^I.ll take it$/.test(b.innerText.trim())&&b.offsetParent));await shot('6b');});

 // Yaw is already carrying a lot
 await fB.evaluate(()=>{window.__as('u3',false,'Yaw');const G=window.__gcg;G.S.extraMode=false;G.S.screen='profile';G.showView('home');});await sleep(600);
 await beat({group:'p',head:'Full already?',sub:'He says so. One tap.',idx:6,label:'LIMIT',name:'YAW'},'n7',async()=>{
   await notify('Yaw, you have a new task: Deposit received');
   await smooth('B','text=SUGGESTED FIRST',90);await sleep(1100);await shot('7a');
   await tapV('B','button:has-text("Can\'t do it")',500,()=>!!document.querySelector('.addchip'));await sleep(500);await shot('7b');
   await tapV('B','button.addchip:text-is("At my limit")',900,()=>!document.querySelector('.addchip'));await shot('7c');});

 await sync('B','A');
 await p.evaluate(()=>window.show('A'));await fA.evaluate(()=>{window.__gcg.showView('today');});await sleep(500);
 await beat({group:'h',head:'HR sees why.',sub:'And offers it to the next best person.',idx:7,label:'REASSIGN',name:'HR'},'n8',async()=>{
   await shot('8a');
   await smooth('A','button:has-text("Offer to next best")',200);await sleep(1300);await shot('8b');
   await tapV('A','button:has-text("Offer to next best")',900,()=>![...document.querySelectorAll('button')].some(b=>/Offer to next best/.test(b.innerText)));await shot('8c');});

 await sync('A','B');
 await fB.evaluate(()=>{window.__as('u4',false,'Efua');const G=window.__gcg;G.S.extraMode=false;G.S.screen='profile';G.showView('home');});await sleep(500);
 await p.evaluate(()=>window.show('B'));
 if(process.env.EXPLORE){await sleep(1500);await shot('x9');console.log('BTN',await F.B.evaluate(()=>[...document.querySelectorAll('button,summary')].filter(e=>e.offsetParent).map(e=>e.innerText.trim().slice(0,40)).join(' | ')));await ctx.close();await b.close();return;}
 await beat({group:'p',head:'Stuck?',sub:'Ask a colleague for a hand.',idx:8,label:'HELP',name:'EFUA'},'n9',async()=>{
   await smooth('B','.hero-move',90);await sleep(500);await shot('9a');
   await tapV('B','.hero-move button:text-is("Open")',700,()=>/I need help/.test(document.body.innerText));await smooth('B','button:has-text("I need help")',300);await sleep(400);
   await tapV('B','button:has-text("I need help")',400,()=>!!document.querySelector('select[data-k^="helpto"]'));await shot('9b');
   await F.B.evaluate(()=>{const s=document.querySelector('select[data-k^="helpto"]');const o=[...s.options].find(x=>/Kofi/.test(x.text));if(o){s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));}});await sleep(500);
   await tapQ('B','input[placeholder^="What do you need help with"]',100);await F.B.locator('input[placeholder^="What do you need help with"]').pressSequentially('Client wants the AV plan by noon',{delay:26});await shot('9c');
   await tapQ('B','button:has-text("Send help request")',700);await shot('9d');});

 if(process.env.EXPLORE2){console.log('BTN',await F.B.evaluate(()=>[...document.querySelectorAll('button,summary')].filter(e=>e.offsetParent).map(e=>e.innerText.trim().slice(0,30)+'@'+Math.round(e.getBoundingClientRect().top)).join(' | ')));console.log(await F.B.evaluate(()=>scrollY));await ctx.close();await b.close();return;}
 await beat({group:'p',head:'Done, with proof.',sub:'A note, how it went. It stays on record.',idx:9,label:'PROOF',name:'EFUA'},'n10',async()=>{
   await smooth('B','button:text-is("Done")',380);await sleep(700);await tapV('B','button:text-is("Done")',500,()=>/When did you finish/.test(document.body.innerText));await shot('10a');await smooth('B','text=When did you finish',200);await sleep(600);
   await tapQ('B','.seg3 .sb[data-c="yes"]:has-text("Today")',200);
   await tapQ('B','input[placeholder^="Anything worth knowing"]',100);await F.B.locator('input[placeholder^="Anything worth knowing"]').pressSequentially('Venue confirmed. AV plan signed off by the client.',{delay:24});await shot('10b');
   await tapQ('B','button:has-text("Save as done")',900);await sleep(500);await smooth('B','text=Confirm venue access',140);await sleep(1200);await shot('10c');});

 await beat({group:'p',head:'Her work is on record.',sub:'Progress, title and trail.',idx:10,label:'RECORD',name:'EFUA'},'n11',async()=>{
   await F.B.evaluate(()=>{window.__gcg.showView('home');});await sleep(600);
   await F.B.evaluate(()=>window.scrollTo({top:0}));await smooth('B','text=Your progress',90);await sleep(1300);await shot('11a');
   await tapV('B','.bottomnav .navb:nth-child(5)',1200,()=>/PLAYER CARD/i.test(document.body.innerText));
   await smooth('B','h3:has-text("My title")',80);await sleep(1400);await shot('11b');
   await smooth('B','h3:has-text("Your GCG trail")',80);await sleep(1300);await shot('11c');});

 await card('c12','The right person, for the right task.','Gold Coast Games · The Human Layer','');
 await sleep(800);
 fs.writeFileSync('nl/offsets.json',JSON.stringify(offs));fs.writeFileSync('nl/sfx.json',JSON.stringify(sfx));
 console.log('offsets',JSON.stringify(offs),'errors',errs);
 await ctx.close();await b.close();
})();

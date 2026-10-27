const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
let base=fs.readFileSync('t2.js','utf8').match(/const mock=`([\s\S]*?)`;/)[1];
const seed=require('./seed_fake.js');
const FAST=process.env.FAST?0.15:1;const OUT=process.argv[2]||'real_video';const SHOTS=!!process.env.SHOTS;
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,Math.max(60,ms*FAST)));
(async()=>{const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1280,height:720},recordVideo:(FAST<1||process.env.NOVID)?undefined:{dir:OUT,size:{width:1280,height:720}}});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(base);await p.addInitScript(seed);
 await p.goto('file:///home/user/RoleFinder/demo/real_wrap.html');await sleep(2500);
 const fA=await (await p.$('#fA')).contentFrame(),fB=await (await p.$('#fB')).contentFrame();
 await fA.waitForFunction(()=>window.__gcg&&window.__seedFake);await fB.waitForFunction(()=>window.__gcg&&window.__seedFake);
 const F={A:fA,B:fB};
 const step=n=>p.evaluate(n=>window.step(n),n);
 const shot=async n=>{if(SHOTS){await sleep(400);await p.screenshot({path:'real_shots/r_'+n+'.png'});}};
 async function sync(from,to){const d=await F[from].evaluate(()=>JSON.stringify(window.__store));await F[to].evaluate(d=>{const s=window.__store;Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,JSON.parse(d));window.__notify();},d);await sleep(600);}
 async function pt(w,sel){const loc=F[w].locator(sel).first();await loc.scrollIntoViewIfNeeded();await sleep(500);const bx=await loc.boundingBox();
   await p.evaluate(([x,y])=>window.cur(x,y),[bx.x+Math.min(bx.width/2,40),bx.y+bx.height/2]);await sleep(750);await p.evaluate(()=>window.ripple());await sleep(150);}
 async function tap(w,sel,after){await pt(w,sel);await F[w].locator(sel).first().click();await sleep(after||900);}
 async function scrollTo(w,sel,off){await F[w].locator(sel).first().evaluate((e,o)=>{window.scrollTo({top:e.getBoundingClientRect().top+window.scrollY-(o||70),behavior:'smooth'});},off);await sleep(1300);}
 const title=async(h,ms)=>{await p.evaluate(h=>window.title(h),h);await sleep(ms);await p.evaluate(()=>window.title(''));await sleep(400);};

 await fA.evaluate(()=>{window.__seedFake();window.__as('admin1',true,'Nana');window.__gcg.showView('home');});
 await sync('A','B');
 await fB.evaluate(()=>{window.__as('u4',false,'Efua');window.__gcg.showView('home');});await sleep(800);
 await title('<span class="ex2">EXAMPLE DATA · FICTIONAL PEOPLE, NUMBERS AND COMPANY</span><h1>From job, to match, <b>to the person.</b></h1>',4500);

 // 1 the manager adds the job
 await step(1);await sleep(2500);await shot('0_start');
 await tap('A','.navb:has-text("Events")',1000);
 await tap('A','text=+ Add an event or project',1000);
 await tap('A','input[placeholder="Event name"]',300);await F.A.locator('input[placeholder="Event name"]').pressSequentially('Bill-pay agent launch day',{delay:50});await sleep(600);
 const sel=await fA.$$('select');await sel[0].selectOption({index:0});await sleep(600);
 const d=new Date();d.setDate(d.getDate()+6);await fA.fill('input[type=date]',d.toISOString().slice(0,10));await sleep(600);await sel[1].selectOption({index:0});await sleep(1000);
 await tap('A','button:has-text("Create event")',2200);await shot('1_created');

 // 2 the system suggests a shortlist, with reasons
 await step(2);
 await F.A.evaluate(()=>document.getElementById('crewReview').scrollIntoView({block:'start'}));await sleep(2500);await shot('2_review');
 for(const off of [380,760,1140]){await F.A.evaluate(o=>{const e=document.getElementById('crewReview');window.scrollTo({top:e.getBoundingClientRect().top+window.scrollY+o,behavior:'smooth'});},off);await sleep(2600);}

 // 3 the manager chooses
 await step(3);
 await F.A.evaluate(()=>document.getElementById('crewReview').scrollIntoView({block:'start'}));await sleep(1200);
 await tap('A','#crewReview button:text-is("Change")',1300);await scrollTo('A','#crewReview select',260);await shot('3_change');await sleep(3200);
 await tap('A','#crewReview button:text-is("Close")',900);
 await tap('A','#crewReview button:has-text("Accept all")',1600);await shot('4_acceptall');
 await F.A.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));await sleep(1400);
 const pubSel='button:has-text("ublish")';await tap('A',pubSel,900);await tap('A',pubSel,2000);await shot('5_published');
 await F.A.evaluate(()=>window.scrollTo({top:0}));await sleep(500);
 await tap('A','button:has-text("Send offers for now")',2200);await shot('5b_offers');

 // 4 the person sees the offer and their week
 await sync('A','B');await p.evaluate(()=>window.buzz('pfB'));await sleep(1000);await step(4);await sleep(1500);
 await tap('B','#bellBtn',1500);await shot('7_bell');await sleep(2500);await tap('B','#notePop button:text-is("Close")',900);
 await tap('B','summary:has-text("This week")',1500);await shot('7b_week');await sleep(2500);
 await tap('B','summary:has-text("This week")',700);
 await scrollTo('B','text=SUGGESTED FIRST',90);await shot('8_offer');await sleep(4500);
 await tap('B','button:text-is("I\'ll take it")',2000);await shot('9_taken');await sleep(2500);
 await sync('B','A');

 // 5 progress, where they stand, path to promotion
 await step(5);
 await F.B.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));await sleep(1300);
 await scrollTo('B','text=Your progress',90);await shot('10_progress');await sleep(4500);
 await tap('B','.bottomnav .navb:nth-child(5)',1800);await shot('11_me');await sleep(3500);
 await scrollTo('B','h3:has-text("My title")',80);await shot('12_title');await sleep(4500);
 await scrollTo('B','h3:has-text("Your GCG trail")',80);await shot('13_trail');await sleep(5000);
 await title('<span class="ex2">EXAMPLE DATA · FICTIONAL PEOPLE, NUMBERS AND COMPANY</span><h1>The right person for the right task. <b>One tap.</b></h1>',4500);
 console.log('errors',errs);
 await ctx.close();await b.close();
})();

const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const mock=`(()=>{const df=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(df);Object.freeze(o);}return o;};const store={},subs=[];
 const notify=()=>subs.forEach(s=>s());
 const coll=n=>({docs:Object.keys(store).filter(k=>k.startsWith(n+'/')&&k.split('/').length===2).map(k=>({id:k.split('/')[1],data:()=>df(JSON.parse(JSON.stringify(store[k])))}))});
 const rp=p=>{const m=/^(projectmine|projectup)\/admin1$/.exec(p);const u=window.__gcg&&window.__gcg.S&&window.__gcg.S.uid;return (m&&u&&u!=='admin1')?m[1]+'/'+u:p;};
 const db={doc:p=>{const P=()=>rp(p);return ({get:async()=>({exists:!!store[P()],data:()=>df(JSON.parse(JSON.stringify(store[P()])))}),
   set:async v=>{store[P()]=JSON.parse(JSON.stringify(v));setTimeout(notify,10);},delete:async()=>{delete store[P()];setTimeout(notify,10);},
   onSnapshot:(f)=>{const s=()=>f({exists:!!store[P()],data:()=>df(JSON.parse(JSON.stringify(store[P()])))});subs.push(s);s();return()=>{};}});},
  collection:n=>({onSnapshot:(f)=>{const s=()=>f(coll(n));subs.push(s);s();return()=>{};}})};
 window.__store=store;window.__notify=notify;
 const user={id:async()=>'admin1',canEdit:async()=>true,isOwner:async()=>true,can:async()=>true};
 window.claude={use:async n=>n==='db'?db:n==='user'?user:null};})();`;
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(mock);
 await p.goto('file:///home/user/RoleFinder/gcg-game-plan.html');await p.waitForTimeout(500);
 // seed two people
 await p.evaluate(()=>{const s=window.__store;
  s['responses/u1']={name:'Ama',good:['C1','C8','D3'],curious:['D1'],no:['G1'],top:[],q:[1,2,3,4,5,6,7,8,9,10,11,12,64,3],story:{hidden:['edit','photo'],why:['fun']}};
  s['responses/u2']={name:'Kofi',good:['C2','C3','E6'],curious:['C8'],no:['D3'],top:[],q:[16,15,14,13,12,11,10,9,8,7,6,5,8,1],story:{hidden:['venues','music']}};
  s['responses/manual-x']={name:'Esi',good:['D5','D1','C7'],curious:[],no:[],top:[],q:[0,0,0,0,0,0,0,0,0,0,0,0,32,0],story:{hidden:['design']},source:'pasted'};window.__notify();});
 await p.waitForTimeout(300);
 await p.click('#tab-events');await p.click('text=New event');await p.waitForTimeout(100);
 await p.fill('input[aria-label="Event name"]','Quiz Night');await p.fill('input[aria-label="Place"]','Osu');
 await p.fill('input[aria-label="Date"]','2026-10-12');await p.waitForTimeout(800);
 await p.click('button:has-text("Add the usual")');await p.waitForTimeout(100);
 await p.fill('input[aria-label="New task"]','Make a 30-second teaser video');await p.selectOption('select[aria-label="Closest job for the new task"]','D3');await p.click('text=Add this task');
 await p.click('button:has-text("Suggest people")');await p.waitForTimeout(100);
 await p.screenshot({path:'ev-1.png',fullPage:true});
 await p.click('button:has-text("Send offers")');await p.waitForTimeout(200);
 const ev=await p.evaluate(()=>{const e=Object.entries(window.__store).find(([k])=>k.startsWith('events/'));return e[1];});
 console.log(ev.name,ev.date,ev.place);ev.tasks.forEach(t=>console.log(' ',t.title,'|',t.job,'|',t.owner,'|',t.offered));
 // become Ama
 await p.evaluate(()=>{const g=window.__gcg;g.S.uid='u1';g.S.isAdmin=false;g.S.name='Ama';g.showView('flow');});
 await p.waitForTimeout(100);await p.screenshot({path:'ev-2-banner.png'});
 await p.evaluate(()=>window.__gcg.showView('tasks'));await p.waitForTimeout(100);
 await p.screenshot({path:'ev-3-mytasks.png',fullPage:true});
 await p.click('.sb[data-c=yes] >> nth=0');await p.fill('input[aria-label^="Note for"] >> nth=1','Busy editing that week');await p.click('.sb[data-c=no] >> nth=1');await p.waitForTimeout(200);
 // back to admin
 await p.evaluate(()=>{const g=window.__gcg;g.S.uid='admin1';g.S.isAdmin=true;g.showView('events');});await p.waitForTimeout(150);
 await p.screenshot({path:'ev-4-status.png',fullPage:true});
 const passed=await p.$$('text=Offer to next best');console.log('next-best buttons',passed.length);
 if(passed.length){await passed[0].click();await p.waitForTimeout(100);}
 const ev2=await p.evaluate(()=>{const e=Object.entries(window.__store).find(([k])=>k.startsWith('events/'));return e[1];});
 ev2.tasks.forEach(t=>console.log(' ',t.title,'|',t.owner,'|',t.offered,'|',t.passed));
 console.log('replies',await p.evaluate(()=>Object.keys(window.__store).filter(k=>k.startsWith('replies/'))));
 const ow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);console.log('overflow',ow,'errors',errs);
 const pdf=await p.evaluate(()=>{const g=window.__gcg;const ev=g.S.events[0];return g.buildPdf(g.crewBlocks(ev)).length+' '+JSON.stringify(g.crewBlocks(ev).map(b=>b.text))});console.log('crewpdf',pdf);
 await p.evaluate(()=>window.__gcg.showView('crew'));await p.waitForTimeout(100);await p.screenshot({path:'ev-5-crew.png',fullPage:true});
 console.log('overflow2',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errs);
 await b.close();})();

// Fake team for the real app. EXAMPLE DATA only: fictional people, company and numbers.
module.exports=`(function(){
 window.__seedFake=function(){var s=window.__store,G=window.__gcg;
  var QH=[0,4,8,4,0,4,0,0,10,14,9,0,2407,11];
  var ppl=[['admin1','Nana',['C2','C5'],QH],['u1','Ama',['G1','F3','E6','C9','D1'],[0,12,11,10,0,11,0,0,3,12,14,0,308,67]],['u2','Kofi',['C11','D6','D9','D7','E8'],[0,9,12,6,0,3,0,0,12,12,10,0,3713,67]],['u3','Yaw',['G1','F3','F2','C9','D1'],[0,14,3,6,0,13,0,0,13,10,9,0,276,67]],['u4','Efua',['C5','C4','F2','D5','E1'],[0,11,3,7,0,7,0,0,3,10,5,0,15,67]],['u5','Selorm',['E8','E6','E1','D6'],[0,6,3,7,0,11,0,0,3,9,9,0,900,67]]];
  ppl.forEach(function(x){var r={name:x[1],good:x[2],curious:[],no:[],top:[],q:x[3],story:{team:'solo',structure:'clear',why:['experience','community','mission'],future:'expand',futures:['expand','people'],hidden:[],proud:'',enjoy:[],explore:[]},share:{brings:true,up:true,works:true},confirm:'yes',updated:'2026-04-20T10:00:00Z',v:6,source:'app'};s['responses/'+x[0]]=r;s['people/'+x[0]]={name:x[1],updated:r.updated};});
  G.S.people=ppl.map(function(x){return Object.assign({id:x[0]},s['responses/'+x[0]]);});
  // six months of finished work, so the app's own progress and trail are real
  var hist=[['May','2026-05-14','Customer Onboarding Sprint',[['u4','Set up the room','C5'],['u4','Music and sound cues','C4'],['u3','Count money and record costs','G1'],['u1','Test projector, sound and slides','F3']]],
   ['Jun','2026-06-18','Team Offsite',[['u2','Host the welcome game','C11'],['u2','Send personal invitations','D6'],['u3','Pack down and return equipment','F2'],['u5','Bring in the community partner','E8']]],
   ['Jul','2026-07-23','Month-End Close',[['u3','Count money and record costs','G1'],['u1','Lock the venue and terms','E6'],['u5','Create the event page','E1'],['u3','Floor manager','C9']]],
   ['Aug','2026-08-20','Agent Training Day',[['u2','Thank-you message and feedback form','D9'],['u4','Design the flyer','D5'],['u4','Pack down and return equipment','F2'],['u3','Test projector, sound and slides','F3']]],
   ['Sep','2026-09-17','Launch Rehearsal',[['u4','Set up the room','C5'],['u2','Collect guest testimonials','D7'],['u5','Lock the venue and terms','E6'],['u1','Floor manager','C9']]],
   ['Oct','2026-10-08','Quarterly Review',[['u3','Count money and record costs','G1'],['u4','Music and sound cues','C4'],['u2','Host the welcome game','C11'],['u1','Test projector, sound and slides','F3']]]];
  var late={'3_2':1,'1_2':1};
  hist.forEach(function(h,i){var tasks=h[3].map(function(t,k){return {id:'h'+i+'_'+k,title:t[1],job:t[2],phase:'before',d:-2,pri:'should',cp:0,owner:t[0],offered:true,ots:h[1]+'T08:00:00Z',manual:'done',mts:{done:(late[i+'_'+k]?h[1]+'T12:00:00Z':new Date(new Date(h[1]+'T12:00:00Z').getTime()-3*864e5).toISOString())},passed:[],handDone:{},helper:'',sug:false,ok:true,link:'',group:'gh'+i+k,size:'M',need:1,all:false,m:null,msg:''};});
   s['events/hist'+i]={name:h[2],goal:'',date:h[1],start:'18:00',published:true,type:'welcome_c',links:{},cps:[{name:'Event',d:0}],tasks:tasks,crew:{},games:[],guests:[],place:{},files:[],debrief:{},created:h[1]+'T08:00:00Z',updated:h[1]+'T20:00:00Z'};});
  [['t1','Rapid Response Lead','Takes the urgent jobs: fast starts, emergency drills, jobs that must move now.',['C5','C4','F2'],['u4']],['t2','Operations Steward','Holds dates, records and the long careful work.',['G1','F3','C9'],['u3']],['t3','Client and Training Lead','Explains, hosts and wins the room.',['C11','D6','D9'],['u2']]].forEach(function(t){s['titles/'+t[0]]={name:t[1],desc:t[2],jobs:t[3],holders:t[4],updated:'2026-06-01T10:00:00Z'};});
  window.__notify();return ppl.length;};
 window.__as=function(uid,admin,name){var G=window.__gcg;G.S.uid=uid;G.S.isAdmin=!!admin;G.S.realAdmin=!!admin;G.S.isOwner=!!admin;G.S.name=name;G.S.sentAt='2026-04-20';var r=window.__store['responses/'+uid];if(r){G.S.q=r.q;}};
})();`;

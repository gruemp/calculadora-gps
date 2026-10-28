const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {Engine,entities,KEY}=require('../gps-sync.js');
const script=fs.readFileSync(require('node:path').join(__dirname,'../apps-script/control-gps.gs'),'utf8');
function server(){
  const data=[];const properties={GPS_OWNER_EMAIL:'owner@example.test',GPS_SPREADSHEET_ID:'private-sheet',GPS_GEOCODE_ENABLED:'true',GPS_GEOCODE_DAILY_LIMIT:'2'};
  let actor='owner@example.test',geoCalls=0;
  const range=(row,col,n=1,m=1)=>({getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>data[row+i-1]?.[col+j-1]??'')),setValues:values=>values.forEach((r,i)=>{data[row+i-1]=r;})});
  const sheet={getRange:range,getLastRow:()=>data.length,setFrozenRows:()=>{}};
  let exists=false;
  const book={getSheetByName:()=>exists?sheet:null,insertSheet:()=>{exists=true;return sheet;}};
  const ctx=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties[k],setProperty:(k,v)=>{properties[k]=v;}})},Session:{getEffectiveUser:()=>({getEmail:()=>actor})},SpreadsheetApp:{openById:()=>book,flush:()=>{}},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},Maps:{newGeocoder:()=>({setLanguage(){return this;},reverseGeocode(){geoCalls++;return {status:'OK',results:[{formatted_address:'Dirección de prueba',geometry:{location_type:'APPROXIMATE'},address_components:[{long_name:'Colombia',types:['country']}]}]};}})}});
  vm.runInContext(script,ctx);
  const call=request=>JSON.parse(JSON.stringify(ctx.gpsApi(JSON.parse(JSON.stringify(request)))));
  call({action:'initialize'});
  return {call,data,properties,actor:a=>{actor=a;},geoCalls:()=>geoCalls};
}
function memory(){const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};}
const point={latitude:4.6,longitude:-74.1,accuracy:8,timestamp:1700000000000};
const snapshot=(address='')=>entities([point],[{...point,label:'Casa'}],address?{'4.600000,-74.100000':{address,source:'manual'}}:{});
function client(s,{storage=memory(),send,apply}={}){
  let n=0;const applied=[];
  const e=new Engine({storage,send:send||(async(r)=>s.call(r)),apply:apply||(async(events)=>applied.push(...events)),uuid:()=>require('node:crypto').randomUUID()});
  return {e,applied,storage};
}
test('anonymous and unauthorized accounts cannot read, write, geocode or initialize',()=>{
  const s=server();for(const actor of ['','intruder@example.test']){s.actor(actor);for(const action of ['status','list','push','geocode','initialize'])assert.throws(()=>s.call({action}),/GPS_FORBIDDEN/);}
});
test('unconfigured backend fails closed',()=>{const s=server();delete s.properties.GPS_SPREADSHEET_ID;assert.throws(()=>s.call({action:'status'}),/GPS_NOT_CONFIGURED/);});
test('write, read, two-device recovery, favorites and manual addresses',async()=>{
  const s=server(),a=client(s);await a.e.bind();a.e.observe(snapshot('Calle manual'));await a.e.sync();
  assert.equal(a.e.data.pending.length,0);assert.equal(s.data.length,4);
  const b=client(s);await b.e.bind();await b.e.sync();assert.equal(b.applied.length,3);assert.equal(b.applied.find(v=>v.kind==='address').value.address,'Calle manual');
});
test('uncertain response retried after reload creates no duplicate rows',async()=>{
  const s=server();let fail=true;
  const a=client(s,{send:async r=>{const response=s.call(r);if(r.action==='push'&&fail){fail=false;throw Error('network lost after commit');}return response;}});
  await a.e.bind();a.e.observe(snapshot());await assert.rejects(a.e.sync());assert.equal(a.e.data.pending.length,2);
  const b=client(s,{storage:a.storage});await b.e.bind();await b.e.sync();assert.equal(s.data.length,3);assert.equal(b.e.data.pending.length,0);
});
test('repeated observation of identical local state produces no duplicates',async()=>{
  const s=server(),{e}=client(s);await e.bind();for(let i=0;i<10;i++)e.observe(snapshot());await e.sync();assert.equal(s.data.length,3);
});
test('concurrent address corrections preserve both versions, flag conflict and ignore client clocks',async()=>{
  const s=server(),a=client(s);await a.e.bind();a.e.observe(snapshot('Primera'));await a.e.sync();
  const b=client(s);await b.e.bind();await b.e.sync();
  b.e.observe(snapshot('Segunda'));a.e.observe(snapshot('Tercera'));await a.e.sync();await b.e.sync();
  const addresses=s.call({action:'list',cursor:0}).events.filter(e=>e.kind==='address');
  assert.deepEqual(addresses.map(e=>e.value.address),['Primera','Tercera','Segunda']);assert.equal(addresses.at(-1).conflict,true);
  assert.ok(Date.parse(addresses.at(-1).serverTime)>point.timestamp);
});
test('favorite removals and address clearing sync without deleting history or old rows',async()=>{
  const s=server(),a=client(s);await a.e.bind();a.e.observe(snapshot('Manual'));await a.e.sync();
  a.e.observe(entities([point],[],{}));await a.e.sync();assert.equal(s.data.length,6);
  const events=s.call({action:'list',cursor:0}).events;assert.equal(events.filter(e=>e.kind==='record').length,1);assert.equal(events.at(-2).value.enabled,false);assert.equal(events.at(-1).value.address,'');
  const before=s.data.length;a.e.observe(entities([point],[],{}));await a.e.sync();assert.equal(s.data.length,before);
});
test('before consent/binding there are no writes or network calls',async()=>{
  let calls=0;const {e,storage}=client(null,{send:async()=>{calls++;}});e.observe(snapshot());await e.sync();assert.equal(calls,0);assert.equal(storage.getItem(KEY),null);
});
test('network failure retains queue and local source unchanged',async()=>{
  const s=server(),a=client(s);await a.e.bind();const source=snapshot('Privada');a.e.observe(source);a.e.send=async()=>{throw Error('offline');};await assert.rejects(a.e.sync());assert.equal(a.e.data.pending.length,3);assert.equal(source['address|4.600000,-74.100000'].value.address,'Privada');
});
test('different account/dataset cannot reuse the persisted queue',async()=>{
  const s=server(),a=client(s);await a.e.bind();a.e.send=async()=>({service:'control-gps',version:1,dataset:'other',actor:'owner@example.test'});await assert.rejects(a.e.bind(),/no coincide/);
});
test('pagination has stable sequence across 200-row boundary',()=>{
  const s=server();for(let offset=0;offset<250;offset+=50)s.call({action:'push',operations:Array.from({length:50},(_,i)=>{
    const v={...point,timestamp:point.timestamp+offset+i};return {operationId:'operation_'+(offset+i),device:'device_123456',entityId:'record|'+[v.timestamp,v.latitude,v.longitude].join('|'),kind:'record',value:v,base:0};
  })});
  const first=s.call({action:'list',cursor:0}),second=s.call({action:'list',cursor:first.cursor});assert.equal(first.events.length,200);assert.equal(second.events.length,50);assert.equal(second.events[0].seq,201);assert.equal(second.more,false);
});
test('invalid batch is atomic, formula-like address is inert JSON and reused IDs are rejected',()=>{
  const s=server(),op={operationId:'operation_123456',device:'device_123456',entityId:'address|4.600000,-74.100000',kind:'address',value:{address:'=IMPORTXML("private")'},base:0};
  assert.throws(()=>s.call({action:'push',operations:[op,{...op,kind:'bad'}]}),/INVALID/);assert.equal(s.data.length,1);
  s.call({action:'push',operations:[op]});assert.ok(s.data[1][8].startsWith('{'));assert.throws(()=>s.call({action:'push',operations:[{...op,value:{address:'different'}}]}),/GPS_OPERATION_REUSED/);
});
test('geocoding honors backend consent and daily quota; absent components stay empty',()=>{
  const s=server();s.properties.GPS_GEOCODE_ENABLED='false';assert.throws(()=>s.call({action:'geocode',...point}),/DISABLED/);
  s.properties.GPS_GEOCODE_ENABLED='true';const a=s.call({action:'geocode',...point});assert.equal(a.number,'');assert.equal(a.country,'Colombia');assert.equal(a.quality,'APPROXIMATE');s.call({action:'geocode',...point});assert.throws(()=>s.call({action:'geocode',...point}),/QUOTA/);assert.equal(s.geoCalls(),2);
});
test('local persistence failure during pull never advances cursor',async()=>{
  const s=server(),a=client(s);await a.e.bind();a.e.observe(snapshot());await a.e.sync();const b=client(s,{apply:async()=>{throw Error('local disk full');}});await b.e.bind();await assert.rejects(b.e.sync());assert.equal(b.e.data.cursor,0);
});
test('local history deletion never issues remote delete',async()=>{
  const s=server(),{e}=client(s);await e.bind();e.observe(entities([point],[],{}));await e.sync();e.observe(entities([],[],{}));await e.sync();assert.equal(s.data.length,2);
});
test('published app preserves original CSS and local key; all scripts parse',()=>{
  const cp=require('node:child_process');const path=require('node:path');const dir=path.join(__dirname,'..');
  const before=cp.execFileSync('git',['show','305b4978e4f6b42c956ded42f3cf7ca29356b23d:inicio.html'],{cwd:dir,encoding:'utf8'});
  const after=fs.readFileSync(path.join(dir,'inicio.html'),'utf8');assert.equal(after.match(/<style>([\s\S]*?)<\/style>/)[1],before.match(/<style>([\s\S]*?)<\/style>/)[1]);assert.ok(after.includes("const KEY = 'gpsTrackerState'"));
  for(const match of after.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
  for(const file of ['gps-sync.js','gps-google.js'])new vm.Script(fs.readFileSync(path.join(dir,file),'utf8'));
});
function adapter(s,{consent=false,httpStatus=200}={}){
  const storage=memory();storage.setItem('gpsGoogleConfigV1',JSON.stringify({clientId:'testclient.apps.googleusercontent.com',deploymentId:'deployment_for_test_1234567890',consent}));storage.setItem('gpsTrackerState',JSON.stringify({days:{original:'preserved'},geoapifyKey:'local-only-secret'}));
  const elements=new Map(),requests=[],timers=new Map();let timer=0,revoked=false;
  function element(id){if(!elements.has(id))elements.set(id,{value:'',checked:false,textContent:'',disabled:false,listeners:{},addEventListener(name,cb){this.listeners[name]=cb;}});return elements.get(id);}
  const win={GpsSync:require('../gps-sync.js'),addEventListener:()=>{},google:{accounts:{oauth2:{hasGrantedAllScopes:()=>true,revoke:()=>{revoked=true;},initTokenClient:options=>({requestAccessToken:()=>options.callback({access_token:'memory-token',expires_in:3600})})}}}};
  const ctx=vm.createContext({window:win,document:{getElementById:element},localStorage:storage,navigator:{locks:{request:async(n,o,fn)=>fn({})}},crypto:require('node:crypto').webcrypto,AbortController,confirm:()=>true,setTimeout:fn=>{timers.set(++timer,fn);return timer;},clearTimeout:id=>timers.delete(id),fetch:async(url,options)=>{
    const request=JSON.parse(options.body);requests.push({url,options,request});
    return {ok:httpStatus===200,status:httpStatus,json:async()=>({done:true,response:{result:s.call(request.parameters[0])}})};
  }});
  vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../gps-google.js'),'utf8'),ctx);
  const current=snapshot('Privada');
  const api=win.GpsGoogle.init({snapshot:()=>current,apply:events=>{for(const e of events)current[e.entityId]={kind:e.kind,value:e.value};},save:()=>true,render:()=>{},diagnostic:()=>{}});
  return {api,storage,requests,element,click:id=>element(id).listeners.click(),revoked:()=>revoked};
}
const settle=async()=>{for(let i=0;i<10;i++)await new Promise(resolve=>setImmediate(resolve));};
test('Google adapter sends nothing without consent, then uses authenticated Google endpoint and local backup',async()=>{
  const s=server(),a=adapter(s);a.click('googleConnectBtn');await settle();assert.equal(a.requests.length,0);
  a.element('googleConsent').checked=true;a.click('googleConnectBtn');await settle();
  assert.ok(a.requests.length>=3);assert.equal(a.requests[0].url,'https://script.googleapis.com/v1/scripts/deployment_for_test_1234567890:run');assert.equal(a.requests[0].options.headers.Authorization,'Bearer memory-token');
  assert.equal(JSON.parse(a.storage.getItem('gpsSyncBackupV1')).days.original,'preserved');assert.ok(!a.storage.getItem(KEY).includes('memory-token'));assert.ok(!a.storage.getItem('gpsGoogleConfigV1').includes('memory-token'));
  a.click('googleDisconnectBtn');assert.equal(a.api.connected(),false);assert.equal(a.revoked(),true);
});
test('Google adapter fails closed on HTTP permission failure (simulated transport) and does not migrate local data',async()=>{
  const s=server(),a=adapter(s,{consent:true,httpStatus:403});const original=a.storage.getItem('gpsTrackerState');a.click('googleConnectBtn');await settle();assert.equal(a.requests.length,1);assert.equal(a.api.connected(),false);assert.equal(a.storage.getItem('gpsTrackerState'),original);assert.equal(a.storage.getItem('gpsSyncBackupV1'),null);assert.match(a.element('googleSyncStatus').textContent,/Acceso denegado/);
});

test('clearing local projection rewinds recovery without producing remote removals',async()=>{
  const s=server(),a=adapter(s,{consent:true});a.click('googleConnectBtn');await settle();
  const before=s.data.length;assert.equal(a.api.prepareLocalClear(),true);
  const data=JSON.parse(a.storage.getItem(KEY));assert.equal(data.cursor,0);assert.deepEqual(data.observed,{});assert.equal(s.data.length,before);
  const restored=client(s,{storage:a.storage});await restored.e.bind();await restored.e.sync();assert.equal(restored.applied.length,3);assert.equal(s.data.length,before);
});

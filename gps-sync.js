/* Control GPS: durable, opt-in replication. No credentials in persisted state. */
(function(root){
  'use strict';
  const KEY='gpsSyncStateV1', BACKUP='gpsSyncBackupV1';
  const clone=v=>JSON.parse(JSON.stringify(v));
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const pointId=p=>[Number(p.timestamp),Number(p.latitude),Number(p.longitude)].join('|');
  const addressId=p=>Number(p.latitude).toFixed(6)+','+Number(p.longitude).toFixed(6);
  function entities(records,favorites,addresses){
    const result={};
    for(const p of records)result['record|'+pointId(p)]={kind:'record',value:{...p}};
    for(const p of favorites)result['favorite|'+pointId(p)]={kind:'favorite',value:{...p,enabled:true}};
    for(const [k,v] of Object.entries(addresses))if(v&&typeof v.address==='string')result['address|'+k]={kind:'address',value:{...v}};
    return result;
  }
  class Engine{
    constructor({storage,send,apply,status=()=>{},uuid=()=>crypto.randomUUID()}){
      Object.assign(this,{storage,send,apply,status,uuid});
      this.data=JSON.parse(storage.getItem(KEY)||'null')||{version:1,device:uuid(),cursor:0,observed:{},pending:[],revisions:{},audit:[]};
      this.busy=false;this.ready=false;
    }
    persist(){this.storage.setItem(KEY,JSON.stringify(this.data));}
    async bind(){
      const health=await this.send({action:'status'});
      if(health?.service!=='control-gps'||health.version!==1||!health.dataset||!health.actor)throw Error('Servicio incompatible.');
      const binding=health.dataset+'|'+health.actor;
      if(this.data.binding&&this.data.binding!==binding)throw Error('La cuenta o la hoja no coincide con la conexión anterior. Conserva la copia y usa otro perfil del navegador.');
      this.data.binding=binding;this.persist();this.ready=true;return health;
    }
    observe(current){
      if(!this.ready)return;
      const before=this.data.observed;
      for(const [id,entity] of Object.entries(current)){
        if(!same(before[id],entity))this.queue(id,entity);
      }
      for(const [id,entity] of Object.entries(before))if(!current[id]&&entity.kind!=='record'){
        const value=entity.kind==='favorite'?{...entity.value,enabled:false}:{address:'',source:'manual'};
        // Observe a removal once, while retaining its remote tombstone.
        this.queue(id,{kind:entity.kind,value});
      }
      this.data.observed=clone(current);this.persist();
    }
    queue(id,entity){
      // Never rewrite an in-flight operation: an uncertain response can be retried safely.
      this.data.pending.push({operationId:this.uuid(),entityId:id,base:this.data.revisions[id]||0,device:this.data.device,...clone(entity)});
    }
    async sync(){
      if(!this.ready||this.busy)return;
      this.busy=true;
      try{
        // Pull before uploading: existing local changes remain protected by the queue.
        await this.pull();
        for(let count=0;this.ready&&this.data.pending.length&&count<20;count++){
          const batch=this.data.pending.slice(0,50);
          const result=await this.send({action:'push',operations:batch});
          if(!Array.isArray(result?.ack))throw Error('Falta confirmación del servidor.');
          const ack=new Set(result.ack);
          this.data.pending=this.data.pending.filter(p=>!ack.has(p.operationId));this.persist();
          if(!batch.some(p=>ack.has(p.operationId)))throw Error('El servidor no confirmó las operaciones.');
          await this.pull();
        }
        this.status(this.data.pending.length?'Hay cambios pendientes.':'Sincronizado con Google Sheets.');
      }finally{this.busy=false;}
    }
    async pull(){
      for(let count=0;this.ready&&count<100;count++){
        const result=await this.send({action:'list',cursor:this.data.cursor});
        if(!Array.isArray(result?.events)||!Number.isSafeInteger(result.cursor)||result.cursor<this.data.cursor)throw Error('Cursor remoto inválido.');
        const next=clone(this.data);
        const changes=[];
        for(const event of result.events){
          if(!Number.isSafeInteger(event.seq)||event.seq<=this.data.cursor||event.seq>result.cursor)throw Error('Secuencia remota inválida.');
          next.revisions[event.entityId]=event.seq;
          const pending=next.pending.some(p=>p.entityId===event.entityId);
          if(event.conflict)next.audit.push(clone(event));
          if(!pending){
            changes.push(event);
            if((event.kind==='favorite'&&event.value.enabled===false)||(event.kind==='address'&&!event.value.address))delete next.observed[event.entityId];
            else next.observed[event.entityId]={kind:event.kind,value:clone(event.value)};
          }
        }
        // Persist local application first. A crash before cursor commit safely replays events.
        if(changes.length)await this.apply(changes);
        if(!this.ready)return;
        this.data=next;this.persist();
        if(!result.more)return;
        if(!result.events.length)throw Error('Paginación sin progreso.');
      }
    }
    stop(){this.ready=false;}
  }
  const api={Engine,entities,pointId,addressId,KEY,BACKUP};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GpsSync=api;
})(typeof window==='undefined'?globalThis:window);

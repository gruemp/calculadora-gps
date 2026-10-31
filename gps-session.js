/* Private Google session transport. Google retains credentials; only API results cross frames. */
(function(root){
  'use strict';
  const validUrl=value=>typeof value==='string'&&/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,200}\/exec$/.test(value);
  const validOrigin=value=>value==='https://script.google.com'||/^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(value);
  class Bridge{
    constructor(url){if(!validUrl(url))throw Error('Servicio privado de sesión inválido.');this.url=url;this.pending=new Map();}
    connect(){
      if(this.connection)return this.connection;
      this.nonce=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
      this.connection=new Promise((resolve,reject)=>{
        this.rejectConnect=reject;
        this.listener=event=>{
          const data=event.data;
          if(!validOrigin(event.origin)||!data||data.nonce!==this.nonce||!event.source)return;
          if(!this.source){
            if(data.type!=='control-gps-ready'||event.source.top!==root)return;
            this.source=event.source;this.origin=event.origin;clearTimeout(this.startTimer);this.rejectConnect=null;resolve();return;
          }
          if(event.source!==this.source||event.origin!==this.origin||data.type!=='control-gps-result')return;
          const pending=this.pending.get(data.id);if(!pending)return;
          clearTimeout(pending.timer);this.pending.delete(data.id);
          if(data.error){const message=/^GPS_[A-Z_]+$/.test(data.error)?data.error:'El servicio de Google no pudo completar la operación.';
            pending.reject(Object.assign(Error(message),{permanent:message.startsWith('GPS_')&&message!=='GPS_BUSY'}));}
          else pending.resolve(data.result);
        };
        root.addEventListener('message',this.listener);
        this.startTimer=setTimeout(()=>this.close(Error('Google no pudo recuperar la sesión automáticamente. Puede requerir acceso o permitir cookies de Google.')),20000);
        this.frame=document.createElement('iframe');this.frame.hidden=true;this.frame.title='Sesión privada de Google';this.frame.referrerPolicy='no-referrer';
        this.frame.src=this.url+'?gps_nonce='+this.nonce;document.body.append(this.frame);
      });
      return this.connection;
    }
    async call(request){
      await this.connect();
      return new Promise((resolve,reject)=>{
        const id=crypto.randomUUID();
        const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('Google no confirmó la operación. Los cambios pendientes se conservan.'));},45000);
        this.pending.set(id,{resolve,reject,timer});
        this.source.postMessage({type:'control-gps-request',nonce:this.nonce,id,request},this.origin);
      });
    }
    close(error=Error('Conexión cancelada.')){
      clearTimeout(this.startTimer);if(this.listener)root.removeEventListener('message',this.listener);this.frame?.remove();
      if(this.rejectConnect)this.rejectConnect(error);
      for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(error);}this.pending.clear();
      this.source=null;this.connection=null;this.rejectConnect=null;
    }
  }
  root.GpsSession={Bridge,validUrl};
})(window);

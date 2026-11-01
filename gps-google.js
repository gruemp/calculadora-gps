/* OAuth access tokens live only in memory; public service IDs can be provisioned at deployment. */
(function(root){
  'use strict';
  const CONFIG='gpsGoogleConfigV1';
  const validService=(clientId,deploymentId)=>typeof clientId==='string'&&typeof deploymentId==='string'
    &&/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId.trim())
    &&/^[A-Za-z0-9_-]{20,200}$/.test(deploymentId.trim());
  const scopes=['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/userinfo.email'];
  let gisLoading;
  function loadGis(){
    if(root.google?.accounts?.oauth2)return Promise.resolve();
    if(!gisLoading)gisLoading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.referrerPolicy='no-referrer';
      const timer=setTimeout(()=>{gisLoading=null;reject(Error('Google no respondió. Puedes seguir trabajando localmente.'));},15000);
      script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);gisLoading=null;reject(Error('No se pudo cargar el acceso a Google.'));};document.head.append(script);
    });
    return gisLoading;
  }
  function init({snapshot,apply,clearHistoryBefore,save,render,diagnostic}){
    const $=id=>document.getElementById(id);
    let config;try{config=JSON.parse(localStorage.getItem(CONFIG)||'{}');}catch{config={};}
    const published=root.CONTROL_GPS_GOOGLE_SERVICE||{};
    // Configuración publicada para todos los dispositivos, con compatibilidad con navegadores ya enlazados.
    const chosen=validService(published.clientId,published.deploymentId)?published:
      validService(config.clientId,config.deploymentId)?config:null;
    const service=chosen?{clientId:chosen.clientId.trim(),deploymentId:chosen.deploymentId.trim()}:null;
    const bridgeUrl=published.sessionBridgeEnabled===true&&root.GpsSession?.validUrl(published.sessionBridgeUrl)?published.sessionBridgeUrl:null;
    let bridge=null,useBridge=false,connecting=false,silentRequest=null,autoBlocked=false;
    let token='',expires=0,engine=null,applying=false,timer,attempts=0,epoch=0,geoAt=0,geoCount=0,geoBusy=false,clearing=false,tabRelease;
    function status(message){$('googleSyncStatus').textContent=message+(engine?.data.audit.length?' Conflictos conservados: '+engine.data.audit.length+'.':'');}
    function persistConfig(){localStorage.setItem(CONFIG,JSON.stringify(config));}
    function stop(message='Sincronización detenida. Datos locales conservados.'){
      epoch++;token='';expires=0;useBridge=false;bridge?.close();bridge=null;clearTimeout(timer);engine?.stop();if(tabRelease){tabRelease();tabRelease=null;}status(message);$('googleConnectBtn').disabled=false;$('googleClearHistoryBtn').disabled=true;
    }
    function retry(delay=1500){clearTimeout(timer);if((token||useBridge)&&engine?.ready)timer=setTimeout(run,delay);}
    async function activateBridge(session){
      if(!bridgeUrl)throw Error('La recuperación automática de sesión aún no está activada.');
      if(!bridge)bridge=new root.GpsSession.Bridge(bridgeUrl);
      await bridge.connect();
      if(session!==epoch)throw Object.assign(Error('Conexión cancelada.'),{permanent:true});
      useBridge=true;token='';expires=0;
    }
    function acceptToken(response){
      if(response.error||!response.access_token||!Number.isFinite(Number(response.expires_in))||Number(response.expires_in)<=60)throw Object.assign(Error('Google requiere confirmar el acceso. Pulsa Conectar con Google.'),{permanent:true});
      if(!root.google.accounts.oauth2.hasGrantedAllScopes(response,...scopes))throw Object.assign(Error('Faltan permisos. Pulsa Conectar con Google para autorizarlos.'),{permanent:true});
      token=response.access_token;expires=Date.now()+(Number(response.expires_in)-60)*1000;
    }
    async function silentToken(){
      if(autoBlocked)throw Object.assign(Error('El navegador requiere pulsar Conectar con Google para recuperar el acceso.'),{permanent:true});
      if(silentRequest)return silentRequest;
      const session=epoch;
      silentRequest=(async()=>{
        await loadGis();
        if(session!==epoch)throw Object.assign(Error('Conexión cancelada.'),{permanent:true});
        return new Promise((resolve,reject)=>{
          let settled=false;
          const fail=error=>{if(settled)return;settled=true;clearTimeout(timeout);autoBlocked=true;
            const message=error?.type==='popup_failed_to_open'?'El navegador bloqueó la ventana de Google. Pulsa Conectar con Google.':error?.type==='popup_closed'?'Se cerró la ventana de Google. Pulsa Conectar con Google.':'Google no confirmó el acceso automático. Pulsa Conectar con Google.';
            reject(Object.assign(Error(message),{permanent:true}));};
          const timeout=setTimeout(fail,15000);
          try{
            const client=root.google.accounts.oauth2.initTokenClient({client_id:service.clientId,scope:scopes.join(' '),include_granted_scopes:false,...(config.loginHint?{login_hint:config.loginHint}:{}),
              callback:response=>{if(settled)return;settled=true;clearTimeout(timeout);
                if(session!==epoch){reject(Object.assign(Error('Conexión cancelada.'),{permanent:true}));return;}
                try{acceptToken(response);resolve();}catch(error){autoBlocked=true;reject(error);}},error_callback:fail});
            client.requestAccessToken({prompt:'none'});
          }catch{fail();}
        });
      })();
      try{return await silentRequest;}finally{silentRequest=null;}
    }
    async function send(request,retried=false){
      const started=epoch;
      if(!useBridge&&(!token||Date.now()>=expires)&&bridgeUrl)await activateBridge(started);
      if(useBridge){
        const result=await bridge.call(request);
        if(started!==epoch)throw Object.assign(Error('Conexión cancelada.'),{permanent:true});
        return result;
      }
      if(!token||Date.now()>=expires)await silentToken();
      const session=epoch,controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),45000);
      let res;
      try{res=await fetch('https://script.googleapis.com/v1/scripts/'+encodeURIComponent(service.deploymentId)+':run',{
        method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal,
        headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({function:'gpsApi',parameters:[request],devMode:false})
      });}finally{clearTimeout(timeout);}
      if(session!==epoch)throw Object.assign(Error('Conexión cancelada.'),{permanent:true});
      if(res.status===401&&!retried){await silentToken();return send(request,true);}
      if(!res.ok)throw Object.assign(Error(res.status===401?'Sesión vencida. Vuelve a conectar.':res.status===403?'Acceso denegado. Revisa cuenta, permisos y proyecto OAuth.':'Google respondió HTTP '+res.status+'.'),{permanent:res.status!==408&&res.status!==429&&res.status<500});
      const operation=await res.json();
      if(operation.error){
        const detail=operation.error.details?.[0]?.errorMessage||'';
        const messages={GPS_FORBIDDEN:'Esta acción requiere la cuenta propietaria de la hoja.',GPS_CLIENT_UPDATE_REQUIRED:'Hay una versión nueva. Recarga Control GPS antes de conectar.',
          GPS_RECORD_BEFORE_CLEAR:'Los registros anteriores al último borrado no se vuelven a subir.',
          GPS_CLEAR_CHANGED:'Los datos cambiaron durante la confirmación. Revisa el historial y vuelve a intentarlo.',
          GPS_CLEAR_CONFIRMATION_REQUIRED:'La confirmación del borrado venció o no es válida. Vuelve a iniciarlo.',
          GPS_HISTORY_RESET:'El historial cambió en otro dispositivo. Sincroniza antes de volver a confirmar.'};
        throw Object.assign(Error(messages[detail]||(detail.startsWith('GPS_')?detail:'No se pudo ejecutar el servicio. Revisa el despliegue en Apps Script.')),{permanent:detail!=='GPS_BUSY'&&!/quota|too many|rate|timed out/i.test(detail)});
      }
      if(operation.done!==true||!operation.response?.result)throw Error('Google no confirmó la operación. Se reintentará con el mismo identificador.');
      return operation.response.result;
    }
    async function run(){
      clearTimeout(timer);if(!engine?.ready||clearing)return;
      try{await engine.sync();attempts=0;retry(engine.data.pending.some(p=>p.kind!=='name'||engine.features.names)?1500:60000);}
      catch(error){
        if(error.permanent){stop(error.message);return;}
        attempts++;status('Sin conexión confirmada. Cambios pendientes conservados; reintento automático.');
        retry(Math.min(300000,2000*2**Math.min(attempts,7))+Math.random()*1000);
      }
    }
    function changed(){
      if(applying||!engine?.ready)return;
      try{engine.observe(snapshot());retry();}catch{stop('No se pudo guardar la cola local. Exporta una copia antes de volver a conectar.');}
    }
    async function connect(response,session,native=false){
      if(session!==epoch)return;
      try{
        if(!native){acceptToken(response);autoBlocked=false;}
        if(!navigator.locks)throw Error('Este navegador no permite proteger la sincronización entre pestañas. Usa una versión actual.');
        const acquired=await new Promise((resolve,reject)=>{
          navigator.locks.request('control-gps-google-session',{ifAvailable:true},async lock=>{
            if(!lock){resolve(false);return;}
            await new Promise(release=>{tabRelease=release;resolve(true);});
          }).catch(reject);
        });
        if(!acquired)throw Error('Ya hay otra pestaña sincronizando. Desconéctala primero.');
        if(session!==epoch){if(tabRelease){tabRelease();tabRelease=null;}return;}
        engine=new root.GpsSync.Engine({storage:localStorage,send,status,resetHistory:async(cutoff,generation,erasedIds=[])=>{
          const current=snapshot();
          if(!Object.entries(current).some(([id,e])=>e.kind==='record'&&(e.value.timestamp<=cutoff||erasedIds.includes(id))))return;
          if(typeof clearHistoryBefore!=='function')throw Object.assign(Error('Recarga la aplicación para reflejar el borrado del historial.'),{permanent:true});
          const backupKey='gpsHistoryBeforeClearV1:'+generation;
          try{
            if(!localStorage.getItem(backupKey))localStorage.setItem(backupKey,localStorage.getItem('gpsTrackerState')||'{}');
            localStorage.setItem('gpsHistoryLastBackupV1',backupKey);$('googleHistoryBackupBtn').disabled=false;
          }catch{throw Object.assign(Error('No se pudo guardar una copia local antes de reflejar el borrado. Exporta tus datos y vuelve a conectar.'),{permanent:true});}
          applying=true;
          try{clearHistoryBefore(cutoff,erasedIds);if(save()===false)throw Error('No se pudo guardar el historial actualizado.');render();}
          finally{applying=false;}
        },apply:async events=>{
          applying=true;try{apply(events);if(save()===false)throw Error('No se pudo conservar la lectura en el almacenamiento local.');render();}finally{applying=false;}
        }});
        const health=await engine.bind();
        config={...config,clientId:service.clientId,deploymentId:service.deploymentId,loginHint:health.actor,consent:true};
        if(session!==epoch){engine.stop();return;}
        if(!localStorage.getItem(root.GpsSync.BACKUP))localStorage.setItem(root.GpsSync.BACKUP,localStorage.getItem('gpsTrackerState')||'{}');
        // Every state transfer starts with a persisted backup and durable queue.
        engine.observe(snapshot());persistConfig();$('googleConnectBtn').disabled=true;
        $('googleClearHistoryBtn').disabled=!engine.features.clearHistory;
        status('Cuenta autorizada. Sincronizando…');await run();
      }catch(error){stop('No conectado: '+error.message);}
    }
    async function resume(){
      if(!service||!config.consent||connecting||engine?.ready||autoBlocked&&!bridgeUrl)return;
      if(config.deploymentId&&config.deploymentId!==service.deploymentId){status('La conexión guardada corresponde a otro servicio. Datos locales conservados.');return;}
      connecting=true;$('googleConnectBtn').disabled=true;const session=++epoch;
      status('Recuperando tu sesión privada de Google…');
      try{
        if(bridgeUrl)await activateBridge(session);else await silentToken();
        await connect({},session,true);
      }
      catch(error){if(session===epoch)stop(error.message+(error.message.includes('Conectar con Google')?'':' Pulsa Conectar con Google si necesitas autorizar.'));}
      finally{connecting=false;if(session===epoch)$('googleConnectBtn').disabled=!!engine?.ready;}
    }
    $('googleConsent').checked=config.consent===true;$('googleAutoAddress').checked=config.autoAddress===true;
    $('googleConsent').addEventListener('change',()=>{
      config.consent=$('googleConsent').checked;persistConfig();
      if(!config.consent)stop();
      else if(!service)status('El propietario aún no ha activado el servicio de Google. Tus ubicaciones siguen guardadas localmente.');
      else resume();
    });
    $('googleAutoAddress').addEventListener('change',()=>{config.autoAddress=$('googleAutoAddress').checked;persistConfig();});
    $('googleConnectBtn').addEventListener('click',()=>{
      if(!$('googleConsent').checked){status('Autoriza primero el envío de tus ubicaciones a la hoja privada.');return;}
      if(!service){
        status('El propietario debe activar la conexión de Google una sola vez. No tienes que introducir códigos. Tus datos permanecen locales.');return;
      }
      const {clientId,deploymentId}=service;
      if(config.deploymentId&&config.deploymentId!==deploymentId&&localStorage.getItem(root.GpsSync.KEY)){
        status('Hay una conexión previa guardada. Usa otro perfil para otra hoja; no se mezclan historiales.');return;
      }
      config={...config,clientId,deploymentId,consent:true};
      if(!root.google?.accounts?.oauth2){loadGis().then(()=>status('Google preparado. Pulsa Conectar con Google de nuevo.')).catch(e=>status(e.message));return;}
      if(engine?.ready||connecting)return;
      bridge?.close();bridge=null;useBridge=false;
      const session=++epoch;
      const client=root.google.accounts.oauth2.initTokenClient({client_id:clientId,scope:scopes.join(' '),include_granted_scopes:false,...(config.loginHint?{login_hint:config.loginHint}:{}),
        callback:r=>connect(r,session),error_callback:()=>status('Se cerró o bloqueó la ventana de Google. La app sigue en modo local.')});
      client.requestAccessToken({prompt:''});
    });
    $('googleDisconnectBtn').addEventListener('click',()=>{
      const previous=token;delete config.loginHint;config.consent=false;config.autoAddress=false;persistConfig();$('googleConsent').checked=false;$('googleAutoAddress').checked=false;stop();
      if(previous&&root.google?.accounts?.oauth2)root.google.accounts.oauth2.revoke(previous,()=>{});
    });
    $('googleSyncBtn').addEventListener('click',()=>{if(engine?.ready)run();else status('Configura el servicio y conecta con Google primero.');});
    $('googleClearHistoryBtn').disabled=true;
    $('googleClearHistoryBtn').addEventListener('click',async()=>{
      if(!engine?.ready||!engine.features.clearHistory){status('Conecta con Google para borrar el historial de la hoja.');return;}
      if(engine.busy||clearing||geoBusy){status('Espera a que termine la operación actual.');return;}
      clearing=true;clearTimeout(timer);$('googleClearHistoryBtn').disabled=true;
      try{
        await engine.sync();
        const plan=await engine.request({action:'prepareHistoryClear'});
        if(!plan.ticket||!Number.isSafeInteger(plan.records))throw Error('No se pudo preparar el borrado.');
        if(!confirm('¿Borrar definitivamente '+plan.records+' registros GPS y sus '+plan.recordEvents+' versiones de Google Sheets? Se conservarán los favoritos y las direcciones. El historial anterior a este borrado también se retirará de los navegadores al reconectar. Las copias de seguridad no se borran.')){
          status('Borrado cancelado. El historial se conserva.');return;
        }
        if(prompt('Para confirmar el borrado remoto, escribe BORRAR HISTORIAL:')!=='BORRAR HISTORIAL'){
          status('Borrado cancelado. El historial se conserva.');return;
        }
        const result=await engine.clearHistory(plan.ticket);
        status('Historial borrado en Google Sheets y este navegador. Favoritos y direcciones conservados.');
        diagnostic('Se borraron '+result.removedRecords+' registros GPS de la hoja. Los favoritos y las direcciones se conservaron.');
      }catch(error){
        status('Borrado no confirmado: '+error.message+' Sincroniza para comprobar el estado antes de repetirlo.');
      }finally{
        clearing=false;$('googleClearHistoryBtn').disabled=!engine?.ready;retry(1500);
      }
    });
    function downloadBackup(raw,filename){
      if(!raw){status('Todavía no hay una copia guardada.');return;}
      try{const data=JSON.parse(raw);delete data.geoapifyKey;delete data.csvUrl;
        const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');
        a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }catch{status('No se pudo descargar la copia. Los datos locales se conservan.');}
    }
    $('googleBackupBtn').addEventListener('click',()=>downloadBackup(localStorage.getItem(root.GpsSync.BACKUP),'control-gps-antes-de-sincronizar.json'));
    $('googleHistoryBackupBtn').disabled=!localStorage.getItem('gpsHistoryLastBackupV1');
    $('googleHistoryBackupBtn').addEventListener('click',()=>downloadBackup(localStorage.getItem(localStorage.getItem('gpsHistoryLastBackupV1')),'control-gps-antes-de-borrar-historial.json'));
    function returned(){if(engine?.ready)run();else resume();}
    window.addEventListener('online',returned);
    window.addEventListener('pageshow',returned);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)returned();});
    window.addEventListener('storage',event=>{if(event.key==='gpsTrackerState'&&(token||useBridge))stop('Otra pestaña modificó los datos locales. Recarga esta página antes de reconectar.');});
    async function lookup(p,automatic=false){
      const report=message=>{status(message);if(!automatic)diagnostic(message);};
      if(!engine?.ready||(!token&&!useBridge)){if(!automatic)status('Conecta con Google para consultar la dirección.');return false;}
      if(geoBusy){if(!automatic)report('Ya hay una consulta de dirección en curso. Espera su resultado.');return false;}
      if(automatic&&(Date.now()-geoAt<60000||geoCount>=20))return false;
      if(!automatic&&!confirm('¿Enviar estas coordenadas a Google para consultar una dirección aproximada?')){report('Consulta de dirección cancelada.');return true;}
      geoBusy=true;geoAt=Date.now();geoCount++;
      report('Consultando dirección aproximada con Google…');
      const session=epoch,before=snapshot()['address|'+root.GpsSync.addressId(p)];
      try{
        const result=await send({action:'geocode',latitude:Number(p.latitude),longitude:Number(p.longitude)});
        if(session!==epoch||!engine?.ready)return true;
        // A correction made while Google was responding always wins locally.
        if(JSON.stringify(snapshot()['address|'+root.GpsSync.addressId(p)])!==JSON.stringify(before))return true;
        if(!result.address)throw Error('No se encontró dirección.');
        apply([{kind:'address',entityId:'address|'+root.GpsSync.addressId(p),value:result}]);save();render();
        diagnostic('Dirección aproximada de Google guardada. Verifica calle y número; puedes corregirla.');
      }catch(error){report('Dirección no disponible: '+error.message+'. Puedes introducirla manualmente.');}
      finally{geoBusy=false;}
      return true;
    }
    status(service
      ? 'Sincronización desactivada. Autoriza el envío y pulsa Conectar con Google.'
      : 'Sincronización local disponible. El propietario aún no ha activado el servicio privado de Google.');
    if(service&&config.consent)resume();
    function prepareLocalClear(){
      stop('Sincronización pausada al borrar información local. Reconectar recupera los registros remotos.');
      try{
        const data=JSON.parse(localStorage.getItem(root.GpsSync.KEY)||'null');
        if(data){data.cursor=0;data.observed={};data.revisions={};localStorage.setItem(root.GpsSync.KEY,JSON.stringify(data));}
        return true;
      }catch{status('No se pudo conservar el estado de recuperación. Descarga una copia antes de borrar.');return false;}
    }
    return {changed,stop,prepareLocalClear,lookup,newPoint:p=>{if(config.autoAddress&&engine?.ready&&!snapshot()['address|'+root.GpsSync.addressId(p)])lookup(p,true);},connected:()=>!!engine?.ready};
  }
  root.GpsGoogle={init};
})(window);


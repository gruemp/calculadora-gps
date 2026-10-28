/** API executable, never an anonymous Web App. All helpers are inside the ACL boundary. */
function gpsApi(request) {
  'use strict';
  var props=PropertiesService.getScriptProperties();
  var actor=String(Session.getEffectiveUser().getEmail()||'').toLowerCase();
  var owner=String(props.getProperty('GPS_OWNER_EMAIL')||'').toLowerCase();
  var allowed=String(props.getProperty('GPS_ALLOWED_EMAILS')||owner).toLowerCase().split(',').map(function(s){return s.trim();});
  if(!actor||!owner||allowed.indexOf(actor)<0)throw Error('GPS_FORBIDDEN');
  var sheetId=props.getProperty('GPS_SPREADSHEET_ID');
  if(!sheetId)throw Error('GPS_NOT_CONFIGURED');
  var book=SpreadsheetApp.openById(sheetId); // Executes as caller; Drive permissions still apply.
  var name='control_gps_eventos_v1';
  var headers=['secuencia','operacion_id','entidad_id','tipo','revision_base','fecha_servidor_iso','usuario','dispositivo','datos_json','conflicto'];
  var req=request||{}, action=req.action;
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(15000))throw Error('GPS_BUSY');
  try {
    var sheet=book.getSheetByName(name);
    if(action==='initialize'){
      if(actor!==owner)throw Error('GPS_FORBIDDEN');
      if(!sheet){sheet=book.insertSheet(name);sheet.getRange(1,1,1,headers.length).setValues([headers]);sheet.setFrozenRows(1);SpreadsheetApp.flush();}
    }
    if(!sheet)throw Error('GPS_SCHEMA_MISSING');
    if(JSON.stringify(sheet.getRange(1,1,1,headers.length).getValues()[0])!==JSON.stringify(headers))throw Error('GPS_SCHEMA_MISMATCH');
    var total=Math.max(0,sheet.getLastRow()-1);
    // Explicit bound: no unbounded growth silently approaching execution limits.
    if(total>50000)throw Error('GPS_ARCHIVE_REQUIRED');
    if(action==='status'||action==='initialize')return {service:'control-gps',version:1,dataset:sheetId,actor:actor,events:total};
    function clean(entity) {
      if(!entity||typeof entity!=='object'||Array.isArray(entity))throw Error('GPS_INVALID_ENTITY');
      var id=entity.entityId,kind=entity.kind,v=entity.value;
      if(typeof id!=='string'||id.length>180||!v||typeof v!=='object'||Array.isArray(v))throw Error('GPS_INVALID_ENTITY');
      if(kind==='record'||kind==='favorite'){
        if(typeof v.latitude!=='number'||!isFinite(v.latitude)||Math.abs(v.latitude)>90||typeof v.longitude!=='number'||!isFinite(v.longitude)||Math.abs(v.longitude)>180||!Number.isFinite(v.timestamp)||v.timestamp<=0||v.timestamp>8640000000000000)throw Error('GPS_INVALID_POINT');
        if(v.accuracy!==null&&(!Number.isFinite(v.accuracy)||v.accuracy<0))throw Error('GPS_INVALID_ACCURACY');
        if(id!==kind+'|'+[v.timestamp,v.latitude,v.longitude].join('|'))throw Error('GPS_INVALID_ID');
        var point={latitude:v.latitude,longitude:v.longitude,accuracy:v.accuracy,timestamp:v.timestamp};
        if(kind==='favorite'){point.label=String(v.label||'').slice(0,250);point.enabled=v.enabled!==false;}
        return {entityId:id,kind:kind,value:point};
      }
      if(kind==='address'){
        var coords=id.slice(8).split(',').map(Number);
        if(!id.startsWith('address|')||coords.length!==2||!coords.every(Number.isFinite)||Math.abs(coords[0])>90||Math.abs(coords[1])>180||id!=='address|'+coords[0].toFixed(6)+','+coords[1].toFixed(6))throw Error('GPS_INVALID_ADDRESS_ID');
        return {entityId:id,kind:kind,value:{address:String(v.address||'').slice(0,250),source:String(v.source||'manual').slice(0,80),quality:String(v.quality||'').slice(0,50),country:String(v.country||'').slice(0,100),department:String(v.department||'').slice(0,100),city:String(v.city||'').slice(0,100),street:String(v.street||'').slice(0,150),number:String(v.number||'').slice(0,30)}};
      }
      throw Error('GPS_INVALID_KIND');
    }
    function event(row){return {seq:Number(row[0]),operationId:String(row[1]),entityId:String(row[2]),kind:String(row[3]),base:Number(row[4]),serverTime:String(row[5]),device:String(row[7]),value:JSON.parse(row[8]),conflict:row[9]===true};}
    if(action==='list'){
      var cursor=req.cursor;
      if(!Number.isSafeInteger(cursor)||cursor<0||cursor>total)throw Error('GPS_INVALID_CURSOR');
      var amount=Math.min(200,total-cursor);
      var events=amount?sheet.getRange(cursor+2,1,amount,headers.length).getValues().map(event):[];
      return {events:events,cursor:cursor+amount,more:cursor+amount<total};
    }
    if(action==='push'){
      if(!Array.isArray(req.operations)||req.operations.length>50||!req.operations.length)throw Error('GPS_INVALID_BATCH');
      // Validate the entire batch before any write. Serialized JSON cannot become a Sheet formula.
      var ops=req.operations.map(function(op){
        if(!op||!/^[A-Za-z0-9_-]{10,100}$/.test(op.operationId)||!/^[A-Za-z0-9_-]{10,100}$/.test(op.device)||!Number.isSafeInteger(op.base)||op.base<0)throw Error('GPS_INVALID_OPERATION');
        return Object.assign(clean(op),{operationId:op.operationId,device:op.device,base:op.base});
      });
      var rows=total?sheet.getRange(2,1,total,headers.length).getValues():[];
      var ids={},versions={};
      rows.forEach(function(r){ids[r[1]]=r;versions[r[2]]=Number(r[0]);});
      var fresh=[],ack=[];
      ops.forEach(function(op){
        if(ids[op.operationId]){
          var old=ids[op.operationId];
          if(old[2]!==op.entityId||old[3]!==op.kind||old[8]!==JSON.stringify(op.value)||Number(old[4])!==op.base||old[7]!==op.device)throw Error('GPS_OPERATION_REUSED');
          ack.push(op.operationId);return;
        }
        var seq=total+fresh.length+1;
        var row=[seq,op.operationId,op.entityId,op.kind,op.base,new Date().toISOString(),actor,op.device,JSON.stringify(op.value),op.base!==(versions[op.entityId]||0)];
        fresh.push(row);ids[op.operationId]=row;versions[op.entityId]=seq;ack.push(op.operationId);
      });
      if(total+fresh.length>50000)throw Error('GPS_ARCHIVE_REQUIRED');
      if(fresh.length){sheet.getRange(total+2,1,fresh.length,headers.length).setValues(fresh);SpreadsheetApp.flush();}
      return {ack:ack};
    }
    if(action==='geocode'){
      if(props.getProperty('GPS_GEOCODE_ENABLED')!=='true')throw Error('GPS_GEOCODE_DISABLED');
      var lat=req.latitude,lng=req.longitude;
      if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lng)||Math.abs(lng)>180)throw Error('GPS_INVALID_POINT');
      // Global daily budget shared across callers; increment before the upstream call.
      var day=new Date().toISOString().slice(0,10),budgetKey='GPS_GEO_BUDGET';
      var usage=JSON.parse(props.getProperty(budgetKey)||'null')||{day:day,count:0};
      if(usage.day!==day)usage={day:day,count:0};
      var limit=Math.min(1000,Math.max(1,Number(props.getProperty('GPS_GEOCODE_DAILY_LIMIT'))||100));
      if(usage.count>=limit)throw Error('GPS_GEOCODE_QUOTA');
      usage.count++;props.setProperty(budgetKey,JSON.stringify(usage));
      var response=Maps.newGeocoder().setLanguage('es').reverseGeocode(lat,lng);
      if(response.status!=='OK'||!response.results||!response.results.length)throw Error('GPS_ADDRESS_UNAVAILABLE');
      var result=response.results[0],components=result.address_components||[];
      function component(type){var c=components.find(function(c){return c.types.indexOf(type)>=0;});return c?c.long_name:'';}
      var country=component('country'),department=component('administrative_area_level_1'),city=component('locality')||component('administrative_area_level_2'),street=component('route');
      // Reuse LoNecesito's rule: a plus code or region is not a street address.
      var address=street||Array.isArray(result.types)&&result.types.indexOf('street_address')>=0?String(result.formatted_address||''):'Zona aproximada: '+[city,department,country].filter(Boolean).join(', ');
      if(!street&&!city&&!department&&!country)throw Error('GPS_ADDRESS_UNAVAILABLE');
      return {address:address.slice(0,250),source:'Google Maps (aproximada)',quality:result.geometry&&result.geometry.location_type||'UNKNOWN',country:country,department:department,city:city,street:street,number:street?component('street_number'):''};
    }
    throw Error('GPS_INVALID_ACTION');
  }finally{lock.releaseLock();}
}
/** Run once in the editor after configuring private Script Properties. */
function gpsInitialize(){return gpsApi({action:'initialize'});}

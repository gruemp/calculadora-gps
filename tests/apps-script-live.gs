/** Editor-only diagnostic for the explicitly selected EMPTY test sheet.
 * Enable GPS_ALLOW_SELF_TEST=true once. It resets to false even on failure.
 * Public Times Square fixture; no device GPS, user history or secrets.
 */
function gpsSelfTest() {
  var initial=gpsApi({action:'status'}); // Enforces the same account ACL first.
  var props=PropertiesService.getScriptProperties();
  if(props.getProperty('GPS_ALLOW_SELF_TEST')!=='true')throw Error('GPS_SELF_TEST_DISABLED');
  try {
    if(initial.events!==0)throw Error('GPS_SELF_TEST_REQUIRES_EMPTY_SHEET');
    function check(ok,label){if(!ok)throw Error('GPS_SELF_TEST_FAILED: '+label);}
    var p={latitude:40.758,longitude:-73.9855,accuracy:null,timestamp:1577836800000};
    var key=[p.timestamp,p.latitude,p.longitude].join('|');
    var aid='address|40.758000,-73.985500';
    var geo=gpsApi({action:'geocode',latitude:p.latitude,longitude:p.longitude});
    check(!!geo.address&&geo.source==='Google Maps (aproximada)','real reverse geocoding');
    var ops=[
      {operationId:'gps_live_test_record_v1',device:'gps_live_test_editor',base:0,entityId:'record|'+key,kind:'record',value:p},
      {operationId:'gps_live_test_favorite_v1',device:'gps_live_test_editor',base:0,entityId:'favorite|'+key,kind:'favorite',value:Object.assign({},p,{label:'ENSAYO TECNICO - Times Square publico',enabled:true})},
      {operationId:'gps_live_test_address_v1',device:'gps_live_test_editor',base:0,entityId:aid,kind:'address',value:geo}
    ];
    var first=gpsApi({action:'push',operations:ops});
    check(first.ack.length===3,'write acknowledgement');
    var afterWrite=gpsApi({action:'status'}).events;
    var repeat=gpsApi({action:'push',operations:ops});
    check(repeat.ack.length===3&&gpsApi({action:'status'}).events===afterWrite,'idempotent retry');
    var page=gpsApi({action:'list',cursor:0});
    check(page.events.length===3&&page.cursor===3&&!page.more,'read and cursor');
    check(page.events[0].value.latitude===p.latitude&&page.events[0].value.accuracy===null,'point fidelity');
    var manual={operationId:'gps_live_test_manual_v1',device:'gps_live_test_editor',base:3,entityId:aid,kind:'address',value:{address:'Times Square - etiqueta MANUAL DE ENSAYO',source:'manual'}};
    gpsApi({action:'push',operations:[manual]});
    var stale=Object.assign({},manual,{operationId:'gps_live_test_conflict_v1',base:3,value:{address:'Times Square - segunda etiqueta DE ENSAYO',source:'manual'}});
    gpsApi({action:'push',operations:[stale]});
    var removal={operationId:'gps_live_test_unfavorite_v1',device:'gps_live_test_editor',base:2,entityId:'favorite|'+key,kind:'favorite',value:Object.assign({},p,{label:'ENSAYO TECNICO - Times Square publico',enabled:false})};
    gpsApi({action:'push',operations:[removal]});
    var all=gpsApi({action:'list',cursor:0});
    check(all.events.length===6&&all.events[4].conflict===true,'conflict and retained versions');
    check(all.events[3].value.source==='manual'&&all.events[2].value.address===geo.address,'manual correction preserves prior address');
    check(all.events[5].value.enabled===false&&all.events[1].value.enabled===true,'favorite changes preserve prior value');
    var rejected=false;
    try {gpsApi({action:'push',operations:[Object.assign({},ops[0],{operationId:'gps_live_test_invalid_v1',value:Object.assign({},p,{latitude:91})})]});}
    catch(e){rejected=String(e).indexOf('GPS_INVALID_POINT')>=0;}
    check(rejected&&gpsApi({action:'status'}).events===6,'invalid input has no writes');
    var report={passed:true,execution:'REAL_APPS_SCRIPT',initialEvents:0,finalEvents:6,acknowledged:true,idempotentRetry:true,readAndCursor:true,manualCorrection:true,conflictHistory:true,favoriteRemoval:true,invalidInputRejected:true,geocoder:geo.source,addressQuality:geo.quality,hasStreet:!!geo.street,hasNumber:!!geo.number,fixture:'PUBLIC_TIMES_SQUARE_NOT_DEVICE_GPS'};
    console.log(JSON.stringify(report));
    return report;
  } finally {props.setProperty('GPS_ALLOW_SELF_TEST','false');}
}

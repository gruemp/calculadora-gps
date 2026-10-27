/* Control GPS - fichas de ubicación con exportación local, sin servidor. */
(function (global) {
'use strict';
const e=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=(s,n=400)=>String(s||'').trim().slice(0,n);
const key=p=>Number(p.timestamp)+'|'+Number(p.latitude).toFixed(6)+'|'+Number(p.longitude).toFixed(6);
const coords=p=>Number(p.latitude).toFixed(6)+', '+Number(p.longitude).toFixed(6);
const gmaps=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(coords(p));
const directions=p=>'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(coords(p));
const osm=p=>'https://www.openstreetmap.org/?mlat='+p.latitude+'&mlon='+p.longitude+'#map=17/'+p.latitude+'/'+p.longitude;
const when=p=>new Date(p.timestamp).toLocaleString('es-CO',{dateStyle:'full',timeStyle:'short'});
const state={p:null,kind:'registro',getMeta:()=>({}),setMeta:()=>{}};
function phone(value){
  const v=clean(value,30);if(!v)return '';
  if(!/^\+?[0-9 ()-]{7,26}$/.test(v))throw Error('Número inválido. Ejemplo: +57 300 123 4567.');
  const digits=v.replace(/\D/g,'');
  if(digits.length<7||digits.length>15)throw Error('El número debe tener entre 7 y 15 dígitos.');
  return (v.startsWith('+')?'+':'')+digits;
}
function fields(){return {name:clean(e('gpsName').value,90),contactName:clean(e('gpsContact').value,90),contactPhone:clean(e('gpsPhone').value,30),address:clean(e('gpsAddress').value,180),notes:clean(e('gpsNotes').value,600)};}
function details(fromForm=false){
 const x=fromForm?fields():state.getMeta(key(state.p))||{};
 const d={name:clean(x.name,90),contactName:clean(x.contactName,90),contactPhone:clean(x.contactPhone,30),address:clean(x.address,180),notes:clean(x.notes,600)};
 const number=d.contactPhone?phone(d.contactPhone):'';
 return {...d,number,p:state.p,kind:state.kind,maps:gmaps(state.p),route:directions(state.p),osm:osm(state.p),wa:number?'https://api.whatsapp.com/send?phone='+number.replace(/\D/g,'')+'&text='+encodeURIComponent('Hola. Te contacto sobre '+(d.name||'esta ubicación')+': '+gmaps(state.p)):''};
}
function textCard(x){
 const a=['FICHA DE UBICACIÓN | CONTROL GPS','','UBICACIÓN: '+(x.name||'Punto GPS'),
   'TIPO: '+(x.kind==='favorito'?'Favorito':'Registro de ubicación'),
   'FECHA Y HORA: '+when(x.p),'COORDENADAS: '+coords(x.p),
   'PRECISIÓN: '+(Number.isFinite(x.p.accuracy)?'±'+Math.round(x.p.accuracy)+' m':'No informada')];
 if(x.address)a.push('DIRECCIÓN / REFERENCIA: '+x.address);
 if(x.notes)a.push('OBSERVACIONES: '+x.notes);
 if(x.contactName)a.push('CONTACTO: '+x.contactName);
 if(x.number)a.push('TELÉFONO: '+x.number);
 a.push('','VER EN GOOGLE MAPS:',x.maps,'','CÓMO LLEGAR:',x.route,'','VER EN OPENSTREETMAP:',x.osm);
 if(x.number)a.push('','LLAMAR:','tel:'+x.number);
 if(x.wa)a.push('','WHATSAPP:',x.wa);
 a.push('','Generado por Control GPS');return a.join('\n');
}
function htmlCard(x,complete=false){
 const rows=[['Tipo',x.kind==='favorito'?'Favorito':'Registro GPS'],['Fecha y hora',when(x.p)],['Coordenadas',coords(x.p)],['Precisión',Number.isFinite(x.p.accuracy)?'±'+Math.round(x.p.accuracy)+' m':'No informada'],['Dirección / referencia',x.address],['Observaciones',x.notes],['Contacto',x.contactName],['Teléfono',x.number]].filter(r=>r[1]);
 const a=(url,label)=>'<p><a href="'+safe(url)+'" target="_blank" rel="noopener noreferrer">'+safe(label)+'</a></p>';
 const body='<article style="max-width:690px;margin:0 auto;font:16px/1.55 system-ui,Arial;background:white;border-radius:23px;overflow:hidden;box-shadow:0 12px 55px #10382425;color:#1b4235">'+
 '<header style="background:linear-gradient(120deg,#113e32,#197858);color:#fff;padding:35px"><small style="letter-spacing:2px;font-weight:800">CONTROL GPS · UBICACIÓN</small><h1 style="font-size:29px;margin:16px 0 5px">'+safe(x.name||'Punto GPS')+'</h1><div>'+safe(coords(x.p))+'</div></header>'+
 '<section style="padding:30px">'+rows.map(r=>'<p style="border-bottom:1px solid #e2ede6;padding:0 0 11px;margin:0 0 12px"><strong>'+safe(r[0])+':</strong> '+safe(r[1])+'</p>').join('')+
 a(x.maps,'Abrir en Google Maps')+a(x.route,'Cómo llegar')+a(x.osm,'Abrir en OpenStreetMap')+
 (x.number?a('tel:'+x.number,'Llamar al contacto'): '')+(x.wa?a(x.wa,'Escribir por WhatsApp'):'')+'</section>'+
 '<footer style="background:#f0f7f1;padding:20px 30px;color:#547263;font-size:12px">Ficha generada por Control GPS</footer></article>';
 return complete?'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+safe(x.name||'Ubicación GPS')+'</title></head><body style="padding:22px;background:#eef6f0">'+body+'</body></html>':body;
}
function status(s,isError=false){e('gpsFichaStatus').textContent=s;e('gpsFichaStatus').dataset.error=isError?'yes':'no';}
function create(){
 if(e('gpsFicha'))return;
 const dlg=document.createElement('dialog');dlg.id='gpsFicha';dlg.className='gps-ficha';
 dlg.innerHTML=
 '<div class="gf-header"><div><small>CONTROL GPS · FICHA COMPARTIBLE</small><h2>Ficha de ubicación</h2><p>Completa el contacto y comparte los datos del punto.</p></div><button id="gfClose" type="button" aria-label="Cerrar">×</button></div>'+
 '<div class="gf-layout"><div class="gf-editor"><h3>Datos de la ubicación</h3>'+
 '<label>Nombre de esta ubicación<input id="gpsName" maxlength="90" placeholder="Oficina, casa, cliente…"></label>'+
 '<label>Nombre del contacto<input id="gpsContact" maxlength="90" placeholder="Nombre y apellido"></label>'+
 '<label>Teléfono (con indicativo)<input type="tel" id="gpsPhone" maxlength="30" placeholder="+57 300 123 4567"></label>'+
 '<label>Dirección o referencia<input id="gpsAddress" maxlength="180" placeholder="Punto de encuentro, dirección…"></label>'+
 '<label>Observaciones<textarea id="gpsNotes" maxlength="600" rows="3" placeholder="Información adicional"></textarea></label>'+
 '<button class="gf-btn gf-save" id="gfSave" type="button">Guardar datos de este punto</button>'+
 '<p class="gf-note">El contacto solo se comparte cuando eliges una opción. Se guarda localmente y se incluye en tus copias JSON.</p></div>'+
 '<div class="gf-right"><article class="gf-preview"><header class="gf-preview-top"><span>CONTROL GPS <i>/ LOCALIZACIÓN</i></span><div class="gf-logo">⌖</div><small id="gfKind">REGISTRO</small><h3 id="gfTitle"></h3><div id="gfCoords"></div></header>'+
 '<div class="gf-preview-body"><div class="gf-data"><span>FECHA Y HORA</span><strong id="gfDate"></strong></div><div class="gf-data"><span>PRECISIÓN</span><strong id="gfAccuracy"></strong></div>'+
 '<div class="gf-data" id="gfAddressRow"><span>REFERENCIA</span><strong id="gfAddress"></strong></div><div class="gf-data" id="gfNotesRow"><span>OBSERVACIONES</span><strong id="gfNotes"></strong></div>'+
 '<div class="gf-contact" id="gfContactBox"><small>PERSONA DE CONTACTO</small><strong id="gfContactName"></strong><a id="gfCall"></a><a id="gfWhatsapp" rel="noopener noreferrer" target="_blank">Escribir por WhatsApp</a></div>'+
 '<div class="gf-links"><a id="gfMaps" rel="noopener noreferrer" target="_blank">Google Maps ↗</a><a id="gfDirections" rel="noopener noreferrer" target="_blank">Cómo llegar ↗</a><a id="gfOsm" rel="noopener noreferrer" target="_blank">OpenStreetMap ↗</a></div></div>'+
 '<footer class="gf-footer"><span>INFORMACIÓN DE UBICACIÓN</span><b>CONTROL GPS</b></footer></article>'+
 '<div class="gf-actions"><button class="gf-btn" id="gfCopy">Copiar texto clicable</button><button class="gf-btn" id="gfShareText">Compartir texto</button>'+
 '<button class="gf-btn gf-wa" id="gfShareWa">Enviar por WhatsApp</button><button class="gf-btn" id="gfHtml">Descargar HTML clicable</button>'+
 '<button class="gf-btn gf-png" id="gfPng">Descargar PNG</button><button class="gf-btn gf-png" id="gfSharePng">Compartir PNG</button></div>'+
 '<p id="gpsFichaStatus" class="gf-status" role="status" aria-live="polite"></p>'+
 '<p class="gf-note">En el texto y HTML los enlaces se pueden pulsar. Un PNG es una imagen y sus enlaces no son clicables.</p></div></div>';
 document.body.append(dlg);
 e('gfClose').addEventListener('click',()=>dlg.close());
 dlg.addEventListener('click',ev=>{if(ev.target===dlg)dlg.close();});
 ['gpsName','gpsContact','gpsPhone','gpsAddress','gpsNotes'].forEach(id=>e(id).addEventListener('input',()=>{
   try{preview(details(true));status('Pulsa Guardar para conservar los cambios.');}
   catch{status('Verifica los datos del teléfono.',true);}
 }));
 e('gfSave').addEventListener('click',()=>{try{save();status('Contacto y datos guardados para esta ubicación.');}catch(err){status(err.message,true);}});
 function action(id,fn){e(id).addEventListener('click',async()=>{try{const x=save();await fn(x);}catch(err){if(err.name!=='AbortError')status(err.message||'No se pudo completar la acción.',true);}});}
 action('gfCopy',async x=>{
   const plain=textCard(x);
   if(navigator.clipboard&&navigator.clipboard.write&&typeof ClipboardItem==='function'){
     try{await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([plain],{type:'text/plain'}),'text/html':new Blob([htmlCard(x)],{type:'text/html'})})]);status('Copiado con enlaces clicables para aplicaciones compatibles.');return;}catch{}
   }
   if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(plain);
   else{const a=document.createElement('textarea');a.value=plain;document.body.append(a);a.select();const ok=document.execCommand('copy');a.remove();if(!ok)throw Error('No se pudo copiar.');}
   status('Texto copiado. Los enlaces completos son reconocidos por WhatsApp y otras aplicaciones.');
 });
 action('gfShareText',async x=>{
   if(navigator.share){await navigator.share({title:x.name||'Ficha de ubicación',text:textCard(x)});status('Ficha de texto enviada al menú de compartir.');}
   else{window.open('https://api.whatsapp.com/send?text='+encodeURIComponent(textCard(x)),'_blank','noopener,noreferrer');status('Se abrió WhatsApp como alternativa.');}
 });
 action('gfShareWa',async x=>{window.open('https://api.whatsapp.com/send?text='+encodeURIComponent(textCard(x)),'_blank','noopener,noreferrer');status('Se abrió WhatsApp.');});
 action('gfHtml',async x=>{download(new Blob([htmlCard(x,true)],{type:'text/html;charset=utf-8'}),'ficha-ubicacion-'+x.p.timestamp+'.html');status('Ficha HTML descargada con enlaces pulsables.');});
 action('gfPng',async x=>{download(await png(x),'ficha-ubicacion-'+x.p.timestamp+'.png');status('PNG descargado.');});
 action('gfSharePng',async x=>{
   const blob=await png(x),fileName='ficha-ubicacion-'+x.p.timestamp+'.png';
   if(typeof File==='function'&&navigator.share&&navigator.canShare){
     const file=new File([blob],fileName,{type:'image/png'});
     if(navigator.canShare({files:[file]})){await navigator.share({title:x.name||'Control GPS',text:x.maps,files:[file]});status('Ficha enviada al menú de compartir.');return;}
   }
   download(blob,fileName);status('El dispositivo no permite compartir archivos PNG directamente. Se descargó la imagen.');
 });
}
function save(){const x=details(true);state.setMeta(key(state.p),fields());preview(x);return x;}
function preview(x){
 e('gfKind').textContent=x.kind==='favorito'?'UBICACIÓN FAVORITA':'REGISTRO GPS';
 e('gfTitle').textContent=x.name||(x.kind==='favorito'?'Ubicación favorita':'Punto GPS');
 e('gfCoords').textContent=coords(x.p);e('gfDate').textContent=when(x.p);
 e('gfAccuracy').textContent=Number.isFinite(x.p.accuracy)?'±'+Math.round(x.p.accuracy)+' m':'No informada';
 e('gfAddressRow').hidden=!x.address;e('gfAddress').textContent=x.address;
 e('gfNotesRow').hidden=!x.notes;e('gfNotes').textContent=x.notes;
 e('gfContactBox').hidden=!x.contactName&&!x.number;
 e('gfContactName').textContent=x.contactName||'Contacto de la ubicación';
 e('gfCall').hidden=!x.number;e('gfCall').textContent=x.number?'Llamar: '+x.number:'';
 if(x.number)e('gfCall').href='tel:'+x.number;
 e('gfWhatsapp').hidden=!x.wa;if(x.wa)e('gfWhatsapp').href=x.wa;
 e('gfMaps').href=x.maps;e('gfDirections').href=x.route;e('gfOsm').href=x.osm;
}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),12000);}
function wrap(ctx,text,width){
 const result=[];for(const paragraph of String(text).split('\n')){
 let line='';for(const word of paragraph.split(/\s+/)){
   let candidate=line?line+' '+word:word;
   if(ctx.measureText(candidate).width>width&&line){result.push(line);line=word;}else line=candidate;
   if(ctx.measureText(line).width>width){let part='';for(const letter of line){if(part&&ctx.measureText(part+letter).width>width){result.push(part);part='';}part+=letter;}line=part;}
 }if(line)result.push(line);
 }return result.length?result:[''];
}
function rounded(ctx,x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);ctx.closePath();}
async function png(x){
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Este navegador no puede generar imágenes PNG.');
 const entries=[['UBICACIÓN',x.name||'Punto GPS'],['TIPO',x.kind==='favorito'?'Favorito':'Registro GPS'],['FECHA Y HORA',when(x.p)],['COORDENADAS',coords(x.p)],['PRECISIÓN',Number.isFinite(x.p.accuracy)?'±'+Math.round(x.p.accuracy)+' metros':'No informada'],['REFERENCIA',x.address],['OBSERVACIONES',x.notes],['CONTACTO',x.contactName],['TELÉFONO',x.number],['GOOGLE MAPS',x.maps],['CÓMO LLEGAR',x.route],['OPENSTREETMAP',x.osm],['WHATSAPP',x.wa]].filter(row=>row[1]);
 const data=entries.map(row=>{const f=['GOOGLE MAPS','CÓMO LLEGAR','OPENSTREETMAP','WHATSAPP'].includes(row[0])?19:29;ctx.font=f+'px system-ui';const lines=wrap(ctx,row[1],900);return{label:row[0],lines,font:f,height:34+lines.length*(f+12)+24};});
 const w=1080,h=320+data.reduce((t,r)=>t+r.height,0)+160;
 if(h>14000)throw Error('Demasiado contenido para crear un PNG.');
 canvas.width=w;canvas.height=h;
 const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#eff6f1');gradient.addColorStop(1,'#e2f0e8');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
 ctx.shadowColor='#173d332c';ctx.shadowBlur=32;ctx.shadowOffsetY=14;ctx.fillStyle='#fff';rounded(ctx,38,38,1004,h-76,34);ctx.fill();ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 ctx.save();rounded(ctx,38,38,1004,240,34);ctx.clip();const grad=ctx.createLinearGradient(40,40,1040,250);grad.addColorStop(0,'#123f34');grad.addColorStop(1,'#208466');ctx.fillStyle=grad;ctx.fillRect(38,38,1004,240);ctx.restore();
 ctx.fillStyle='#d4ecde';ctx.font='bold 22px system-ui';ctx.fillText('CONTROL GPS   /   FICHA DE UBICACIÓN',90,102);
 ctx.fillStyle='#fff';ctx.font='bold 49px system-ui';ctx.fillText('Comparte el lugar exacto',90,176);
 ctx.font='bold 23px system-ui';ctx.fillStyle='#d1eadd';ctx.fillText('LOCALIZACIÓN · '+(x.kind==='favorito'?'FAVORITO':'REGISTRO GPS'),90,229);
 let y=320;
 for(const row of data){
   ctx.font='bold 19px system-ui';ctx.fillStyle='#668573';ctx.fillText(row.label,90,y);y+=36;
   ctx.font=row.font+'px system-ui';ctx.fillStyle='#1e4436';for(const line of row.lines){ctx.fillText(line,90,y);y+=row.font+12;}
   y+=10;ctx.strokeStyle='#e0eae3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(90,y);ctx.lineTo(990,y);ctx.stroke();y+=20;
 }
 ctx.font='bold 25px system-ui';ctx.fillStyle='#1d6d4e';ctx.fillText('CONTROL GPS',90,h-110);
 ctx.font='20px system-ui';ctx.fillStyle='#6f8a7a';ctx.fillText('Para abrir enlaces, comparte también la versión de texto o HTML.',90,h-74);
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('No se pudo generar el PNG.')),'image/png'));
}
function open(point,kind='registro'){
 if(!point||!Number.isFinite(Number(point.latitude))||!Number.isFinite(Number(point.longitude)))return;
 create();state.p={latitude:Number(point.latitude),longitude:Number(point.longitude),accuracy:point.accuracy==null?null:Number(point.accuracy),timestamp:Number(point.timestamp)};state.kind=kind;
 const m=state.getMeta(key(state.p))||{};
 e('gpsName').value=m.name||(kind==='favorito'&&point.label?String(point.label):'');
 e('gpsContact').value=m.contactName||'';e('gpsPhone').value=m.contactPhone||'';
 e('gpsAddress').value=m.address||'';e('gpsNotes').value=m.notes||'';
 preview(details(true));status('Ficha preparada. Puedes editar, guardar, copiar o compartir.');
 const dialog=e('gpsFicha');if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
}
global.GpsCards={init(x){if(x?.getMeta)state.getMeta=x.getMeta;if(x?.setMeta)state.setMeta=x.setMeta;},open,key};
})(window);

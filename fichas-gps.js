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

const shareCss="\n.sg-card{max-width:960px;margin:0 auto;border:1px solid #d7e9dd;background:#fff;color:#173b32;font:16px/1.5 system-ui,Arial,sans-serif;border-radius:22px;overflow:hidden;box-shadow:0 14px 38px #0c352a1d;overflow-wrap:anywhere}\n.sg-card *{box-sizing:border-box}.sg-hero{background:linear-gradient(115deg,#0c493a,#137255);padding:28px 32px;color:#fff}\n.sg-eyebrow{display:block;color:#bcf0cd;letter-spacing:.16em;font-size:12px;font-weight:850}\n.sg-hero h1{margin:12px 0 8px;font-size:clamp(24px,4vw,40px);line-height:1.16;color:white}\n.sg-hero p{margin:0;color:#d9f6e5;font-size:14px}\n.sg-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.92fr);gap:16px;padding:19px}\n.sg-panel{background:#edf7f2;border:1px solid #d8e9df;border-radius:15px;padding:21px;min-width:0}\n.sg-title{margin:0 0 15px;font-size:14px;font-weight:900;color:#176549;letter-spacing:.07em}\n.sg-field{margin:0;padding:13px 0;border-top:1px solid #d7e6dc}.sg-field:first-of-type{border-top:0;padding-top:0}\n.sg-field dt{margin:0 0 4px;font-size:11px;font-weight:850;letter-spacing:.07em;color:#608272}\n.sg-field dd{margin:0;font-size:17px;font-weight:650;color:#204638;white-space:pre-wrap;overflow-wrap:anywhere}\n.sg-actions{display:flex;flex-direction:column;gap:9px}\n.sg-action{display:flex;align-items:center;gap:12px;padding:13px 14px;min-height:54px;border:1px solid #d3e6da;border-radius:12px;background:white;text-decoration:none!important;color:#125c44!important;font-size:15px;font-weight:800;transition:background .15s}\n.sg-action:hover,.sg-action:focus-visible{background:#ddf4e5}.sg-symbol{width:31px;height:31px;border-radius:50%;display:inline-flex;flex-shrink:0;align-items:center;justify-content:center;background:#e0efe7;color:#135f46;font-weight:900}\n.sg-action.sg-wa .sg-symbol{background:#188c51;color:white}.sg-action.sg-call .sg-symbol{background:#0e594a;color:white}.sg-arrow{margin-left:auto;font-size:20px;color:#679785}\n.sg-secondary{margin:0 19px 18px}.sg-secondary .sg-panel{margin-bottom:13px;background:#f3f9f5}\n.sg-secondary .sg-field{border:0;padding:0}.sg-footer{border-top:1px solid #dae9df;background:#f4f9f5;padding:17px 28px;color:#567967;font-size:12px;display:flex;justify-content:space-between;gap:16px}\n.sg-footer strong{color:#155a40}.sg-card a:focus-visible{outline:3px solid #35a875;outline-offset:2px}\n@media(max-width:660px){.sg-hero{padding:22px}.sg-layout{grid-template-columns:1fr;padding:12px;gap:12px}.sg-panel{padding:16px}.sg-secondary{margin:0 12px 12px}.sg-footer{padding:15px 18px}.sg-field dd{font-size:15px}.sg-action{font-size:14px}}\n";
function htmlCard(x,complete=false){
 const h=safe;
 const action=(url,label,symbol,cls='')=>'<a class="sg-action '+cls+'" href="'+h(url)+'" target="_blank" rel="noopener noreferrer"><span class="sg-symbol" aria-hidden="true">'+symbol+'</span><span>'+h(label)+'</span><span class="sg-arrow" aria-hidden="true">↗</span></a>';
 const field=(label,value)=>'<dl class="sg-field"><dt>'+h(label)+'</dt><dd>'+h(value)+'</dd></dl>';
 const title=x.name||(x.kind==='favorito'?'Ubicación favorita':'Punto GPS');
 const html='<style>'+shareCss+'</style>'+
 '<article class="sg-card" aria-label="Ficha GPS de '+h(title)+'">'+
 '<header class="sg-hero"><span class="sg-eyebrow">⌖ CONTROL GPS · '+(x.kind==='favorito'?'FAVORITO':'REGISTRO DE UBICACIÓN')+'</span><h1>'+h(title)+'</h1><p>◷ '+h(when(x.p))+'</p></header>'+
 '<div class="sg-layout"><section class="sg-panel"><h2 class="sg-title">⌖ DATOS DE LA UBICACIÓN</h2>'+
 field('Coordenadas (latitud, longitud)',coords(x.p))+
 field('Precisión GPS',Number.isFinite(x.p.accuracy)?'± '+Math.round(x.p.accuracy)+' m':'No informada')+
 (x.address?field('Dirección o referencia',x.address):'')+
 '</section><section class="sg-panel"><h2 class="sg-title">↗ ACCIONES INTERACTIVAS</h2><nav class="sg-actions" aria-label="Acciones de la ficha">'+
 action(x.maps,'Ver en Google Maps','⌖')+
 action(x.route,'Cómo llegar','➤')+
 action(x.osm,'Abrir OpenStreetMap','▤')+
 (x.number?action('tel:'+x.number,'Llamar al contacto','☎','sg-call'):'')+
 (x.wa?action(x.wa,'Escribir por WhatsApp','✆','sg-wa'):'')+
 '</nav></section></div>'+
 ((x.contactName||x.number)?'<div class="sg-secondary"><section class="sg-panel"><h2 class="sg-title">♟ CONTACTO ASOCIADO</h2>'+
 (x.contactName?field('Nombre',x.contactName):'')+(x.number?field('Teléfono',x.number):'')+
 '</section></div>':'')+
 (x.notes?'<div class="sg-secondary"><section class="sg-panel"><h2 class="sg-title">▤ OBSERVACIONES</h2>'+field('Información adicional',x.notes)+'</section></div>':'')+
 '<footer class="sg-footer"><strong>CONTROL GPS</strong><span>Ficha compartida · Datos de la ubicación registrada</span></footer></article>';
 if(!complete)return html;
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+h(title)+' · Control GPS</title></head><body style="margin:0;padding:clamp(10px,3vw,32px);background:#eff6f1">'+html+'</body></html>';
}
function sharePayload(x){
 return {lat:x.p.latitude,lon:x.p.longitude,t:x.p.timestamp,acc:Number.isFinite(x.p.accuracy)?x.p.accuracy:null,k:x.kind==='favorito'?'f':'r',n:x.name,c:x.contactName,p:x.contactPhone,a:x.address,o:x.notes};
}
function fromPayload(p){
 if(!p||typeof p!=='object')throw Error('La ficha no contiene datos reconocibles.');
 const lat=Number(p.lat),lon=Number(p.lon),time=Number(p.t),acc=p.acc==null?null:Number(p.acc);
 if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180||!Number.isFinite(time)||time<0||time>8640000000000000)throw Error('Coordenadas o fecha inválidas en la ficha.');
 const point={latitude:lat,longitude:lon,timestamp:time,accuracy:Number.isFinite(acc)&&acc>=0?acc:null};
 const name=clean(p.n,90),contactName=clean(p.c,90),contactPhone=clean(p.p,30),address=clean(p.a,180),notes=clean(p.o,600);
 const number=contactPhone?phone(contactPhone):'';
 return {p:point,name,contactName,contactPhone,address,notes,number,kind:p.k==='f'?'favorito':'registro',maps:gmaps(point),route:directions(point),osm:osm(point),wa:number?'https://api.whatsapp.com/send?phone='+number.replace(/\D/g,'')+'&text='+encodeURIComponent('Hola. Te contacto sobre '+(name||'esta ubicación')+': '+gmaps(point)):''};
}
function shareUrl(x){
 if(!global.location||!global.location.href)throw Error('La página necesita una dirección HTTPS para compartir la ficha.');
 const bytes=new TextEncoder().encode(JSON.stringify(sharePayload(x)));
 let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
 const code=btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const link=new URL('ficha-compartida.html',global.location.href);
 link.hash='f='+code;
 return link.href;
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
 '<div class="gf-right"><div id="gfLiveSharePreview" class="gf-live-preview" aria-label="Vista previa interactiva de la ficha"></div>'+
 '<div class="gf-actions"><button class="gf-btn" id="gfCopy">Copiar texto clicable</button><button class="gf-btn" id="gfShareText">Compartir enlace interactivo</button>'+
 '<button class="gf-btn gf-wa" id="gfShareWa">Enviar ficha por WhatsApp</button><button class="gf-btn" id="gfHtml">Descargar HTML interactivo</button>'+
 '<button class="gf-btn" id="gfShareHtml">Compartir archivo HTML</button><button class="gf-btn gf-png" id="gfPng">Descargar PNG</button><button class="gf-btn gf-png" id="gfSharePng">Compartir PNG</button></div>'+
 '<p id="gpsFichaStatus" class="gf-status" role="status" aria-live="polite"></p>'+
 '<p class="gf-note">WhatsApp recibe un enlace a la ficha web. La persona abre ese enlace en el navegador y usa los botones de la ficha. También puedes enviar el archivo HTML como documento. El PNG sigue siendo una imagen sin botones activos.</p></div></div>';
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
   const link=shareUrl(x);
   if(navigator.share){
     await navigator.share({title:x.name||'Ficha GPS interactiva',text:'Abre esta ficha de ubicación para usar sus botones:',url:link});
     status('Enlace interactivo enviado al menú de compartir.');
   }else{await copyText(link);status('Enlace a la ficha interactiva copiado para compartir.');}
 });
 action('gfShareWa',async x=>{
   const url='https://api.whatsapp.com/send?text='+encodeURIComponent('Ficha GPS interactiva: '+(x.name||'Ubicación')+'\n'+shareUrl(x));
   const popup=window.open(url,'_blank');if(popup)popup.opener=null;else if(global.location)global.location.href=url;
   status('Se abrió WhatsApp con el enlace a la ficha; sus botones funcionan al abrirla en un navegador.');
 });
 action('gfHtml',async x=>{
   download(new Blob([htmlCard(x,true)],{type:'text/html;charset=utf-8'}),'ficha-ubicacion-'+x.p.timestamp+'.html');
   status('HTML independiente descargado con botones y enlaces dentro de la propia ficha.');
 });
 action('gfShareHtml',async x=>{
   const name='ficha-ubicacion-'+x.p.timestamp+'.html',blob=new Blob([htmlCard(x,true)],{type:'text/html;charset=utf-8'});
   if(typeof File==='function'&&navigator.share&&navigator.canShare){
     const file=new File([blob],name,{type:'text/html'});
     if(navigator.canShare({files:[file]})){
       await navigator.share({title:x.name||'Ficha GPS interactiva',files:[file]});
       status('Archivo HTML ofrecido al menú de compartir. Puede requerir abrirlo en el navegador.');
       return;
     }
   }
   download(blob,name);status('HTML descargado. Puedes enviarlo desde WhatsApp como documento; el destinatario debe abrirlo en un navegador.');
 });
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
function preview(x){e('gfLiveSharePreview').innerHTML=htmlCard(x);}
async function copyText(text){
 if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);
 const area=document.createElement('textarea');area.value=text;document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw Error('No se pudo copiar el enlace.');
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
 if(!ctx)throw Error('Este navegador no puede generar la ficha PNG.');
 const W=1080,gap=18,pad=26,mainLeft=54,colWidth=477;
 const title=x.name||(x.kind==='favorito'?'Ubicación favorita':'Punto GPS');
 function setFont(size=25,bold=false){ctx.font=(bold?'700 ':'')+size+'px system-ui, sans-serif';}
 function lineBlock(value,maxWidth,font=26,bold=false){
   setFont(font,bold);return wrap(ctx,String(value),maxWidth);
 }
 const titleLines=lineBlock(title,730,44,true),dateLines=lineBlock(when(x.p),880,25);
 const heroH=125+titleLines.length*55+dateLines.length*35;
 const leftFields=[['COORDENADAS (LATITUD / LONGITUD)',coords(x.p)],['PRECISIÓN GPS',Number.isFinite(x.p.accuracy)?'±'+Math.round(x.p.accuracy)+' m':'No informada']];
 if(x.address)leftFields.push(['DIRECCIÓN O REFERENCIA',x.address]);
 const actionLabels=['Ver en Google Maps','Cómo llegar','Abrir OpenStreetMap'];
 if(x.number)actionLabels.push('Llamar al contacto','Escribir por WhatsApp');
 const leftItems=leftFields.map(([label,value])=>({label,lines:lineBlock(value,colWidth-52,27),height:42+lineBlock(value,colWidth-52,27).length*35+15}));
 const leftH=76+leftItems.reduce((total,i)=>total+i.height,0)+20;
 const rightH=76+actionLabels.length*72+20;
 const gridH=Math.max(leftH,rightH);
 const contactEntries=[];
 if(x.contactName)contactEntries.push(['NOMBRE',x.contactName]);
 if(x.number)contactEntries.push(['TELÉFONO',x.number]);
 const contacts=contactEntries.map(([label,value])=>({label,lines:lineBlock(value,920,27),height:33+lineBlock(value,920,27).length*36+12}));
 const contactH=contacts.length?69+contacts.reduce((t,i)=>t+i.height,0)+18:0;
 const noteLines=x.notes?lineBlock(x.notes,920,27):[],noteH=noteLines.length?76+noteLines.length*37+18:0;
 const footerH=83;
 const height=35+heroH+gap+gridH+(contactH?gap+contactH:0)+(noteH?gap+noteH:0)+gap+footerH+35;
 if(height>12000)throw Error('La ficha contiene demasiados datos para generar una imagen.');
 canvas.width=W;canvas.height=height;
 function box(x0,y0,width,height0,color,radius=19,border){
   ctx.save();rounded(ctx,x0,y0,width,height0,radius);ctx.fillStyle=color;ctx.fill();
   if(border){ctx.strokeStyle=border;ctx.lineWidth=2;ctx.stroke();}ctx.restore();
 }
 function text(str,x0,y0,size,color,bold=false){setFont(size,bold);ctx.fillStyle=color;ctx.fillText(str,x0,y0);}
 function drawTextLines(lines,x0,y0,font=27,color='#274a3e',height0=35,bold=false){
   for(let i=0;i<lines.length;i++)text(lines[i],x0,y0+i*height0,font,color,bold);
 }
 box(0,0,W,height,'#f3f8f5',0);
 ctx.save();rounded(ctx,35,35,W-70,heroH,24);ctx.clip();
 const gradient=ctx.createLinearGradient(35,35,1045,35);gradient.addColorStop(0,'#0e4d3b');gradient.addColorStop(1,'#137456');ctx.fillStyle=gradient;ctx.fillRect(35,35,W-70,heroH);ctx.restore();
 text('⌖  CONTROL GPS  ·  '+(x.kind==='favorito'?'UBICACIÓN FAVORITA':'REGISTRO GPS'),65,89,23,'#c4f1d4',true);
 drawTextLines(titleLines,65,153,44,'#ffffff',55,true);
 const dateY=153+titleLines.length*55+5;
 drawTextLines(dateLines,65,dateY,25,'#e4f6e8',35);
 let y=35+heroH+gap;
 box(35,y,colWidth,gridH,'#e8f5ed',20,'#d9e9df');
 box(35+colWidth+gap,y,colWidth+gap,gridH,'#ffffff',20,'#dce9e1');
 text('DATOS DE LA UBICACIÓN',60,y+48,22,'#176048',true);
 let inside=y+88;
 for(const item of leftItems){
   text(item.label,60,inside,17,'#638a76',true);
   drawTextLines(item.lines,60,inside+35,27,'#204437',35,true);
   inside+=item.height;
 }
 const rightX=35+colWidth+gap;
 text('ACCIONES DE LA FICHA',rightX+23,y+48,22,'#176048',true);
 let ay=y+76;
 for(let i=0;i<actionLabels.length;i++){
   box(rightX+18,ay,colWidth+gap-36,61,'#f1f8f4',12,'#d8e9df');
   box(rightX+30,ay+14,34,34,i===4?'#149d61':'#d8eee1',12);
   text(['⌖','➤','▤','☎','✆'][i],rightX+37,ay+38,22,i===4?'#ffffff':'#176448',true);
   text(actionLabels[i],rightX+77,ay+39,23,'#1a5b42',true);
   text('›',rightX+colWidth-10,ay+41,29,'#719d88');
   ay+=72;
 }
 y+=gridH+gap;
 if(contacts.length){
   box(35,y,W-70,contactH,'#ecf7f1',20,'#dcebe1');
   text('CONTACTO ASOCIADO',60,y+44,22,'#176048',true);
   let cy=y+84;
   for(const item of contacts){text(item.label,60,cy,17,'#648673',true);drawTextLines(item.lines,60,cy+36,27,'#274a3d',36,true);cy+=item.height;}
   y+=contactH+gap;
 }
 if(noteLines.length){
   box(35,y,W-70,noteH,'#ffffff',20,'#dcebe1');
   text('OBSERVACIONES',60,y+44,22,'#176048',true);
   drawTextLines(noteLines,60,y+85,27,'#26463c',37);
   y+=noteH+gap;
 }
 box(35,y,W-70,footerH,'#e3f2e8',18);
 text('CONTROL GPS',62,y+46,27,'#145b3f',true);
 text('Ficha de ubicación compartible',380,y+46,21,'#5d826d');
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('No se pudo producir la imagen PNG.')),'image/png'));
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
global.GpsCards={htmlCard,shareUrl,renderShared:(p)=>htmlCard(fromPayload(p)),init(x){if(x?.getMeta)state.getMeta=x.getMeta;if(x?.setMeta)state.setMeta=x.setMeta;},open,key};
})(window);

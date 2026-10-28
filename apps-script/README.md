# Servicio privado de Control GPS

Estado actualizado: **backend instalado en un proyecto privado vinculado a una hoja de ensayo; autorización y despliegue API ejecutable pendientes**. El código guardado en el editor se cotejó completo con el publicado. Publicar estos archivos en GitHub Pages no despliega Apps Script.

## Verificación desde el navegador integrado

- Se inició sesión con la cuenta propietaria y se revisaron los 39 proyectos visibles de Apps Script. El geocodificador de LoNecesito existe y conserva su proyecto Cloud predeterminado; no se modificó. No apareció un backend privado de Control GPS reutilizable.
- Se creó una hoja privada de ensayo, se guardó en la carpeta de documentos nuevos indicada por el usuario y se creó un único proyecto Apps Script vinculado a ella. Los identificadores privados y la cuenta propietaria se conservan en las propiedades del script y no se publican en este repositorio.
- Se guardaron código, manifiesto y propiedades de destino, propietario y geocodificación; presupuesto configurado: 100 consultas/día. Se verificaron los diez encabezados exactos de `control_gps_eventos_v1`, sin registros personales. Sheets indica «Privado, solo para mí».
- La primera ejecución de `gpsInitialize` abrió la autorización de Google y quedó detenida en «Google no ha verificado esta aplicación». No se concedieron permisos en nombre del usuario ni se completó la ejecución.
- El diálogo de API ejecutable exige cambiar a un proyecto Cloud gestionado por el usuario. Google Cloud mostró «Site Unavailable» en este navegador, incluso tras una recarga. No se pudo configurar el proyecto estándar ni el cliente OAuth. No se creó una implementación pública como alternativa.
- **No hay pruebas reales de escritura/lectura por Apps Script ni sincronización entre dispositivos aprobadas todavía.** La sincronización de la aplicación permanece desactivada.

## Recursos existentes e identidad

La rama `codex/diseno-original` de `gruemp/lonecesito` contiene el proyecto **LoNecesito — Geocodificador GPS**, su manifiesto y su registro de despliegue. Su aplicación publicada utiliza Firebase Authentication/Firestore y el geocodificador público de solo lectura. Se verificó su código y la configuración publicada, no la administración actual de Google.

Ese servicio no almacena historiales y responde mediante JSONP anónimo, ejecutándose como propietario. No debe recibir historiales privados ni convertirse en un endpoint público de escritura. Se reutilizó el patrón de `Maps.newGeocoder`, los componentes geográficos y la regla que distingue calles de regiones/plus codes. No se reutilizan las colecciones de publicaciones ni las analíticas de Natura.

El conector Drive utilizado filtra MIME types y no administra Apps Script: una búsqueda vacía de proyectos no demuestra que no existan. El inventario posterior en el navegador permitió comprobar los proyectos de la cuenta y preparar el backend privado descrito arriba. **Reutilizar la hoja de ensayo y su proyecto vinculado ya creados; no volver a crearlos.** Este repositorio no crea automáticamente proyectos ni hojas.

## Preparar el servicio desde la cuenta propietaria

1. Inventariar proyectos existentes en Apps Script y comprobar propietario, código, permisos y despliegues. Reutilizar un proyecto privado compatible. Mantener intacto el geocodificador público de LoNecesito. Si no existe backend privado, crear uno separado está justificado por el acceso a datos privados; no duplicar el geocodificador público.
2. Seleccionar una hoja privada de ensayo vacía o sin datos de producción. No publicar ni compartir por enlace. Compartir únicamente con las cuentas expresamente autorizadas si se desea un historial común. Por defecto usar la misma cuenta en todos los dispositivos. Todas las cuentas permitidas de esta instalación comparten **el mismo historial**, no hay espacios privados diferentes por usuario.
3. Añadir `control-gps.gs` al proyecto elegido, conservando los demás archivos. El manifiesto incluido corresponde a un proyecto dedicado; **no reemplazar** un manifiesto existente sin conciliar sus dependencias y permisos. Si el proyecto tiene otros scopes, se debe adaptar también la solicitud OAuth del cliente o usar un proyecto privado aislado.
4. Configurar en **Propiedades del script**, nunca en GitHub:

   | Propiedad | Valor |
   | --- | --- |
   | `GPS_OWNER_EMAIL` | Correo del propietario, en minúsculas |
   | `GPS_SPREADSHEET_ID` | ID de la hoja privada de destino |
   | `GPS_ALLOWED_EMAILS` | Opcional, correos separados por comas; por defecto solo propietario |
   | `GPS_GEOCODE_ENABLED` | `true` solo si se autoriza el servicio de direcciones |
   | `GPS_GEOCODE_DAILY_LIMIT` | Límite total diario UTC; por defecto 100, máximo 1000 |

5. Ejecutar `gpsInitialize` desde el editor con la cuenta propietaria y autorizar los permisos. Crea únicamente la pestaña `control_gps_eventos_v1` si no existe; no borra ni migra pestañas. Rechaza encabezados incompatibles.
6. Vincular el script y el cliente OAuth al **mismo proyecto estándar de Google Cloud**. Revisar primero si el Cloud existente puede reutilizarse; el proyecto predeterminado de Apps Script no basta. Activar Apps Script API. No activar facturación ni comprar servicios como parte de esta configuración.
7. Configurar consentimiento OAuth y un cliente **Aplicación web** con origen JavaScript autorizado `https://gruemp.github.io`. Añadir únicamente los usuarios de prueba autorizados cuando el consentimiento esté en pruebas. Los scopes del manifiesto son `spreadsheets` y `userinfo.email`. El permiso de Sheets abarca las hojas accesibles por la cuenta; el backend limita su uso al ID privado configurado. El token permanece en memoria y no se exporta.
8. Crear una implementación de tipo **API ejecutable** con acceso a la cuenta propietaria (o cuentas Google autorizadas si se requiere compartir). La lista de correos del servidor y los permisos de la hoja siguen siendo obligatorios. **No desplegar como aplicación web anónima.** No se incluyen `doGet` ni `doPost`.
9. Copiar el **ID de implementación del API ejecutable**, no la URL `/exec` ni el ID del editor. El contrato REST vigente es `POST https://script.googleapis.com/v1/scripts/{deploymentId}:run`, función `gpsApi`, `devMode:false`.
10. En Control GPS, abrir **Opciones y datos → Google Sheets privado → Configurar conexión de Google**. Introducir ID del cliente e ID de implementación. Marcar consentimiento y pulsar **Conectar con Google**. Elegir la cuenta propietaria. La primera carga de Google puede requerir volver a pulsar el botón. Repetir en el segundo dispositivo con la misma cuenta y destino. Los identificadores se guardan en ese navegador, sin incluirlos en el código público.

Google Identity Services admite llamadas REST con CORS y tokens de acceso. Así se evitan la redirección de ContentService, los problemas de cookies de `/exec`, JSONP y respuestas opacas `no-cors`. **Compatibilidad real desde GitHub Pages pendiente de ensayo autorizado**: la documentación y los tests simulados no prueban la configuración de la cuenta.

## Estructura y política de datos

`control_gps_eventos_v1` es un diario de versiones **solo anexado**, no una tabla para ordenar o editar manualmente. Columnas: secuencia, ID de operación, ID de entidad, tipo, revisión base, fecha/hora ISO UTC de recepción, usuario autenticado, dispositivo, datos JSON y conflicto. No ordenar, borrar ni insertar filas del diario.

- Tipos: `record`, `favorite`, `address`. IDs lógicos deterministas por timestamp/coordenadas o coordenadas redondeadas a seis decimales. IDs de operación UUID estables al reintentar.
- Los registros incluyen timestamp en milisegundos, latitud, longitud y precisión en metros; fecha y hora de captura se derivan de timestamp en la zona elegida. Las direcciones incluyen fuente, calidad, país, departamento, ciudad, calle y número solo cuando existen. No hay credenciales dentro de los datos JSON.
- Una entidad puede tener varias filas/versiones. En el historial visible se fusiona por ID lógico; reintentar una operación no añade filas duplicadas. La secuencia del servidor define el orden sin confiar en relojes de los dispositivos.
- Conflicto: prevalece la última versión recibida por el servidor. La versión anterior permanece en el diario; el conflicto se marca y se informa en el cliente. No hay borrado de versiones anteriores. Un cambio local pendiente se protege mientras se descarga el remoto y después se sube como una nueva versión.
- Quitar un favorito o vaciar una dirección crea una versión desactivada/vacía. El historial GPS se conserva remotamente: borrarlo en la interfaz solo lo borra de ese navegador y puede recuperarse al reconectar. Borrar todo pausa la sincronización antes de modificar los datos locales.
- No se implementa borrado remoto masivo. Retención sin borrado automático; cualquier depuración o archivado futuro debe incluir copia verificada. Al superar 50.000 eventos el servicio pide archivar y detiene nuevas operaciones, preservando la información.
- Primera conexión: copia íntegra local en `gpsSyncBackupV1` antes de aplicar datos remotos; la descarga de esa copia omite la clave Geoapify y la URL CSV. La cola y el cursor se guardan en `gpsSyncStateV1`. No limpiar claves del navegador si hay pendientes.
- El origen local `gpsTrackerState` se mantiene. Los JSON/CSV anteriores siguen importándose. El token OAuth nunca se guarda en localStorage, archivos, URLs o exportaciones.
- Una sola pestaña puede sincronizar mediante Web Locks. Un cambio de almacenamiento desde otra pestaña detiene la conexión para exigir recarga. Cambiar de cuenta/destino con una cola existente se rechaza; utilizar otro perfil evita mezclar historiales.

## Conexiones intermitentes y direcciones

Subidas de hasta 50 operaciones, descargas de hasta 200 eventos por página. Confirmación explícita del servidor, cursor persistido después de guardar localmente, reintentos exponenciales con variación entre unos segundos y cinco minutos. Si la respuesta se pierde tras escribir, se reenvían los mismos IDs. Errores de permisos o configuración detienen la sesión; errores de red conservan la cola. Tokens vencidos requieren una nueva acción del usuario, sin renovación silenciosa ni refresh token almacenado.

**Buscar dirección** utiliza Google cuando existe sesión autorizada, con confirmación para el punto. Sin sesión conserva el flujo Geoapify existente. La casilla de dirección automática autoriza únicamente nuevas capturas, nunca una consulta masiva del historial; máximo una por minuto y 20 por sesión de página. El servidor exige además `GPS_GEOCODE_ENABLED` y aplica su presupuesto compartido diario. Si hay solo administración y no calle, la dirección se etiqueta `Zona aproximada`; los campos faltantes permanecen vacíos. Se conserva la corrección manual y no se sobrescribe una corrección hecha mientras llega una respuesta. No se garantiza portal exacto, número ni apartamento.

No se configura una API de Maps con facturación ni se publican claves. Maps de Apps Script tiene cuotas de Google sujetas a cambios; revisar el consumo de la cuenta y mantener el límite de la aplicación por debajo de su cuota efectiva. No se activa envío continuo cuando la página está cerrada o suspendida.

## Verificación

Ejecutar desde el repositorio:

```bash
node --test tests/sync.test.cjs
```

La suite comprueba permisos, guardado/lectura, dos clientes, respuesta perdida después de escritura, deduplicación, conflictos, favoritos, direcciones, desconexión, cuota, paginación, bloqueo entre destinos, almacenamiento local fallido y preservación exacta del CSS anterior.

Antes de dar por activa la conexión realizar en la hoja de ensayo: OAuth desde el origen público; aceptar/rechazar permisos; escritura/lectura desde dos navegadores; recarga y reintento tras desconexión; cambios simultáneos; revocación; cuota real; validación de direcciones con coordenadas públicas de prueba. Comparar el número de IDs lógicos del backup antes/después y conservar el diario. **Ninguna de estas pruebas reales de Google ha sido ejecutada en esta entrega.**

Fuentes oficiales: [scripts.run](https://developers.google.com/apps-script/api/reference/rest/v1/scripts/run), [API ejecutable y proyecto Cloud común](https://developers.google.com/apps-script/api/how-tos/execute), [OAuth para navegador y CORS](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [cuotas](https://developers.google.com/apps-script/guides/services/quotas), [ContentService/JSONP](https://developers.google.com/apps-script/guides/content).

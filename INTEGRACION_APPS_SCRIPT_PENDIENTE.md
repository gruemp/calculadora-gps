# Integración pendiente: Apps Script y Google Sheets para Control GPS

## Nombres y recuperación de sesión: estado de esta revisión

La interfaz permite **Nombrar ubicación / Cambiar nombre**. El nombre se muestra en el encabezado de la tarjeta, conservando fecha y hora debajo, y se comparte entre capturas y favoritos de las mismas coordenadas a seis decimales. Se conserva en `gpsTrackerState`, las copias JSON versión 5 y la importación JSON/CSV local. Vaciar el nombre no borra la ubicación, y borrar solo el historial conserva nombres, favoritos y direcciones.

El cliente deja de forzar `select_account`: solicita `prompt: ''` y recuerda exclusivamente la cuenta ya validada como `login_hint` local. Al regresar de navegación, recuperar conexión o restaurar una página, sincroniza inmediatamente si la sesión sigue válida. No guarda tokens OAuth, contraseñas ni refresh tokens en almacenamiento, archivos o URLs. Google todavía puede requerir una autorización legítima.

**Activación en Google pendiente.** La sesión propietaria del navegador conectado apareció cerrada y la solicitud segura de acceso no llegó a completarse. No se pudo actualizar el backend desplegado ni comprobar una reconexión real en esta revisión. El API activo sigue en versión 2. El código del repositorio añade soporte `name` y negociación de cliente 2/3; hasta actualizar ese API, los nombres se guardan localmente y en una cola duradera, sin impedir la sincronización existente del historial, favoritos y direcciones. No se deben presentar los nombres como sincronizados con la hoja todavía.

`gps-session.js` y las funciones `doGet`/`gpsBridgeApi` preparan un transporte con la sesión nativa de Google. **No está activado:** `sessionBridgeUrl` sigue vacío, sin valores inventados. La prueba simulada comprueba inicio automático, correlación de solicitudes, validación de origen/nonce, cancelación y ausencia de credenciales en mensajes. No demuestra que las cookies, el iframe y el acceso privado funcionen en Chrome o Android reales.

Para terminar desde la sesión autorizada del propietario:

1. Actualizar el código del mismo proyecto de Apps Script con `apps-script/control-gps.gs`, manteniendo propiedades privadas y scopes; actualizar la misma implementación API ejecutable. No crear otra hoja ni proyecto.
2. Si se utiliza el transporte de sesión, añadir solo la implementación web necesaria en ese mismo proyecto, con **ejecutar como usuario que accede (`USER_ACCESSING`) y acceso Solo yo (`MYSELF`)**. No habilitar acceso anónimo ni ejecutar como propietario para otros usuarios. Ambos correos, activo y efectivo, se comprueban en el servidor. No se transmite ningún token OAuth al sitio; cada solicitud atraviesa los controles existentes de `gpsApi`.
3. Recuperar su URL real y verificar la comunicación privada con `https://gruemp.github.io` mediante origen exacto y nonce aleatorio. Publicarla en `sessionBridgeUrl` únicamente tras comprobarla. Si el navegador bloquea la sesión en iframe, mantener OAuth interactivo y documentar ese límite; no debilitar los permisos ni afirmar acceso automático garantizado.
4. Probar apertura, recarga, regreso de Google Maps, caducidad, desconexión/reconexión y nombres desde Pages y Android. Utilizar un punto público de ensayo para lectura/escritura y restauración, sin borrar el historial del propietario. Repetir sincronización y contrastar las operaciones con una lectura independiente de la hoja.

**Validación local de esta revisión: 48/48 pruebas aprobadas**, incluidos CSS idéntico, encabezado como texto seguro, persistencia y exportación/importación de nombres, sincronización/retirada idempotente, protección frente a clientes antiguos y compatibilidad con el backend anterior. Las pruebas destructivas siguen siendo simuladas. No se borró ningún registro real ni se amplió el acceso a datos privados en esta revisión.

## Registro de comprobaciones anteriores


**Estado vigente (2026-10-31, America/Bogota): configuración pública completada y conexión real desde Pages comprobada.** Se reutilizaron el proyecto Cloud estándar, el cliente OAuth web existente facilitado por el propietario, la hoja privada y la misma implementación API ejecutable, ahora en versión 2 con acceso «Solo yo». `gps-google-service.js` ya contiene ambos identificadores públicos. No se publicaron secretos ni identificadores de hojas, ni se crearon recursos adicionales. La consola Cloud sigue sin cargar en el navegador remoto, pero OAuth y la ejecución del backend se validaron desde la app publicada.

El perfil Chrome de prueba, sin IDs guardados ni datos locales previos, recuperó 5 registros GPS, 4 favoritos activos y 2 direcciones. Sincronización repetida y recarga/reconexión conservaron los 21 eventos iniciales sin reenvíos duplicados. Se verificó la consulta de dirección del punto público de ensayo. Una escritura manual técnica sobre ese punto se confirmó como evento 22; su restauración exacta mediante Google, incluidos los metadatos originales, como evento 23. Se conservaron todos los eventos anteriores, sin conflictos nuevos y con 23 IDs de operación únicos. No se borraron registros ni se retiraron favoritos existentes. Suite local: 25/25. No se modificaron el diseño, la medición GPS ni las opciones eliminadas.

No hacen falta códigos en cada dispositivo: abrir la app, autorizar el envío a la hoja privada una vez y pulsar **Conectar con Google**, seleccionando la misma cuenta propietaria. Google puede exigir renovar su autorización. Falta la comprobación física en el Android del propietario y no se probó concurrencia real entre dos dispositivos simultáneos; el alcance completo y las limitaciones están en [apps-script/README.md](apps-script/README.md).

**Actualización posterior de borrado remoto:** se añadió la opción de eliminar físicamente solo el historial GPS, conservando favoritos, direcciones, encabezados y copias. Requiere conexión propietaria, una vista previa vigente y escribir `BORRAR HISTORIAL`. Se actualizó la misma implementación a versión 2. La sincronización distingue generaciones para evitar reenvíos del historial borrado; conserva nuevas capturas pendientes y bloquea clientes antiguos tras un borrado. Hay descarga de la copia local anterior. Suite actual: 35/35. En Pages se verificaron la conexión, disponibilidad del botón, preparación real y cancelación, con los 28 eventos existentes intactos. La eliminación destructiva solo se probó con datos simulados; no se borró el historial real del propietario durante el desarrollo.

## Antecedentes históricos

**Estado (2026-10-28, America/Bogota):** OAuth y lectura/escritura reales desde GitHub Pages comprobados en Edge conectado con la cuenta propietaria. Se reutilizaron el proyecto Cloud estándar, el cliente OAuth web, la hoja de ensayo y el API ejecutable versión 1 con acceso «Solo yo». Apps Script API ya estaba habilitada y el origen `https://gruemp.github.io` ya estaba autorizado. No se crearon recursos adicionales ni se modificó el diseño.

Durante la prueba de reconexión se detectaron versiones redundantes: comparar JSON por orden de propiedades trataba como diferentes datos idénticos devueltos por el API. El cliente ahora compara contenido sin depender del orden y conserva una sola entrada local por conflicto, incluso al releer el diario. Las 21 pruebas locales pasan; el CSS original permanece idéntico. La corrección ya se publicó en Pages; una reconexión y sincronización manual conservaron el diario en 15 eventos. Se verificó el bloqueo de una segunda pestaña del mismo Edge. Se conservan todas las versiones de la hoja, incluidas las generadas antes de la corrección.

La configuración y el contrato están en [apps-script/README.md](apps-script/README.md). En esta fase histórica los identificadores permanecían únicamente en el navegador del propietario; desde la revisión de 2026-10-31 los dos IDs públicos de instalación están publicados. La mejora para evitar escritura de IDs añade `gps-google-service.js`: el propietario debe publicar allí los dos IDs públicos de instalación si quiere que los nuevos dispositivos puedan conectar sin configurarlos manualmente. **Revisión 2026-10-31:** ambos identificadores públicos ya están publicados; nunca colocar tokens, secretos ni IDs de hojas privadas en el sitio. La sincronización continúa siendo opcional y cada recarga exige conectar de nuevo con Google. La geocodificación desde Pages quedó comprobada al recuperar la pestaña: el resultado de Times Square se guardó una sola vez y los reintentos no agregaron versiones. Se confirmó además el alta del favorito técnico de Times Square (evento 17). Su retirada quedó pendiente por el bloqueo del cuadro de confirmación de Edge. Falta validar un segundo dispositivo o perfil independiente; otra pestaña del mismo Edge no equivale a esa prueba. Las pruebas de desconexión de red, pérdida de respuesta y cuotas siguen cubiertas por simulación, salvo las verificaciones reales expresamente registradas en el README.

Lo que sigue conserva el diagnóstico anterior como antecedente; las afirmaciones de ausencia de código se refieren al punto de partida.

## Punto de partida verificado

- Aplicación pública: `https://gruemp.github.io/calculadora-gps/`.
- Repositorio: `gruemp/calculadora-gps`, archivo principal `inicio.html`.
- Almacenamiento actual: `localStorage.gpsTrackerState`. Se conserva por dispositivo; los backups JSON pueden transportar historial, favoritos y direcciones.
- Importación de CSV local o de una URL HTTPS si permite CORS.
- La lectura/sincronización automática de Google Sheets y la consulta privada de Apps Script **todavía no existen**.
- La resolución postal actual permite entrada manual o consulta Geoapify por registro, solo a petición del usuario y con su clave propia protegida por referente/origen.

## Objetivo de la siguiente etapa (en Work)

1. Revisar el proyecto original **LoNecesito** y verificar si su infraestructura usa Apps Script, Firebase u otros servicios, con permisos de la cuenta del propietario. No copiar credenciales ni endpoints sin comprobar su funcionamiento y autorización.
2. Identificar y revisar las hojas propias, los encabezados, Apps Script existentes, permisos de ejecución, propietarios y deployments activos.
3. Definir un contrato explícito para sincronización, por ejemplo:
   - `guardar`: `id`, `timestamp ISO`, `latitud`, `longitud`, `precision_m`, `direccion`, `favorito`, `origen`.
   - `listar`: paginación por fechas y un `cursor` estable, sin devolver ubicaciones de usuarios ajenos.
   - `geocodificar`: latitud/longitud con una cuota controlada y origen identificado; devolver dirección aproximada y su calidad.
   - `eliminar`: permisos, confirmación y auditoría apropiados si se necesita borrado remoto.
4. Elegir autenticación **antes de publicar el despliegue**. No colocar secretos, tokens de escritura, claves de servicio ni credenciales en el JavaScript público. No utilizar `Anyone/Anyone with link` para acceso de escritura a datos GPS personales. Google Apps Script puede necesitar OAuth o un intermediario autenticado; comprobar CORS y redirects en el navegador real.
5. Evitar duplicados usando IDs estables y sello de última actualización; asegurar idempotencia al reintentar, manejo de conexiones intermitentes y política de conflictos entre navegador y hoja.
6. Configurar consentimiento explícito para sincronización remota y aviso de privacidad. El historial debe seguir funcionando sin conexión; la sincronización debe ser opt-in.
7. Probar en una hoja de ensayo que no contenga datos de producción: lectura, escritura, permisos, CORS, cuotas, errores, desconexión, desfase de reloj y copia de seguridad. Solo entonces habilitar la integración pública.

## Información a aportar o validar desde Work

- Identificador de la hoja de destino y cuenta propietaria (no copiar la URL privada al repositorio público).
- Código y URL del deployment de Apps Script **sin secretos**; confirmar que están vigentes y bajo control del propietario.
- Si cada dispositivo tendrá un historial privado o un registro compartido.
- Decidir si la dirección se guardará como dato manual, aproximado Geoapify o resultado del proveedor elegido.
- Política de retención, borrado y acceso de los datos GPS.

## Instrucción de reanudación para ChatGPT Work

> Abre el repositorio `gruemp/calculadora-gps`, lee `INTEGRACION_APPS_SCRIPT_PENDIENTE.md`, verifica los proyectos de Google Apps Script y Sheets de mi cuenta y configura, prueba y publica únicamente una integración segura con sincronización opcional. Conserva la interfaz Control GPS inicial, la medición desde GPS actual, el filtro de precisión, el texto compartible con enlaces y la importación/exportación local. No restablezcas fichas HTML ni PNG.

**Nota:** No es posible desplegar y autorizar un proyecto de Apps Script solo con cambios al repositorio GitHub. Se requieren acceso, configuración de la cuenta y pruebas reales del endpoint.


# Integración pendiente: Apps Script y Google Sheets para Control GPS

**Estado (2026-10-28, America/Bogota):** OAuth y lectura/escritura reales desde GitHub Pages comprobados en Edge conectado con la cuenta propietaria. Se reutilizaron el proyecto Cloud estándar, el cliente OAuth web, la hoja de ensayo y el API ejecutable versión 1 con acceso «Solo yo». Apps Script API ya estaba habilitada y el origen `https://gruemp.github.io` ya estaba autorizado. No se crearon recursos adicionales ni se modificó el diseño.

Durante la prueba de reconexión se detectaron versiones redundantes: comparar JSON por orden de propiedades trataba como diferentes datos idénticos devueltos por el API. El cliente ahora compara contenido sin depender del orden y conserva una sola entrada local por conflicto, incluso al releer el diario. Las 21 pruebas locales pasan; el CSS original permanece idéntico. La corrección ya se publicó en Pages; una reconexión y sincronización manual conservaron el diario en 15 eventos. Se verificó el bloqueo de una segunda pestaña del mismo Edge. Se conservan todas las versiones de la hoja, incluidas las generadas antes de la corrección.

La configuración y el contrato están en [apps-script/README.md](apps-script/README.md). Los identificadores y datos privados permanecen fuera de GitHub. La sincronización continúa siendo opcional y cada recarga exige conectar de nuevo con Google. La geocodificación desde Pages quedó comprobada al recuperar la pestaña: el resultado de Times Square se guardó una sola vez y los reintentos no agregaron versiones. Se confirmó además el alta del favorito técnico de Times Square (evento 17). Su retirada quedó pendiente por el bloqueo del cuadro de confirmación de Edge. Falta validar un segundo dispositivo o perfil independiente; otra pestaña del mismo Edge no equivale a esa prueba. Las pruebas de desconexión de red, pérdida de respuesta y cuotas siguen cubiertas por simulación, salvo las verificaciones reales expresamente registradas en el README.

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

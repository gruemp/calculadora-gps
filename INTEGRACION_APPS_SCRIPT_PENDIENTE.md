# Integración pendiente: Apps Script y Google Sheets para Control GPS

**Estado:** pendiente de configuración, autorización, implementación y pruebas. Este archivo no es una integración activa.

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

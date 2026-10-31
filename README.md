# Control GPS

Aplicación web de seguimiento GPS, medición de distancias y consulta del historial en tarjetas. No incorpora un mapa integrado.

## Abrir la aplicación

- `index.html` abre `inicio.html`, la pantalla principal de Control GPS.
- Se requiere **HTTPS** (o `localhost`) y autorización del navegador para obtener coordenadas.
- El historial presenta tarjetas con fecha, coordenadas, precisión, distancia y dirección si se conoce, sin mapa incrustado.

## Uso

1. Abre la página y autoriza geolocalización. El seguimiento se inicia automáticamente de forma visible, salvo que lo hayas detenido previamente.
2. Usa **Detener seguimiento** para pausar y **Iniciar seguimiento** para volver a registrar. La elección se conserva al recargar.
3. El intervalo inicial es de **300 segundos (5 minutos)**; se cambia en **Opciones y datos**.
4. Consulta el historial, ordenado del registro más reciente al más antiguo y con fecha y hora en cada tarjeta. Cada ubicación dispone de un enlace **Google Maps**, que abre un servicio externo.
5. **Registrar ubicación** crea un punto de historial; **Añadir favorito** guarda un punto aparte.
6. Los datos anteriores guardados con la clave local `gpsTrackerState` se mantienen y se visualizan.

## Importación y exportación

- **Descargar copia JSON** exporta los datos locales.
- **Importar archivo JSON/CSV** admite el formato JSON de la aplicación y CSV con `coordenadas`, `fecha` y `hora`, incluyendo exportaciones de Google Sheets.
- La importación omite duplicados basados en fecha, hora y coordenadas.

## Limitaciones y privacidad

- Las coordenadas se almacenan en el dispositivo mediante `localStorage`. Solo se envían a Google Sheets después de consentir e iniciar una sesión autorizada; los identificadores públicos del servicio ya están configurados en el sitio.
- El seguimiento GPS desde navegadores **no es fiable en segundo plano**: al suspender la pestaña, bloquear la pantalla o cerrar el navegador pueden perderse intervalos. Para registrar ubicaciones con la pantalla apagada de forma confiable hace falta una aplicación móvil con permisos apropiados.
- Si faltan registros, comprueba los permisos de GPS y el diagnóstico visible; también puedes importar CSV/JSON.
- Ya no se cargan Leaflet ni las teselas de OpenStreetMap. Los enlaces externos a Google Maps requieren conexión.

## Medición y precisión

- **Medir desde mi ubicación:** obtiene una posición GPS *actual* y calcula la distancia geodésica en línea recta desde esa referencia a los registros y favoritos. Cada fila muestra la distancia. Pulsa **Medir** en un punto para actualizar la distancia indicada en su tarjeta y en el estado GPS, sin mostrar un mapa.
- La distancia **no equivale al trayecto por carretera** ni a su tiempo de desplazamiento. Se recalcula solo cuando solicitas medir o cuando se registra una nueva posición válida.
- En **Opciones y datos → Precisión mínima aceptable** ajusta el **error máximo permitido**, entre 5 y 5000 metros (valor inicial: 100 m). Por ejemplo, 30 significa aceptar solo lecturas del dispositivo con precisión declarada **±30 m o mejor**. Las lecturas menos precisas se rechazan y muestran un diagnóstico; no se guardan en el historial. El número no aumenta la precisión física del sensor.

## Copiar, compartir y dirección postal

- Cada registro y favorito presenta acciones frecuentes (**Google Maps**, **Medir**, **Copiar**, **Compartir**) y botones visibles para **Editar dirección**, **Buscar dirección**, **Añadir favorito** cuando corresponda y **Eliminar**.
- La información compartida incluye fecha y hora, coordenadas, precisión, dirección cuando se conoce, distancia de referencia si se midió, URL de Google Maps e indicaciones. Sin fichas, sin PDF, sin PNG y sin enlaces HTML exportables por separado.
- Las direcciones pueden editarse manualmente por ubicación. La opción **Buscar dirección** utiliza Google solo cuando hay sesión autorizada. Las direcciones aproximadas deben verificarse antes de compartirlas.
- La búsqueda de dirección es manual por punto cuando Google está conectado. La consulta automática de nuevas capturas requiere una autorización separada.
- **Descargar copia JSON** ahora conserva las direcciones y el umbral de precisión; la importación de backups de la versión actual también puede restaurar las direcciones. Los datos locales anteriores (`gpsTrackerState`) no se eliminan al actualizar, incluso si todavía incluyen campos de fichas antiguas que esta versión ya no muestra.

## Google Sheets privado: conexión configurada

La configuración pública de instalación ya está completa en `gps-google-service.js`. Se reutilizan el cliente OAuth web y el API ejecutable privado existentes; los usuarios no escriben identificadores ni claves en la app.

1. Abre **Opciones y datos → Google Sheets privado**.
2. Marca **Autorizo sincronizar mis ubicaciones con la hoja privada** la primera vez.
3. Pulsa **Conectar con Google**, elige la misma cuenta propietaria y acepta los permisos cuando Google lo solicite.
4. Comprueba el estado **Sincronizado con Google Sheets**. Los cambios posteriores se sincronizan mientras la página y la sesión estén activas. Tras recargar o vencer el token, vuelve a conectar.

**Comprobación real del 2026-10-31:** OAuth desde Pages, recuperación en un perfil Chrome sin IDs guardados, historial, favoritos, direcciones, sincronización repetida y recarga/reconexión. Una etiqueta manual de ensayo se guardó en la dirección del punto público de Times Square y después se restauraron exactamente sus datos originales mediante Google. Se conservaron las 21 operaciones previas más dos versiones técnicas, sin registros duplicados ni conflictos nuevos. No se capturó GPS del dispositivo ni se retiraron favoritos existentes.

El historial local y las copias de seguridad se conservan. El API sigue restringido a «Solo yo»; no se publican tokens, contraseñas, secretos ni IDs de hojas privadas. Se mantienen el diseño y las funciones GPS. La prueba física en el Android del propietario y dos dispositivos simultáneos no se realizaron desde esta sesión.

La suite local se ejecuta con `node --test tests/sync.test.cjs` y pasa **35/35**; sus servicios Google son simulados. Las pruebas reales y limitaciones están registradas por separado en [apps-script/README.md](apps-script/README.md). [INTEGRACION_APPS_SCRIPT_PENDIENTE.md](INTEGRACION_APPS_SCRIPT_PENDIENTE.md) conserva el estado vigente y los antecedentes.

## Borrar el historial de Google Sheets

En **Opciones y datos → Google Sheets privado**, conecta la cuenta propietaria y pulsa **Borrar historial de Google Sheets**. Primero se muestra el número de registros y versiones; para ejecutar la operación debes aceptar y escribir exactamente **BORRAR HISTORIAL**.

Este botón elimina físicamente de la pestaña los registros GPS y todas sus versiones. **Conserva los favoritos, las direcciones, los encabezados, la configuración y las copias de seguridad.** También retira el historial anterior del navegador actual; los otros dispositivos lo reflejan al reconectar. Los registros nuevos pendientes posteriores al borrado se conservan, y los ya sincronizados no reaparecen por un reloj adelantado. Los clientes antiguos deben recargar antes de sincronizar tras un borrado.

Se guarda una copia local accesible mediante **Descargar copia anterior al borrado**, sin sustituir la copia previa a la sincronización. El historial de versiones propio de Google Sheets y los JSON ya descargados no se eliminan con este botón.

La implementación API existente se actualizó a la **versión 2**, conservando su ID, permisos y acceso «Solo yo». La vista previa y su cancelación se comprobaron realmente desde Pages; los 28 eventos presentes antes de la prueba permanecieron intactos. El borrado destructivo, la conservación exacta de favoritos/direcciones, los reintentos y la recuperación de una interrupción se probaron con datos simulados, dentro de las 35 pruebas aprobadas. No se ejecutó un borrado real del historial del propietario durante el desarrollo.

## Desplazamiento libre

Toda la aplicación usa **un único desplazamiento vertical de la página**: el panel de seguimiento, el historial, favoritos y opciones se mueven naturalmente al deslizar. No hay paneles fijos o inmovilizados, ni límites de altura que obliguen a desplazar una lista interna. El historial mantiene el diseño compacto y los colores alternados, con tarjetas visibles directamente sin grupos expandibles.

## Presentación del historial

- Las ubicaciones se muestran en una lista cronológica de tarjetas adaptables a teléfonos pequeños, sin grupos desplegables.
- La interfaz utiliza un **diseño compacto**: panel GPS en cuadrícula, indicadores y controles de menor altura, tarjetas de medición más bajas, distancias en línea de metadatos y acciones en una barra corta (dos filas en teléfonos). El diseño mantiene blancos táctiles de aproximadamente 40 píxeles, los cinco colores alternados, la accesibilidad y el tema oscuro.
- Cada tarjeta de registro y favorito muestra su fecha y hora explícitas.
- Cada tarjeta alterna entre cinco tonos suaves (verde azulado, violeta, ámbar, azul y rosa), con un borde lateral de mayor contraste y acentos en los controles. La secuencia continúa entre tarjetas consecutivas, también se aplica a favoritos, y se adapta al tema oscuro sin cambiar los datos GPS.
- Datos principales: hora, fecha, coordenadas, precisión y distancia, con dirección cuando está disponible.
- Las acciones de dirección y administración están visibles en cada tarjeta, sin menú desplegable.
- **No se muestra ningún mapa dentro de la aplicación.** Google Maps solo se abre fuera del sistema cuando el usuario pulsa expresamente el enlace correspondiente.

## Interfaz simplificada

El historial muestra directamente las tarjetas GPS ordenadas de la más reciente a la más antigua, con fecha y hora completas; no hay filtros ni grupos plegables por día/hora. Se han retirado los botones de copiar/compartir masivamente, el importador CSV por URL y la configuración de Geoapify. Siguen disponibles los botones de copiar/compartir de cada ubicación, la importación local de archivos JSON/CSV, la edición manual de direcciones y la búsqueda opcional de direcciones por Google autenticado. Los registros y favoritos existentes no se eliminan por este cambio.


## Nombres y sesión de Google

Cada tarjeta permite **Nombrar ubicación** o **Cambiar nombre**. El nombre aparece en su encabezado; la fecha y hora se conservan debajo. Los nombres se incluyen en las copias e importaciones locales. El diseño y las funciones de medición permanecen iguales.

La app sincroniza al regresar a primer plano cuando la sesión sigue válida y deja de forzar la selección de cuenta en cada conexión. **La recuperación automática después de cerrar/recargar y la sincronización de nombres con Sheets siguen pendientes de activación y prueba en Google:** la sesión propietaria del navegador conectado está cerrada. Hasta actualizar ese servicio, los nombres quedan conservados en el dispositivo y en su cola, sin bloquear el historial, los favoritos ni las direcciones.

Hay 48 pruebas locales aprobadas. El estado y los pasos de activación están en [Integración pendiente](INTEGRACION_APPS_SCRIPT_PENDIENTE.md) y [Apps Script](apps-script/README.md). El transporte nativo preparado permanece desactivado (`sessionBridgeUrl` vacío); no se crearon recursos de Google ni se eliminaron registros reales en esta revisión.

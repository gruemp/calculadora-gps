# Control GPS

Aplicación web de seguimiento GPS y visualización de ubicaciones con Leaflet/OpenStreetMap.

## Abrir la aplicación

- `index.html` abre `inicio.html`, la pantalla principal de Control GPS.
- Se requiere **HTTPS** (o `localhost`) y autorización del navegador para obtener coordenadas.
- La página muestra el mapa desde el inicio, aunque todavía no haya historial. Si hay registros válidos, se trazan puntos y recorridos. La última posición aparece en azul y los favoritos en dorado.

## Uso

1. Abre la página y autoriza geolocalización. El seguimiento se inicia automáticamente de forma visible, salvo que lo hayas detenido previamente.
2. Usa **Detener seguimiento** para pausar y **Iniciar seguimiento** para volver a registrar. La elección se conserva al recargar.
3. El intervalo inicial es de **300 segundos (5 minutos)**; se cambia en **Opciones y datos**.
4. El mapa permite filtrar por fecha y hora; **Centrar mapa** ajusta el encuadre a los puntos visibles.
5. **Registrar ubicación** crea un punto de historial; **Añadir favorito** guarda un punto aparte.
6. Los datos anteriores guardados con la clave local `gpsTrackerState` se mantienen y se visualizan.

## Importación y exportación

- **Descargar copia JSON** exporta los datos locales.
- **Importar archivo JSON/CSV** admite el formato JSON de la aplicación y CSV con `coordenadas`, `fecha` y `hora`, incluyendo exportaciones de Google Sheets.
- **Importar CSV de la URL** lee un enlace HTTPS accesible que permita CORS. Si la hoja está restringida, descarga el CSV e impórtalo localmente en lugar de publicarla.
- La importación omite duplicados basados en fecha, hora y coordenadas.

## Limitaciones y privacidad

- Las coordenadas se almacenan en el dispositivo mediante `localStorage`. No se envían automáticamente a Google Sheets.
- El seguimiento GPS desde navegadores **no es fiable en segundo plano**: al suspender la pestaña, bloquear la pantalla o cerrar el navegador pueden perderse intervalos. Para registrar ubicaciones con la pantalla apagada de forma confiable hace falta una aplicación móvil con permisos apropiados.
- Un mapa sin puntos puede deberse a que no hay registros locales, a permisos de GPS denegados o a que los datos están en otra hoja/dispositivo. Usa el diagnóstico visible y el importador CSV/JSON.
- Leaflet y las teselas de OpenStreetMap necesitan conectividad a internet. Respeta las condiciones de uso y límites de servicio de OpenStreetMap.

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



## Fichas interactivas y PNG

Desde cualquier ubicación del historial o de favoritos selecciona **Ficha / compartir**. Personaliza nombre del lugar, contacto, teléfono, referencia y observaciones; después guarda los datos.

La ficha exportada muestra **cada dato una sola vez**. Incluye nombre, fecha y hora, coordenadas, precisión cuando existe, referencia, contacto y observaciones solo si se han registrado. No inventa fotos, mapas incrustados, altitud o dirección automática.

- **Enviar ficha por WhatsApp:** crea un enlace a `ficha-compartida.html` con los datos codificados en el fragmento de la URL. WhatsApp presenta el enlace en el chat; al abrirlo en un navegador aparece la ficha HTML con botones internos de Maps, indicaciones, llamada y WhatsApp. **No es una tarjeta interactiva dentro del propio chat de WhatsApp.**
- **Compartir enlace interactivo:** usa el menú de compartir del teléfono, o copia la URL en navegadores sin soporte.
- **Descargar HTML interactivo:** archivo autocontenido con estilos y botones clicables, que se puede enviar como documento. Para usarlo, el destinatario debe abrirlo en un navegador; algunas aplicaciones bloquean archivos HTML o no permiten compartirlos.
- **Compartir archivo HTML:** usa la función de archivos del sistema cuando existe y el destino la admite. Si no, descarga el HTML para adjuntarlo manualmente como documento.
- **Descargar o compartir PNG:** mantiene el mismo estilo y los mismos datos disponibles. El PNG es una imagen estática, por lo que no permite tocar botones.

**Privacidad:** cualquier persona que tenga el enlace a la ficha compartida puede leer la ubicación, el contacto, el teléfono y las observaciones incluidos. El enlace contiene los datos en su fragmento (`#f=...`), no se almacenan en un servidor de fichas. No compartas información privada sin autorización. Las fichas solo se generan al solicitar el envío. La copia JSON conserva `locationDetails`, y la importación permite restaurarlos.

## Limitaciones y privacidad

- Las coordenadas se almacenan en el dispositivo mediante `localStorage`. No se envían automáticamente a Google Sheets.
- El seguimiento GPS desde navegadores **no es fiable en segundo plano**: al suspender la pestaña, bloquear la pantalla o cerrar el navegador pueden perderse intervalos. Para registrar ubicaciones con la pantalla apagada de forma confiable hace falta una aplicación móvil con permisos apropiados.
- Un mapa sin puntos puede deberse a que no hay registros locales, a permisos de GPS denegados o a que los datos están en otra hoja/dispositivo. Usa el diagnóstico visible y el importador CSV/JSON.
- Leaflet y las teselas de OpenStreetMap necesitan conectividad a internet. Respeta las condiciones de uso y límites de servicio de OpenStreetMap.

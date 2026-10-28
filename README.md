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
4. Filtra las tarjetas del historial por fecha y hora. Cada ubicación dispone de un enlace **Abrir en Google Maps**, que abre un servicio externo.
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
- Si faltan registros, comprueba los filtros, los permisos de GPS y el diagnóstico visible; también puedes importar CSV/JSON.
- Ya no se cargan Leaflet ni las teselas de OpenStreetMap. Los enlaces externos a Google Maps requieren conexión.

## Medición y precisión

- **Medir desde mi ubicación:** obtiene una posición GPS *actual* y calcula la distancia geodésica en línea recta desde esa referencia a los registros y favoritos. Cada fila muestra la distancia. Pulsa **Medir** en un punto para actualizar la distancia indicada en su tarjeta y en el estado GPS, sin mostrar un mapa.
- La distancia **no equivale al trayecto por carretera** ni a su tiempo de desplazamiento. Se recalcula solo cuando solicitas medir o cuando se registra una nueva posición válida.
- En **Opciones y datos → Precisión mínima aceptable** ajusta el **error máximo permitido**, entre 5 y 5000 metros (valor inicial: 100 m). Por ejemplo, 30 significa aceptar solo lecturas del dispositivo con precisión declarada **±30 m o mejor**. Las lecturas menos precisas se rechazan y muestran un diagnóstico; no se guardan en el historial. El número no aumenta la precisión física del sensor.

## Copiar, compartir y dirección postal

- Cada registro y favorito presenta acciones frecuentes (**Google Maps**, **Medir**, **Copiar**, **Compartir**) y un menú desplegable **Opciones** para **Editar dirección**, **Buscar dirección**, **Añadir favorito** cuando corresponda y **Eliminar**.
- La información compartida incluye fecha y hora, coordenadas, precisión, dirección cuando se conoce, distancia de referencia si se midió, URL de Google Maps e indicaciones. Sin fichas, sin PDF, sin PNG y sin enlaces HTML exportables por separado.
- **Copiar todos los datos** y **Compartir todos los datos** agrupan el historial y los favoritos. En aplicaciones que admiten portapapeles HTML enriquecido, **Copiar** inserta un hipervínculo cuyo texto visible es la dirección completa; en aplicaciones de texto plano como WhatsApp se comparte la dirección escrita y la URL de Google Maps por separado, que el cliente puede convertir en enlace pulsable. No es posible forzar un texto de ancla personalizado dentro de un mensaje de WhatsApp.
- No se inventa una dirección exacta a partir de latitud/longitud. Para incluir la dirección completa sin inventarla debes escribirla con **Dirección** o configurar una **clave propia de Geoapify** (en Opciones y datos) para obtener una dirección *aproximada* con **Buscar dirección**. Verifica especialmente el número de puerta. Geoapify puede no conocer calles o números de ciertos lugares.
- La búsqueda es **manual y por punto**; no se geocodifica masivamente el historial ni automáticamente cada captura. Cada búsqueda envía las coordenadas a Geoapify solamente después de tu acción. La consulta utiliza su API de reverse geocoding (https://apidocs.geoapify.com/docs/geocoding/reverse-geocoding/).
- La clave Geoapify se guarda en **localStorage** de ese navegador y no se incluye en JSON exportado ni en los mensajes. Una clave usada desde una página web puede ser inspeccionada por su usuario; **restringe la clave por referente/origen a `https://gruemp.github.io`** desde su panel de Geoapify y revisa el consumo. Si no quieres emplear un servicio externo, escribe manualmente la dirección.
- **Descargar copia JSON** ahora conserva las direcciones y el umbral de precisión; la importación de backups de la versión actual también puede restaurar las direcciones. Los datos locales anteriores (`gpsTrackerState`) no se eliminan al actualizar, incluso si todavía incluyen campos de fichas antiguas que esta versión ya no muestra.

## Apps Script y conexiones (última etapa)

La integración con Google Apps Script/Google Sheets para leer direcciones, sincronizar registros entre dispositivos o almacenar automáticamente recorridos **no está activada**. Requiere validar la hoja y sus columnas, el protocolo existente de Apps Script, autorización de acceso, protección de datos y pruebas de sincronización. Hay una preparación detallada en [INTEGRACION_APPS_SCRIPT_PENDIENTE.md](INTEGRACION_APPS_SCRIPT_PENDIENTE.md) para retomar en ChatGPT Work. No publiques una hoja privada ni una URL sensible de Apps Script dentro de una página pública.


## Presentación del historial

- Las ubicaciones se organizan por día y hora, en tarjetas profesionales adaptables a teléfonos pequeños.
- Datos principales: hora, fecha, coordenadas, precisión y distancia, con dirección cuando está disponible.
- **Opciones** agrupa administración, modificación de dirección y eliminación, evitando nueve botones visibles en cada registro.
- **No se muestra ningún mapa dentro de la aplicación.** Google Maps solo se abre fuera del sistema cuando el usuario pulsa expresamente el enlace correspondiente.

/* Configuración de la instalación (no contiene contraseñas ni tokens).
 * El sitio configura estos dos identificadores públicos UNA SOLA VEZ.
 * Los usuarios no introducen ningún código.
 * Mantener OAuth con consentimiento y el API ejecutable con acceso restringido.
 * No añadir IDs de hojas, claves privadas, contraseñas ni tokens.
 * API ejecutable existente verificado el 2026-10-31, actualizado a versión 3, acceso Solo yo.
 * Cliente OAuth web existente facilitado por el propietario el 2026-10-31.
 * La configuración pública permite conectar desde dispositivos nuevos.
 * Los tokens siguen siendo temporales y requieren autorización de Google.
 */
window.CONTROL_GPS_GOOGLE_SERVICE=Object.freeze({
  clientId:'142119703617-089dbvcvfblkf0cmlbkjdg358t0rjtsp.apps.googleusercontent.com',
  deploymentId:'AKfycbwCROqvztyP393Th01zLu2W1SSRJ_ljM3_6qa1a8GOKGxfzR6cG-7A1m99hlD3RsjfV',
  // The embedded Google login returned HTTP 401 in the connected browser.
  sessionBridgeEnabled:false,
  // The private test Web App was archived after diagnosis.
  sessionBridgeUrl:''
});


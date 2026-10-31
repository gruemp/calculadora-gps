/* Configuración de la instalación (no contiene contraseñas ni tokens).
 * El propietario completa estos dos identificadores públicos UNA SOLA VEZ
 * cuando publica Control GPS. Los usuarios no introducen ningún código.
 * Mantener OAuth con consentimiento y el API ejecutable con acceso restringido.
 * No añadir IDs de hojas, claves privadas, contraseñas ni tokens.
 * Hasta entonces, los navegadores previamente configurados seguirán usando
 * sus identificadores locales; los nuevos funcionarán sin sincronización.
 */
window.CONTROL_GPS_GOOGLE_SERVICE=Object.freeze({
  clientId:'',
  deploymentId:''
});

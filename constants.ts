// CONFIGURACIÓN CENTRAL
// Cambia esta IP una sola vez aquí para que se refleje en toda la app.
export const BROKER_IP = "192.168.1.13";

// Configuración de MQTT
export const MQTT_CONFIG = {
  host: `ws://${BROKER_IP}:9001`, // Asumiendo puerto 9001 para WebSockets
  options: {
    clean: true,
    connectTimeout: 4000,
    clientId: `encuestas_${Math.random().toString(16).substring(2, 8)}`,
  },
  topics: {
    VOTE: 'encuestas/voto',
    ALERT: 'encuestas/alerta',
    SYNC_REQUEST: 'encuestas/sync/request', // Voters ask for surveys
    SYNC_DATA: 'encuestas/sync/data'        // Admin sends surveys
  }
};
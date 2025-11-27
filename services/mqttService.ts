import mqtt from 'mqtt';
import { MQTT_CONFIG } from '../constants';

// Singleton para el cliente MQTT
let client: mqtt.MqttClient | null = null;

export const connectMqtt = (
  onMessage: (topic: string, message: any) => void
) => {
  if (client) {
    // Si ya existe, actualizamos el listener de mensajes
    // Nota: removeAllListeners('message') podría afectar a otros componentes si no se gestiona con cuidado en una SPA compleja,
    // pero aquí asegura que el componente activo reciba los mensajes.
    client.removeAllListeners('message');
    client.on('message', (topic, payload) => {
      try {
        const parsed = JSON.parse(payload.toString());
        onMessage(topic, parsed);
      } catch (e) {
        console.error('Error parseando mensaje MQTT', e);
      }
    });
    
    // Si ya está conectado, no disparará el evento 'connect' de nuevo, 
    // así que el consumidor debe verificar client.connected
    return client;
  }

  console.log(`Conectando a MQTT en: ${MQTT_CONFIG.host}`);
  
  // Opciones para browser
  const options = {
    ...MQTT_CONFIG.options,
    protocolVersion: 5 as 5 // Force MQTT v5 explicit literal type
  };

  client = mqtt.connect(MQTT_CONFIG.host, options);

  client.on('connect', () => {
    console.log('MQTT Conectado');
    // Suscribirse a todos los temas relevantes
    client?.subscribe([
      MQTT_CONFIG.topics.VOTE,
      MQTT_CONFIG.topics.ALERT,
      MQTT_CONFIG.topics.SYNC_REQUEST,
      MQTT_CONFIG.topics.SYNC_DATA
    ], (err) => {
      if (err) console.error('Error suscribiendo:', err);
    });
  });

  client.on('message', (topic, message) => {
    try {
      const parsed = JSON.parse(message.toString());
      onMessage(topic, parsed);
    } catch (e) {
      console.error('Error parseando mensaje MQTT', e);
    }
  });

  client.on('error', (err) => {
    console.warn('Advertencia MQTT:', err.message);
  });

  return client;
};

export const publishVote = (payload: any) => {
  if (client && client.connected) {
    client.publish(MQTT_CONFIG.topics.VOTE, JSON.stringify(payload));
  }
};

export const publishAlert = (payload: any) => {
  if (client && client.connected) {
    client.publish(MQTT_CONFIG.topics.ALERT, JSON.stringify(payload));
  }
};

export const publishSyncRequest = () => {
  if (client && client.connected) {
    client.publish(MQTT_CONFIG.topics.SYNC_REQUEST, JSON.stringify({ req: 'all' }));
  }
};

export const publishSyncData = (surveys: any) => {
  if (client && client.connected) {
    // Retain: true ayuda a que nuevos clientes reciban la data inmediatamente
    client.publish(MQTT_CONFIG.topics.SYNC_DATA, JSON.stringify(surveys), { retain: true });
  }
};
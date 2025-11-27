# Sistema de Encuestas en Tiempo Real (React + MQTT)

Este es un sistema de votación en tiempo real distribuido que utiliza **MQTT sobre WebSockets** para la comunicación entre el panel de administrador y los dispositivos de los votantes.

## 📋 Características

*   **Panel Administrativo:** Creación, edición y eliminación de encuestas.
*   **Tiempo Real:** Los votos y gráficos se actualizan instantáneamente sin recargar la página.
*   **Reportes Completos:** Exportación de resultados a **CSV** (compatible con Excel) que incluye:
    *   Resumen de votos por opción.
    *   **Auditoría detallada:** Listado de cada voto individual con fecha, hora e ID del dispositivo (IP simulada).
*   **Seguridad:**
    *   Protección contra doble voto por IP simulada (localStorage).
    *   Bloqueo de encuestas por límite de tiempo.
    *   Registro de auditoría de intentos de fraude.
*   **Distribución:** Generación automática de códigos QR para compartir encuestas.

---

## 🚀 Requisitos Previos

1.  **Node.js**: [Descargar aquí](https://nodejs.org/).
2.  **Mosquitto MQTT Broker**: [Descargar aquí](https://mosquitto.org/download/).

---

## ⚙️ Configuración del Broker (Mosquitto)

Para que la página web pueda conectarse al broker, necesitas habilitar los **WebSockets** en el puerto 9001.

1.  Ve a la carpeta donde instalaste Mosquitto (ej: `C:\Program Files\mosquitto`).
2.  Crea o edita el archivo `mosquitto.conf` y asegúrate de agregar lo siguiente al final:

```text
# Puerto estándar para MQTT (opcional, para debug)
listener 1883
allow_anonymous true

# Puerto para WebSockets (REQUERIDO POR LA APP WEB)
listener 9001
protocol websockets
allow_anonymous true
```

---

## 🔧 Configuración de IP

El proyecto está preconfigurado para funcionar en la IP: **`192.168.52.100`**.

Si tu computadora cambia de IP, debes actualizarla en el archivo `constants.ts` (línea 3):

```typescript
export const BROKER_IP = "192.168.52.100"; // Cambia esto si tu IP cambia
```

---

## ▶️ Ejecución del Proyecto

### Paso 1: Iniciar el Broker MQTT

Abre una terminal (CMD o PowerShell) como Administrador, navega a la carpeta de Mosquitto y ejecuta el siguiente comando **exactamente como está escrito**:

```bash
mosquitto.exe -v -c mosquitto.conf
```

*   `-v`: Modo verbose (verás los logs de conexión en la consola).
*   `-c mosquitto.conf`: Carga la configuración con WebSockets habilitados.

### Paso 2: Iniciar la Aplicación Web

Abre otra terminal en la carpeta de este proyecto y ejecuta:

1.  Instalar dependencias (solo la primera vez):
    ```bash
    npm install
    ```

2.  Correr el servidor de desarrollo:
    ```bash
    npm start
    ```

---

## 📱 Uso

1.  **Acceso Admin:**
    *   Abre tu navegador en `http://localhost:3000` (o la IP indicada).
    *   La app redirigirá al login.
    *   **Usuario:** `admin`
    *   **Contraseña:** `1234`

2.  **Crear Encuesta:**
    *   Ve a la pestaña "Encuestas" -> "Crear Nueva".
    *   Define título, opciones y (opcionalmente) una fecha límite.

3.  **Votar:**
    *   Escanea el código QR de la encuesta con tu celular (asegúrate de estar en la misma red Wi-Fi).
    *   O abre el enlace generado en otra pestaña.
    *   Si intentas votar dos veces, verás una pantalla de "Acceso Denegado".

4.  **Ver Resultados y Descargar Reporte:**
    *   Ve a la pestaña "Resultados".
    *   Presiona **"Descargar Reporte Completo"** para obtener el archivo Excel con los gráficos y el log detallado de votos.
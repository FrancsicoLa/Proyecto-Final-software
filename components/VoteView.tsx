import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSurveys, hasVoted, recordVote, getClientIp, logSecurityEvent, saveAllSurveys } from '../services/storageService';
import { publishVote, publishAlert, connectMqtt, publishSyncRequest } from '../services/mqttService';
import { Survey } from '../types';
import { CheckCircle2, AlertTriangle, Send, RefreshCw, WifiOff, TimerOff } from 'lucide-react';
import { MQTT_CONFIG } from '../constants';

export const VoteView: React.FC = () => {
  const { id } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'success' | 'blocked' | 'error' | 'not_found' | 'expired'>('loading');
  const [clientIp, setClientIp] = useState('');
  const [mqttConnected, setMqttConnected] = useState(false);

  // Inicialización y carga de datos
  useEffect(() => {
    const ip = getClientIp();
    setClientIp(ip);
    
    // Función para buscar la encuesta en los datos locales
    const checkLocalSurvey = (surveys: Survey[]) => {
      const found = surveys.find(s => s.id === id);
      if (found) {
        setSurvey(found);
        
        // Verificar tiempo
        if (found.deadline && Date.now() > found.deadline) {
          setStatus('expired');
          return true;
        }

        if (hasVoted(found.id, ip)) {
          setStatus('blocked');
        } else {
          setStatus('idle');
        }
        return true;
      }
      return false;
    };

    // 1. Intentar cargar localmente primero
    const localSurveys = getSurveys();
    const foundLocal = checkLocalSurvey(localSurveys);

    // 2. Conectar a MQTT para recibir actualizaciones o pedir la encuesta
    const client = connectMqtt((topic, message) => {
      setMqttConnected(true);
      
      if (topic === MQTT_CONFIG.topics.SYNC_DATA) {
        // Recibimos datos actualizados del admin
        console.log('Datos de encuestas recibidos del Admin');
        saveAllSurveys(message); // Guardamos localmente
        checkLocalSurvey(message); // Re-verificamos si nuestra encuesta ahora existe
      }
    });

    if (client) {
      if (client.connected) {
        setMqttConnected(true);
        if (!foundLocal) {
          console.log('Solicitando sincronización inmediata...');
          publishSyncRequest();
        }
      }

      client.on('connect', () => {
        setMqttConnected(true);
        if (!getSurveys().find(s => s.id === id)) {
          console.log('Encuesta no encontrada localmente, solicitando al admin...');
          publishSyncRequest();
        }
      });
      
      client.on('offline', () => setMqttConnected(false));
      client.on('reconnect', () => console.log('Reconectando MQTT...'));
    }

    // Timeout si no encontramos la encuesta
    const timer = setTimeout(() => {
      const currentSurveys = getSurveys();
      const stillNotFound = !currentSurveys.find(s => s.id === id);
      
      if (stillNotFound && status === 'loading') {
        setStatus('not_found');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [id]);

  const handleVote = () => {
    if (!survey || !selectedOption) return;

    // Verificar si expiró antes de enviar
    if (survey.deadline && Date.now() > survey.deadline) {
      setStatus('expired');
      return;
    }

    // Verificar vulnerabilidad de doble voto nuevamente
    if (hasVoted(survey.id, clientIp)) {
      setStatus('blocked');
      const logEntry = {
        id: Math.random().toString(36).substring(2, 15),
        surveyId: survey.id,
        voterIp: clientIp,
        reason: 'Bloqueado: Intento de voto doble',
        timestamp: Date.now()
      };
      logSecurityEvent(logEntry);
      publishAlert(logEntry);
      return;
    }

    try {
      const voteRecord = {
        surveyId: survey.id,
        optionId: selectedOption,
        voterIp: clientIp,
        timestamp: Date.now()
      };
      
      recordVote(voteRecord);
      
      publishVote({
        surveyId: survey.id,
        optionId: selectedOption,
        count: 1
      });

      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin mb-4" />
        <p className="text-slate-600">Sincronizando encuesta...</p>
        {!mqttConnected && <p className="text-xs text-slate-400 mt-2">Conectando a {MQTT_CONFIG.host}...</p>}
      </div>
    );
  }

  if (status === 'not_found' && !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <WifiOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Encuesta no disponible</h2>
          <p className="text-slate-500 mt-2 mb-6">No se pudo obtener la información de la encuesta. Asegúrate de que el Administrador esté conectado para sincronizar.</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        {survey && (
          <>
            <div className={`p-8 text-white relative overflow-hidden ${status === 'expired' ? 'bg-slate-700' : 'bg-brand-600'}`}>
              <div className="relative z-10">
                <h1 className="text-3xl font-bold">{survey.title}</h1>
                <p className={`mt-2 text-lg opacity-90 ${status === 'expired' ? 'text-slate-300' : 'text-brand-100'}`}>
                  {survey.description}
                </p>
                {survey.deadline && (
                   <p className="text-xs mt-3 opacity-75 font-mono">
                     Cierra: {new Date(survey.deadline).toLocaleString()}
                   </p>
                )}
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full" />
            </div>

            <div className="p-8">
              {status === 'expired' ? (
                <div className="text-center py-8 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
                    <TimerOff className="w-10 h-10 text-slate-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Encuesta Finalizada</h2>
                  <p className="text-slate-600">El tiempo límite para participar en esta encuesta ha terminado.</p>
                </div>
              ) : status === 'success' ? (
                <div className="text-center py-8 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Voto Registrado!</h2>
                  <p className="text-slate-600">Gracias por participar.</p>
                </div>
              ) : status === 'blocked' ? (
                <div className="text-center py-8 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-50 rounded-full mb-6 ring-4 ring-yellow-100">
                    <AlertTriangle className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Acceso Denegado</h2>
                  <p className="text-slate-600 mb-6">Ya has participado en esta encuesta previamente.</p>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 inline-block text-xs text-slate-400 font-mono">
                    ID Dispositivo: {clientIp}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Opciones disponibles
                  </p>
                  {survey.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedOption(option.id)}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${
                        selectedOption === option.id
                          ? 'border-brand-500 bg-brand-50 shadow-md transform scale-[1.01]'
                          : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`font-medium text-lg relative z-10 ${selectedOption === option.id ? 'text-brand-700' : 'text-slate-700'}`}>
                        {option.text}
                      </span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center relative z-10 transition-colors ${
                        selectedOption === option.id ? 'border-brand-500 bg-white' : 'border-slate-300'
                      }`}>
                        {selectedOption === option.id && <div className="w-3 h-3 rounded-full bg-brand-500" />}
                      </div>
                    </button>
                  ))}

                  <button
                    onClick={handleVote}
                    disabled={!selectedOption}
                    className={`w-full mt-8 py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all duration-300 ${
                      selectedOption
                        ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg hover:shadow-brand-200 hover:-translate-y-1'
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <span>Confirmar Voto</span>
                    <Send className={`w-5 h-5 ${selectedOption ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              )}
            </div>
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
              <span>SecureVote System v1.0</span>
              <span className={`flex items-center gap-1 ${mqttConnected ? 'text-green-600' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${mqttConnected ? 'bg-green-500' : 'bg-red-400'}`} />
                {mqttConnected ? 'Conectado' : 'Offline'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { BarChart3, List, ShieldAlert, Plus, LogOut, Radio } from 'lucide-react';
import { getSurveys, saveSurvey, deleteSurvey, getLogs, logSecurityEvent, incrementSurveyVote } from '../services/storageService';
import { connectMqtt, publishSyncData } from '../services/mqttService';
import { Survey, SecurityLogEntry } from '../types';
import { SurveyList } from './SurveyList';
import { SurveyBuilder } from './SurveyBuilder';
import { StatsView } from './StatsView';
import { SecurityLog } from './SecurityLog';
import { MQTT_CONFIG } from '../constants';

interface Props {
  onLogout: () => void;
}

type Tab = 'surveys' | 'stats' | 'security';

export const AdminDashboard: React.FC<Props> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('surveys');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [logs, setLogs] = useState<SecurityLogEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);

  // Función para emitir las encuestas actuales a la red
  const broadcastSurveys = (currentSurveys: Survey[]) => {
    publishSyncData(currentSurveys);
  };

  useEffect(() => {
    // Carga inicial
    const initialSurveys = getSurveys();
    setSurveys(initialSurveys);
    setLogs(getLogs());

    // Publicar encuestas al conectar para que los votantes tengan datos
    // Pequeño delay para asegurar conexión
    setTimeout(() => broadcastSurveys(initialSurveys), 1000);

    // Conexión MQTT WebSocket
    connectMqtt((topic, message) => {
      if (topic === MQTT_CONFIG.topics.VOTE) {
        // Voto recibido de un cliente
        // 1. Actualizar DB Local del admin
        incrementSurveyVote(message.surveyId, message.optionId);
        
        // 2. Actualizar Estado UI
        setSurveys(getSurveys());
        
      } else if (topic === MQTT_CONFIG.topics.ALERT) {
        // Nueva alerta de seguridad (Voto duplicado bloqueado en cliente)
        logSecurityEvent(message);
        setLogs(getLogs());
        
      } else if (topic === MQTT_CONFIG.topics.SYNC_REQUEST) {
        // Un cliente pide las encuestas, se las enviamos
        const current = getSurveys();
        broadcastSurveys(current);
      }
    });
  }, []);

  const handleSaveSurvey = (survey: Survey) => {
    saveSurvey(survey);
    const updated = getSurveys();
    setSurveys(updated);
    broadcastSurveys(updated); // Sincronizar cambios a la red
    setIsCreating(false);
    setEditingSurvey(null);
  };

  const handleDeleteSurvey = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta encuesta?')) {
      deleteSurvey(id);
      const updated = getSurveys();
      setSurveys(updated);
      broadcastSurveys(updated); // Sincronizar cambios a la red
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 p-2 rounded-lg">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-none">Panel Admin</h1>
              <span className="text-xs text-brand-600 font-medium">Server Node</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden md:flex flex-col items-end mr-2">
               <span className="text-xs font-mono text-slate-400">Broker IP</span>
               <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                 {MQTT_CONFIG.host}
               </span>
             </div>
            <button 
              onClick={onLogout}
              className="flex items-center text-slate-500 hover:text-red-600 transition bg-slate-50 hover:bg-red-50 px-3 py-2 rounded-lg"
            >
              <LogOut className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('surveys')}
            className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 rounded-lg transition ${
              activeTab === 'surveys' 
                ? 'bg-brand-50 text-brand-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Encuestas</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 rounded-lg transition ${
              activeTab === 'stats' 
                ? 'bg-brand-50 text-brand-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Resultados</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 rounded-lg transition ${
              activeTab === 'security' 
                ? 'bg-brand-50 text-brand-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Seguridad</span>
            {logs.length > 0 && (
              <span className="ml-1 bg-red-100 text-red-600 text-xs py-0.5 px-1.5 rounded-full font-bold">
                {logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'surveys' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Gestión de Encuestas</h2>
                  <p className="text-sm text-slate-500">Crea y distribuye encuestas en tiempo real</p>
                </div>
                {!isCreating && !editingSurvey && (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl flex items-center space-x-2 text-sm font-bold transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Crear Nueva</span>
                  </button>
                )}
              </div>
              
              {isCreating || editingSurvey ? (
                <SurveyBuilder
                  initialData={editingSurvey}
                  onSave={handleSaveSurvey}
                  onCancel={() => {
                    setIsCreating(false);
                    setEditingSurvey(null);
                  }}
                />
              ) : (
                <SurveyList 
                  surveys={surveys} 
                  onEdit={setEditingSurvey} 
                  onDelete={handleDeleteSurvey} 
                />
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <StatsView surveys={surveys} />
          )}

          {activeTab === 'security' && (
            <SecurityLog logs={logs} />
          )}
        </div>
      </main>
    </div>
  );
};
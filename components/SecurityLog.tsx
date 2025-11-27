import React from 'react';
import { SecurityLogEntry } from '../types';
import { ShieldAlert, Clock } from 'lucide-react';

interface Props {
  logs: SecurityLogEntry[];
}

export const SecurityLog: React.FC<Props> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <p>No se han detectado intentos de vulnerabilidad.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-slate-100 bg-red-50 flex items-center text-red-700">
        <ShieldAlert className="w-5 h-5 mr-2" />
        <span className="font-semibold">Intentos de Duplicación Bloqueados</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">IP / Cliente ID</th>
              <th className="px-6 py-3">Razón</th>
              <th className="px-6 py-3">ID Encuesta</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 flex items-center text-slate-500">
                  <Clock className="w-3 h-3 mr-2" />
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-mono text-xs bg-slate-50 rounded">
                  {log.voterIp}
                </td>
                <td className="px-6 py-4 text-red-600 font-medium">
                  {log.reason}
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">
                  {log.surveyId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
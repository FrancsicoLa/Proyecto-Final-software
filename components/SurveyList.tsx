import React, { useState } from 'react';
import { Survey } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { Edit2, Trash2, QrCode, ExternalLink, Clock } from 'lucide-react';

interface Props {
  surveys: Survey[];
  onEdit: (survey: Survey) => void;
  onDelete: (id: string) => void;
}

export const SurveyList: React.FC<Props> = ({ surveys, onEdit, onDelete }) => {
  const [activeQr, setActiveQr] = useState<string | null>(null);

  if (surveys.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
        <p className="text-slate-500">No hay encuestas creadas aún.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {surveys.map((survey) => {
        const surveyUrl = `${window.location.origin}/#/vote/${survey.id}`;
        const isExpired = survey.deadline && Date.now() > survey.deadline;
        
        return (
          <div key={survey.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition ${isExpired ? 'border-red-200' : 'border-slate-200'}`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-slate-800 truncate flex-1 mr-2">{survey.title}</h3>
                {isExpired && (
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                    Finalizada
                  </span>
                )}
              </div>
              
              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{survey.description}</p>
              
              <div className="flex justify-between items-center text-sm text-slate-400 mb-2">
                <span>{new Date(survey.createdAt).toLocaleDateString()}</span>
                <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">
                  {survey.options.reduce((acc, curr) => acc + curr.votes, 0)} votos
                </span>
              </div>

              {survey.deadline && (
                <div className={`text-xs flex items-center mb-4 ${isExpired ? 'text-red-500 font-medium' : 'text-brand-600'}`}>
                  <Clock className="w-3 h-3 mr-1" />
                  {isExpired ? 'Finalizó el: ' : 'Termina el: '}
                  {new Date(survey.deadline).toLocaleString()}
                </div>
              )}

              {activeQr === survey.id && (
                <div className="mb-4 flex flex-col items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <QRCodeSVG value={surveyUrl} size={128} />
                  <a 
                    href={surveyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-brand-600 mt-2 hover:underline break-all text-center"
                  >
                    Ver Link
                  </a>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => onEdit(survey)}
                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setActiveQr(activeQr === survey.id ? null : survey.id)}
                    className={`p-2 rounded-lg transition ${activeQr === survey.id ? 'text-brand-600 bg-brand-50' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'}`}
                    title="Ver QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={() => onDelete(survey.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
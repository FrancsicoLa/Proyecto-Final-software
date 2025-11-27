import React, { useState } from 'react';
import { Survey, Option } from '../types';
import { Plus, Trash2, Save, X, Clock } from 'lucide-react';

interface Props {
  initialData: Survey | null;
  onSave: (survey: Survey) => void;
  onCancel: () => void;
}

// Helper seguro para generar IDs en red local (HTTP)
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Helper para convertir timestamp a string compatible con input datetime-local
const timestampToString = (ts?: number) => {
  if (!ts) return '';
  // Ajuste para obtener formato local YYYY-MM-DDThh:mm
  const date = new Date(ts);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

export const SurveyBuilder: React.FC<Props> = ({ initialData, onSave, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [deadlineStr, setDeadlineStr] = useState(timestampToString(initialData?.deadline));
  const [options, setOptions] = useState<Option[]>(
    initialData?.options || [
      { id: generateId(), text: '', votes: 0 },
      { id: generateId(), text: '', votes: 0 }
    ]
  );

  const addOption = () => {
    setOptions([...options, { id: generateId(), text: '', votes: 0 }]);
  };

  const removeOption = (id: string) => {
    setOptions(options.filter(o => o.id !== id));
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(o => o.id === id ? { ...o, text } : o));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const survey: Survey = {
      id: initialData?.id || generateId(),
      title,
      description,
      options,
      active: true,
      createdAt: initialData?.createdAt || Date.now(),
      deadline: deadlineStr ? new Date(deadlineStr).getTime() : undefined
    };
    onSave(survey);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">
          {initialData ? 'Editar Encuesta' : 'Crear Nueva Encuesta'}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            placeholder="Ej: Satisfacción del Cliente"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-24 resize-none"
            placeholder="Breve descripción del propósito de la encuesta..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Límite de Tiempo (Opcional)
          </label>
          <input
            type="datetime-local"
            value={deadlineStr}
            onChange={(e) => setDeadlineStr(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-slate-600"
          />
          <p className="text-xs text-slate-400 mt-1">Si se deja vacío, la encuesta estará abierta indefinidamente.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Opciones de Respuesta</label>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={option.id} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={option.text}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder={`Opción ${index + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(option.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-3 text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Opción</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition font-medium flex items-center space-x-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Encuesta</span>
          </button>
        </div>
      </form>
    </div>
  );
};
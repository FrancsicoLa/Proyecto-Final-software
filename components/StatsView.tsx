import React from 'react';
import { Survey, VoteRecord } from '../types';
import { getVotes } from '../services/storageService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download } from 'lucide-react';

interface Props {
  surveys: Survey[];
}

const COLORS = ['#0ea5e9', '#0284c7', '#0369a1', '#0c4a6e', '#38bdf8'];

export const StatsView: React.FC<Props> = ({ surveys }) => {
  const downloadCSV = (survey: Survey) => {
    const totalVotes = survey.options.reduce((acc, curr) => acc + curr.votes, 0);
    
    // Obtener votos individuales para el reporte detallado
    const allVotes = getVotes();
    const surveyVotes = allVotes.filter(v => v.surveyId === survey.id).sort((a, b) => b.timestamp - a.timestamp);

    // Mapeo rápido de ID de opción a Texto de opción para mostrar en el log
    const optionMap = new Map<string, string>();
    survey.options.forEach(o => optionMap.set(o.id, o.text));

    // Construir contenido CSV línea por línea
    const rows = [
      ['REPORTE DE ENCUESTA - SECUREVOTE SYSTEM'],
      [''],
      ['--- RESUMEN GENERAL ---'],
      ['Título', survey.title],
      ['Descripción', survey.description],
      ['Total Votos', totalVotes.toString()],
      ['Estado', survey.active ? 'Activa' : 'Inactiva'],
      ['Fecha Creación', new Date(survey.createdAt).toLocaleString()],
      ['Fecha Límite', survey.deadline ? new Date(survey.deadline).toLocaleString() : 'Indefinido'],
      [''], 
      ['RESULTADOS AGRUPADOS'],
      ['Opción', 'Cantidad Votos', 'Porcentaje'], // Cabeceras tabla resumen
    ];

    // Datos del gráfico (Resumen)
    survey.options.forEach(opt => {
      const percentage = totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(2) : "0";
      rows.push([opt.text, opt.votes.toString(), `${percentage}%`]);
    });

    // Datos detallados (Auditoría)
    rows.push(['']);
    rows.push(['--- DETALLE DE VOTOS (AUDITORÍA) ---']);
    rows.push(['Fecha y Hora', 'ID Cliente (IP Simulada)', 'Opción Elegida']);

    if (surveyVotes.length === 0) {
      rows.push(['No hay votos registrados individualmente en este nodo admin.', '', '']);
    } else {
      surveyVotes.forEach(vote => {
        const optionName = optionMap.get(vote.optionId) || 'Opción Desconocida/Eliminada';
        rows.push([
          new Date(vote.timestamp).toLocaleString(),
          vote.voterIp,
          optionName
        ]);
      });
    }

    // Convertir array a string CSV respetando comillas y caracteres especiales
    const csvContent = rows.map(e => e.map(cell => {
      const stringCell = String(cell);
      // Escapar comillas dobles y envolver en comillas si hay comas o comillas o saltos de linea
      if (stringCell.includes(',') || stringCell.includes('"') || stringCell.includes('\n')) {
        return `"${stringCell.replace(/"/g, '""')}"`;
      }
      return stringCell;
    }).join(',')).join('\n');

    // Blob con BOM (\uFEFF) para que Excel reconozca los caracteres especiales (tildes, ñ)
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    // Sanitizar nombre de archivo
    const safeTitle = survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
    link.setAttribute("download", `reporte_completo_${safeTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (surveys.length === 0) {
    return <div className="text-center text-slate-500 py-10">No hay datos para mostrar.</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {surveys.map((survey) => {
        const totalVotes = survey.options.reduce((acc, curr) => acc + curr.votes, 0);
        
        return (
          <div key={survey.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{survey.title}</h3>
                <p className="text-sm text-slate-500">Total Votos: {totalVotes}</p>
              </div>
              <button
                onClick={() => downloadCSV(survey)}
                className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 px-4 py-2 rounded-lg transition text-sm font-bold border border-green-200 shadow-sm"
                title="Descargar reporte detallado CSV"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Reporte Completo</span>
              </button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={survey.options} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="text" 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                    {survey.options.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
};
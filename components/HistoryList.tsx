import React from 'react';
import { DayLog, DateRange, Macros } from '../types';
import { Edit2 } from 'lucide-react';

interface HistoryListProps {
  logs: DayLog[];
  dateRange: DateRange;
  onSelectDate: (date: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ logs, dateRange, onSelectDate }) => {
  const filteredLogs = logs
    .filter(log => log.date >= dateRange.startDate && log.date <= dateRange.endDate)
    .sort((a, b) => b.date.localeCompare(a.date)); // Newest first

  if (filteredLogs.length === 0) {
    return (
        <div className="text-center p-8 text-slate-400 bg-white rounded-xl border border-slate-100">
            Nenhum registro encontrado para este período.
        </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium">
          <tr>
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Ingestão (kcal)</th>
            <th className="px-6 py-4">Exercício (kcal)</th>
            <th className="px-6 py-4 hidden sm:table-cell">Proteína</th>
            <th className="px-6 py-4 hidden sm:table-cell">Carbo</th>
            <th className="px-6 py-4 hidden sm:table-cell">Gordura</th>
            <th className="px-6 py-4 text-right">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredLogs.map(log => {
            let totalCals = 0;
            let totalP = 0;
            let totalC = 0;
            let totalF = 0;
            (Object.values(log.meals) as Macros[]).forEach(m => {
                totalCals += m.calories || 0;
                totalP += m.protein || 0;
                totalC += m.carbs || 0;
                totalF += m.fat || 0;
            });

            return (
              <tr key={log.date} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">
                    {new Date(log.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-slate-600">{totalCals}</td>
                <td className="px-6 py-4 text-orange-600 font-medium">{log.exerciseCalories}</td>
                <td className="px-6 py-4 hidden sm:table-cell text-blue-600">{totalP}g</td>
                <td className="px-6 py-4 hidden sm:table-cell text-green-600">{totalC}g</td>
                <td className="px-6 py-4 hidden sm:table-cell text-amber-600">{totalF}g</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onSelectDate(log.date)}
                    className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
};
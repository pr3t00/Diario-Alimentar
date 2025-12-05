import React, { useState, useEffect } from 'react';
import { DayLog, MealType, Macros } from '../types';
import { Plus, Save, Trash2, Dumbbell, Coffee, Sun, Moon, Cookie } from 'lucide-react';

interface LogFormProps {
  onSave: (log: DayLog) => void;
  existingLog?: DayLog;
  selectedDate: string;
}

const emptyMacros: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

const initialLog = (date: string): DayLog => ({
  date,
  meals: {
    [MealType.BREAKFAST]: { ...emptyMacros },
    [MealType.LUNCH]: { ...emptyMacros },
    [MealType.DINNER]: { ...emptyMacros },
    [MealType.SNACK]: { ...emptyMacros },
  },
  exerciseCalories: 0
});

export const LogForm: React.FC<LogFormProps> = ({ onSave, existingLog, selectedDate }) => {
  const [log, setLog] = useState<DayLog>(initialLog(selectedDate));
  const [activeTab, setActiveTab] = useState<MealType>(MealType.BREAKFAST);

  useEffect(() => {
    if (existingLog) {
      setLog(existingLog);
    } else {
      setLog(initialLog(selectedDate));
    }
  }, [existingLog, selectedDate]);

  const updateMeal = (type: MealType, field: keyof Macros, value: number) => {
    setLog(prev => ({
      ...prev,
      meals: {
        ...prev.meals,
        [type]: {
          ...prev.meals[type],
          [field]: value
        }
      }
    }));
  };

  const updateExercise = (val: number) => {
    setLog(prev => ({ ...prev, exerciseCalories: val }));
  };

  const handleSave = () => {
    onSave(log);
  };

  const getMealIcon = (type: MealType) => {
    switch (type) {
        case MealType.BREAKFAST: return <Coffee className="w-4 h-4" />;
        case MealType.LUNCH: return <Sun className="w-4 h-4" />;
        case MealType.DINNER: return <Moon className="w-4 h-4" />;
        case MealType.SNACK: return <Cookie className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">Diário Alimentar: {new Date(selectedDate).toLocaleDateString('pt-BR')}</h2>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-100">
        {Object.values(MealType).map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex-1 py-4 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap
              ${activeTab === type ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {getMealIcon(type)}
            {type}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6">
        {/* Meal Inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Calorias (kcal)</label>
            <input
              type="number"
              min="0"
              className="w-full p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              value={log.meals[activeTab].calories || ''}
              onChange={e => updateMeal(activeTab, 'calories', Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-500 mb-1 uppercase tracking-wider">Proteína (g)</label>
            <input
              type="number"
              min="0"
              className="w-full p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={log.meals[activeTab].protein || ''}
              onChange={e => updateMeal(activeTab, 'protein', Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-green-500 mb-1 uppercase tracking-wider">Carbo (g)</label>
            <input
              type="number"
              min="0"
              className="w-full p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
              value={log.meals[activeTab].carbs || ''}
              onChange={e => updateMeal(activeTab, 'carbs', Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-amber-500 mb-1 uppercase tracking-wider">Gordura (g)</label>
            <input
              type="number"
              min="0"
              className="w-full p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              value={log.meals[activeTab].fat || ''}
              onChange={e => updateMeal(activeTab, 'fat', Number(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>

        {/* Exercise Input */}
        <div className="border-t border-slate-100 pt-6 mt-6">
           <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
             <Dumbbell className="w-4 h-4" /> Exercícios do Dia
           </h3>
           <div className="flex items-center gap-4">
              <div className="w-full md:w-1/3">
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Calorias Queimadas (kcal)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  value={log.exerciseCalories || ''}
                  onChange={e => updateExercise(Number(e.target.value))}
                  placeholder="Ex: 300"
                />
              </div>
              <div className="flex-1 text-xs text-slate-400 mt-5">
                Insira o total gasto em atividades físicas (corrida, academia, esportes) além do seu gasto basal.
              </div>
           </div>
        </div>

        <div className="pt-4 flex justify-end">
            <button
                onClick={handleSave}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium shadow-md shadow-orange-200 transition-colors flex items-center gap-2"
            >
                <Save className="w-4 h-4" />
                Salvar Lançamentos
            </button>
        </div>
      </div>
    </div>
  );
};

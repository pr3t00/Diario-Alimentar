import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Save, User } from 'lucide-react';
import { getUserId } from '../services/firebase';

interface SettingsProps {
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const userId = getUserId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Configurações Pessoais</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nome / Apelido
          </label>
          <input
            type="text"
            required
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Taxa Metabólica Basal (TMB) - Calorias
          </label>
          <div className="relative">
            <input
              type="number"
              required
              min="500"
              max="5000"
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
              value={formData.tmb}
              onChange={(e) => setFormData({ ...formData, tmb: Number(e.target.value) })}
            />
            <span className="absolute right-4 top-3.5 text-slate-400 text-sm">kcal/dia</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            A TMB é a quantidade de calorias que seu corpo queima em repouso. Use uma calculadora online de Harris-Benedict se não souber o valor exato.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
                ID de Sincronização (Automático)
            </label>
            <div className="flex items-center gap-2 text-slate-600 font-mono text-sm break-all">
                <User className="w-4 h-4 flex-shrink-0" />
                {userId}
            </div>
            <p className="text-xs text-slate-400 mt-1">Este ID vincula seus dados na nuvem a este navegador.</p>
        </div>

        <div className="pt-4 border-t border-slate-100">
            <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white p-3 rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-md shadow-orange-200"
            >
                <Save className="w-5 h-5" />
                Salvar Configurações
            </button>
        </div>
      </form>
    </div>
  );
};
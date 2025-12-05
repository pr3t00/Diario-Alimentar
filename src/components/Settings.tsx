import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { Save, User, Copy, Check } from 'lucide-react';
import { getUserId } from '../services/firebase';

interface SettingsProps {
  settings: UserSettings;
  onSave: (newSettings: UserSettings, newUserId?: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [customUserId, setCustomUserId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCustomUserId(getUserId());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, customUserId);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(customUserId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
            <label className="block text-xs font-bold text-orange-800 mb-2 uppercase flex items-center gap-2">
                <User className="w-4 h-4" />
                ID de Sincronização (Multidispositivos)
            </label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    className="flex-1 text-sm font-mono text-slate-700 bg-white border border-orange-200 rounded-lg p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={customUserId}
                    onChange={(e) => setCustomUserId(e.target.value)}
                />
                <button
                    type="button"
                    onClick={copyToClipboard}
                    className="p-2 bg-white border border-orange-200 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors"
                    title="Copiar ID"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
            <p className="text-xs text-orange-700 mt-2 leading-relaxed">
                <strong>Atenção:</strong> Para acessar seus dados em outro computador ou celular, copie este código e cole no outro dispositivo. Ao clicar em Salvar, o aplicativo carregará os dados vinculados a este ID.
            </p>
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
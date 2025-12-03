import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, Settings as SettingsIcon, Calendar, Menu, Cloud, CloudOff } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { LogForm } from './components/LogForm';
import { Settings } from './components/Settings';
import { HistoryList } from './components/HistoryList';
import { DayLog, UserSettings, DateRange } from './types';
import { fetchUserData, saveDayLog, saveUserSettings, getUserId } from './services/firebase';

// Default initial state
const DEFAULT_SETTINGS: UserSettings = {
  tmb: 2000,
  name: 'Usuário'
};

const getDefaultDateRange = (): DateRange => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6); // Last 7 days
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
    };
};

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'log' | 'settings'>('dashboard');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [selectedLogDate, setSelectedLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // --- Effects (Persistence) ---
  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        const userId = getUserId();
        
        // Always try to load local backup first for speed
        const localSettings = localStorage.getItem('nutritrack_settings');
        const localLogs = localStorage.getItem('nutritrack_logs');
        
        if (localSettings) setSettings(JSON.parse(localSettings));
        if (localLogs) setLogs(JSON.parse(localLogs));

        try {
            const { settings: remoteSettings, logs: remoteLogs } = await fetchUserData(userId);
            
            // If we found data in cloud, it takes precedence or merges
            if (remoteSettings) {
                setSettings(remoteSettings);
                localStorage.setItem('nutritrack_settings', JSON.stringify(remoteSettings));
            }
            if (remoteLogs && remoteLogs.length > 0) {
                setLogs(remoteLogs);
                localStorage.setItem('nutritrack_logs', JSON.stringify(remoteLogs));
            }
            setIsOnline(true);
        } catch (error) {
            console.log("Running in offline/local mode or Firebase not configured.");
            setIsOnline(false);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  const handleSaveSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    // Optimistic update + Local Storage backup
    localStorage.setItem('nutritrack_settings', JSON.stringify(newSettings));
    
    try {
        await saveUserSettings(getUserId(), newSettings);
        alert("Configurações salvas na nuvem!");
        setIsOnline(true);
    } catch (e) {
        alert("Salvo localmente. Configure o Firebase para salvar na nuvem.");
        setIsOnline(false);
    }
    setActiveTab('dashboard');
  };

  const handleSaveLog = async (newLog: DayLog) => {
    const updatedLogs = logs.filter(l => l.date !== newLog.date);
    updatedLogs.push(newLog);
    setLogs(updatedLogs);
    
    // Local backup
    localStorage.setItem('nutritrack_logs', JSON.stringify(updatedLogs));

    try {
        await saveDayLog(getUserId(), newLog);
        alert("Lançamento salvo na nuvem!");
        setIsOnline(true);
    } catch (e) {
        alert("Salvo localmente. Configure o Firebase para salvar na nuvem.");
        setIsOnline(false);
    }
    setActiveTab('dashboard');
  };

  const handleEditDate = (date: string) => {
      setSelectedLogDate(date);
      setActiveTab('log');
  }

  // --- Render Helpers ---
  const currentLog = logs.find(l => l.date === selectedLogDate);

  const renderContent = () => {
    if (isLoading && logs.length === 0) {
        return <div className="flex h-full items-center justify-center text-slate-400">Carregando dados...</div>;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
            <div className="space-y-8">
                {/* Date Filter */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Período de Análise
                    </h2>
                    <div className="flex gap-2 items-center">
                        <input 
                            type="date" 
                            className="p-2 border border-slate-200 rounded-lg text-sm"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                        />
                        <span className="text-slate-400">-</span>
                        <input 
                            type="date" 
                            className="p-2 border border-slate-200 rounded-lg text-sm"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                        />
                    </div>
                </div>

                <Dashboard logs={logs} settings={settings} dateRange={dateRange} />
                
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Histórico do Período</h3>
                    <HistoryList logs={logs} dateRange={dateRange} onSelectDate={handleEditDate} />
                </div>
            </div>
        );
      case 'log':
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <label className="text-sm font-medium text-slate-700">Data do Lançamento:</label>
                    <input 
                        type="date" 
                        className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={selectedLogDate}
                        onChange={(e) => setSelectedLogDate(e.target.value)}
                    />
                 </div>
                <LogForm onSave={handleSaveLog} existingLog={currentLog} selectedDate={selectedLogDate} />
            </div>
        );
      case 'settings':
        return <Settings settings={settings} onSave={handleSaveSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50/50">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <span className="font-bold text-xl text-blue-600">NutriTrack AI</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            <Menu />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-10 h-full w-64 bg-white border-r border-slate-200 p-6 flex flex-col shadow-lg md:shadow-none transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-10 hidden md:block">
          <h1 className="text-2xl font-bold text-slate-800">NutriTrack <span className="text-blue-600">AI</span></h1>
          <p className="text-xs text-slate-400 mt-1">Olá, {settings.name}</p>
        </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>

          <button
            onClick={() => { setActiveTab('log'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'log' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            Lançar Diário
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            Configurações
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
           <div className="flex items-center gap-2 px-2 text-xs text-slate-400">
                {isOnline ? <Cloud className="w-4 h-4 text-green-500" /> : <CloudOff className="w-4 h-4 text-orange-400" />}
                {isOnline ? "Nuvem Conectada" : "Modo Offline"}
           </div>
           <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-600 font-semibold mb-1">TMB Atual</p>
              <p className="text-2xl font-bold text-blue-700">{settings.tmb} <span className="text-sm font-normal">kcal</span></p>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-x-hidden w-full">
        {renderContent()}
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/20 z-0 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
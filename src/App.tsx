import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, Settings as SettingsIcon, Calendar, Menu, Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, Square } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { LogForm } from './components/LogForm';
import { Settings } from './components/Settings';
import { HistoryList } from './components/HistoryList';
import { DayLog, UserSettings, DateRange } from './types';
import { fetchUserData, saveDayLog, saveUserSettings, getUserId, deleteDayLog } from './services/firebase';

// Default initial state
const DEFAULT_SETTINGS: UserSettings = {
  tmb: 2700,
  name: 'Usuário'
};

const getDefaultDateRange = (): DateRange => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 10); 
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
    };
};

type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error';

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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  // Helper to show temporary status
  const flashStatus = (status: SyncStatus) => {
    setSyncStatus(status);
    if (status === 'saved' || status === 'error') {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

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
                // Merge strategy: Remote wins if conflict, but here we just replace for simplicity
                setLogs(remoteLogs);
                localStorage.setItem('nutritrack_logs', JSON.stringify(remoteLogs));
            }
            setIsOnline(true);
        } catch (error) {
            console.log("Modo offline ativado: Firebase não configurado ou inacessível.");
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
    
    setSyncStatus('syncing');
    try {
        await saveUserSettings(getUserId(), newSettings);
        flashStatus('saved');
        setIsOnline(true);
    } catch (e) {
        flashStatus('error');
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

    setSyncStatus('syncing');
    try {
        await saveDayLog(getUserId(), newLog);
        flashStatus('saved');
        setIsOnline(true);
    } catch (e) {
        flashStatus('error');
        setIsOnline(false);
    }
    setActiveTab('dashboard');
  };

  const handleDeleteLog = async (date: string) => {
    // Optimistic update
    const updatedLogs = logs.filter(l => l.date !== date);
    setLogs(updatedLogs);
    localStorage.setItem('nutritrack_logs', JSON.stringify(updatedLogs));

    setSyncStatus('syncing');
    try {
        await deleteDayLog(getUserId(), date);
        flashStatus('saved');
        setIsOnline(true);
        // If we were viewing the log that was just deleted, go to dashboard
        if (activeTab === 'log' && selectedLogDate === date) {
            setActiveTab('dashboard');
        }
    } catch (e) {
        // If fail, rollback could be implemented here, but for now just show error
        flashStatus('error');
        setIsOnline(false);
    }
  };

  const handleEditDate = (date: string) => {
      setSelectedLogDate(date);
      setActiveTab('log');
  }

  // --- Render Helpers ---
  const currentLog = logs.find(l => l.date === selectedLogDate);

  const renderContent = () => {
    if (isLoading && logs.length === 0) {
        return <div className="flex h-full items-center justify-center text-slate-400 gap-2"><RefreshCw className="animate-spin w-5 h-5"/> Carregando dados...</div>;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
            <div className="space-y-8 animate-fade-in">
                {/* Date Filter */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-orange-500" />
                        </div>
                        Período de Análise
                    </h2>
                    <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-slate-100 gap-3">
                        <input 
                            type="date" 
                            className="bg-transparent text-sm text-slate-600 outline-none font-medium"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                        />
                        <span className="text-slate-300">-</span>
                        <input 
                            type="date" 
                            className="bg-transparent text-sm text-slate-600 outline-none font-medium"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                        />
                    </div>
                </div>

                <Dashboard logs={logs} settings={settings} dateRange={dateRange} />
                
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Histórico do Período</h3>
                    <HistoryList 
                        logs={logs} 
                        dateRange={dateRange} 
                        onSelectDate={handleEditDate} 
                        onDelete={handleDeleteLog} 
                    />
                </div>
            </div>
        );
      case 'log':
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <label className="text-sm font-medium text-slate-700">Data do Lançamento:</label>
                    <input 
                        type="date" 
                        className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        value={selectedLogDate}
                        onChange={(e) => setSelectedLogDate(e.target.value)}
                    />
                 </div>
                <LogForm 
                    onSave={handleSaveLog} 
                    onDelete={handleDeleteLog} 
                    existingLog={currentLog} 
                    selectedDate={selectedLogDate} 
                />
            </div>
        );
      case 'settings':
        return <Settings settings={settings} onSave={handleSaveSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FDFBF7]">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
        <span className="font-bold text-xl text-slate-800 flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">N</div>
             NutriTrack
        </span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            <Menu />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-10 h-screen w-64 bg-white border-r border-slate-100 p-6 flex flex-col shadow-xl md:shadow-none transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-orange-200">
            N
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-1">
                NutriTrack <Square className="w-3 h-3 text-orange-500 fill-orange-500" />
            </h1>
            <p className="text-xs text-slate-400 font-medium">Olá, {settings.name}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-2 flex-1">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-200' 
                : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>

          <button
            onClick={() => { setActiveTab('log'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'log' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-200' 
                : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            Lançar Diário
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'settings' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-200' 
                : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            Configurações
          </button>
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto pt-6 space-y-6">
           {/* Sync Status Indicator */}
           <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all bg-orange-50
                ${syncStatus === 'syncing' ? 'text-orange-600' : ''}
                ${syncStatus === 'saved' ? 'text-green-600' : ''}
                ${syncStatus === 'error' ? 'text-red-500' : ''}
                ${syncStatus === 'idle' ? 'text-slate-500' : ''}
           `}>
                {syncStatus === 'syncing' && <><RefreshCw className="w-3 h-3 animate-spin" /> Sincronizando...</>}
                {syncStatus === 'saved' && <><CheckCircle2 className="w-3 h-3" /> Salvo com sucesso</>}
                {syncStatus === 'error' && <><AlertCircle className="w-3 h-3" /> Erro ao salvar</>}
                {syncStatus === 'idle' && (
                    isOnline 
                    ? <><Cloud className="w-3 h-3 text-orange-500" /> Nuvem Conectada</>
                    : <><CloudOff className="w-3 h-3 text-slate-400" /> Modo Offline</>
                )}
           </div>

           {/* TMB Card */}
           <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-5 text-white shadow-lg shadow-orange-200">
              <p className="text-xs font-medium text-orange-100 mb-1">TMB Atual</p>
              <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold">{settings.tmb}</p>
                  <span className="text-sm font-medium opacity-80">kcal</span>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 lg:px-12 lg:py-10 overflow-x-hidden w-full relative">
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
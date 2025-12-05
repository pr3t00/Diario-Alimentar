import React, { useState } from 'react';
import { DayLog, UserSettings, DateRange, Macros } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Defs, LinearGradient } from 'recharts';
import { Activity, Flame, Utensils, TrendingDown, TrendingUp, Sparkles, BrainCircuit, Dumbbell, BedDouble, Scale, Zap } from 'lucide-react';
import { generateNutritionalInsight } from '../services/geminiService';

interface DashboardProps {
  logs: DayLog[];
  settings: UserSettings;
  dateRange: DateRange;
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, settings, dateRange }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // 1. Calculate Totals
  const calculateTotals = () => {
    let totalCaloriesIn = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalExerciseBurn = 0;

    // Filter logs by date range
    const filteredLogs = logs.filter(log => 
      log.date >= dateRange.startDate && log.date <= dateRange.endDate
    );

    filteredLogs.forEach(log => {
      // Sum meals
      (Object.values(log.meals) as Macros[]).forEach(meal => {
        totalCaloriesIn += meal.calories || 0;
        totalProtein += meal.protein || 0;
        totalCarbs += meal.carbs || 0;
        totalFat += meal.fat || 0;
      });
      // Sum exercise
      totalExerciseBurn += log.exerciseCalories || 0;
    });

    const daysCount = Math.max(1, Math.floor((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    // Weight Logic
    // Total Burned = (TMB * Days) + Exercise
    const totalBasalBurn = settings.tmb * daysCount;
    const totalBurned = totalBasalBurn + totalExerciseBurn;
    
    // Balance
    const calorieBalance = totalCaloriesIn - totalBurned; // Com exercício
    const basalBalance = totalCaloriesIn - totalBasalBurn; // Sem exercício
    
    // Weight change (7000kcal = 1kg)
    const weightChangeKg = calorieBalance / 7000;

    return {
      filteredLogs,
      totals: {
        calories: totalCaloriesIn,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat
      },
      totalBasalBurn,
      totalBurned,
      totalExerciseBurn,
      calorieBalance,
      basalBalance,
      weightChangeKg,
      daysCount
    };
  };

  const stats = calculateTotals();

  const handleAiAnalysis = async () => {
    setIsLoadingAi(true);
    try {
      const insight = await generateNutritionalInsight(
        stats.filteredLogs,
        settings,
        stats.totals,
        stats.weightChangeKg
      );
      setAiInsight(insight);
    } catch (e) {
      setAiInsight("Erro ao gerar análise.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Prepare chart data with daily macros calculation
  const chartData = stats.filteredLogs.map(log => {
    let dailyCals = 0;
    let dailyP = 0;
    let dailyC = 0;
    let dailyF = 0;

    (Object.values(log.meals) as Macros[]).forEach(m => {
        dailyCals += m.calories || 0;
        dailyP += m.protein || 0;
        dailyC += m.carbs || 0;
        dailyF += m.fat || 0;
    });

    return {
      date: log.date.slice(5), // MM-DD
      fullDate: new Date(log.date).toLocaleDateString('pt-BR'),
      ingestao: dailyCals,
      gasto: settings.tmb + (log.exerciseCalories || 0),
      // Add macros for tooltip
      protein: dailyP,
      carbs: dailyC,
      fat: dailyF
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl text-sm z-50">
          <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{data.fullDate}</p>
          
          <div className="space-y-1 mb-3">
             <div className="flex items-center justify-between gap-4">
                <span className="text-blue-500 font-medium flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Ingestão
                </span>
                <span className="font-bold text-slate-700">{data.ingestao} kcal</span>
             </div>
             <div className="flex items-center justify-between gap-4">
                <span className="text-orange-500 font-medium flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div> Gasto
                </span>
                <span className="font-bold text-slate-700">{data.gasto} kcal</span>
             </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-lg space-y-1">
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Macros do Dia</p>
            <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Proteína
                </span>
                <span className="font-medium">{data.protein.toFixed(0)}g</span>
            </div>
            <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Carbo
                </span>
                <span className="font-medium">{data.carbs.toFixed(0)}g</span>
            </div>
            <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 flex items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Gordura
                </span>
                <span className="font-medium">{data.fat.toFixed(0)}g</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Stats - Inputs and Outputs Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingestão Total */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-slate-500">Ingestão Total</h3>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Utensils className="h-5 w-5 text-orange-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totals.calories.toLocaleString()} kcal</div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Consumo de alimentos</p>
        </div>

        {/* Gasto Sem Exercício (Basal) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-slate-500">Gasto Sem Exercício</h3>
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalBasalBurn.toLocaleString()} kcal</div>
          <p className="text-xs text-slate-400 mt-1 font-medium">TMB ({settings.tmb}) × {stats.daysCount} dias</p>
        </div>

        {/* Queima com Exercício */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-slate-500">Queima c/ Exercício</h3>
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-teal-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-500">{stats.totalExerciseBurn.toLocaleString()} kcal</div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Atividades físicas extras</p>
        </div>

        {/* Gasto Total (Soma) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-slate-500">Gasto Total</h3>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Activity className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-500">{stats.totalBurned.toLocaleString()} kcal</div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Basal + Exercícios</p>
        </div>
      </div>

      {/* 2. Results Section (Balances & Weight) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Saldo Sem Exercício */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-slate-500">Saldo (Sem Exercício)</h3>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <TrendingDown className={`h-5 w-5 text-red-400`} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${stats.basalBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {stats.basalBalance > 0 ? '+' : ''}{stats.basalBalance.toLocaleString()} kcal
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Ingestão vs. TMB (Sedentário)
          </p>
        </div>

        {/* Saldo Com Exercício */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-slate-500">Saldo (Real / Com Treino)</h3>
             <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <TrendingUp className={`h-5 w-5 text-red-400`} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${stats.calorieBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {stats.calorieBalance > 0 ? '+' : ''}{stats.calorieBalance.toLocaleString()} kcal
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
             Déficit Total
          </p>
        </div>

        {/* Projeção de Peso */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-sm font-medium text-slate-500">Projeção de Peso</h3>
             <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <Scale className="h-5 w-5 text-orange-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {stats.weightChangeKg > 0 ? '+' : ''}{stats.weightChangeKg.toFixed(2)} kg
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Baseado no Saldo Real (7000kcal/kg)</p>
        </div>
      </div>

      {/* 3. Main Chart */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-50">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Ingestão vs Gasto Diário</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={8}>
                <defs>
                    <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="colorIngestao" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.7}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Legend wrapperStyle={{paddingTop: '20px'}} iconType='square' />
                <Bar dataKey="gasto" name="Gasto Total (kcal)" fill="url(#colorGasto)" radius={[6, 6, 6, 6]} maxBarSize={40} />
                <Bar dataKey="ingestao" name="Ingestão (kcal)" fill="url(#colorIngestao)" radius={[6, 6, 6, 6]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* 4. AI Insight Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Análise Nutricional Inteligente
          </h3>
          <button 
            onClick={handleAiAnalysis}
            disabled={isLoadingAi}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm shadow-orange-200"
          >
            {isLoadingAi ? <span className="animate-spin">⌛</span> : <BrainCircuit className="w-4 h-4" />}
            {isLoadingAi ? "Analisando..." : "Gerar Insights"}
          </button>
        </div>
        
        {aiInsight ? (
          <div className="prose prose-sm max-w-none text-slate-700 bg-orange-50/50 p-5 rounded-xl border border-orange-100">
            <div className="whitespace-pre-wrap leading-relaxed">{aiInsight}</div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">
            Clique no botão para receber uma análise detalhada do seu progresso, macros e dicas personalizadas usando Inteligência Artificial.
          </p>
        )}
      </div>
    </div>
  );
};

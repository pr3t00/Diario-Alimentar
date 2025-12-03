import React, { useState } from 'react';
import { DayLog, UserSettings, DateRange, Macros } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Flame, Utensils, TrendingDown, TrendingUp, Sparkles, BrainCircuit } from 'lucide-react';
import { generateNutritionalInsight } from '../services/geminiService';

interface DashboardProps {
  logs: DayLog[];
  settings: UserSettings;
  dateRange: DateRange;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

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
    const calorieBalance = totalCaloriesIn - totalBurned;
    
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
      totalBurned,
      totalExerciseBurn,
      calorieBalance,
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

  const macroData = [
    { name: 'Proteína', value: stats.totals.protein, color: '#3b82f6' },
    { name: 'Carbo', value: stats.totals.carbs, color: '#10b981' },
    { name: 'Gordura', value: stats.totals.fat, color: '#f59e0b' },
  ];

  const chartData = stats.filteredLogs.map(log => {
    let dailyCals = 0;
    (Object.values(log.meals) as Macros[]).forEach(m => dailyCals += m.calories || 0);
    return {
      date: log.date.slice(5), // MM-DD
      ingestao: dailyCals,
      gasto: settings.tmb + (log.exerciseCalories || 0),
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500">Ingestão Total</h3>
            <Utensils className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totals.calories.toLocaleString()} kcal</div>
          <p className="text-xs text-slate-400 mt-1">no período selecionado</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500">Gasto Total</h3>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalBurned.toLocaleString()} kcal</div>
          <p className="text-xs text-slate-400 mt-1">{stats.totalExerciseBurn} kcal de exercícios</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500">Saldo Calórico</h3>
            <Activity className={`h-4 w-4 ${stats.calorieBalance > 0 ? 'text-red-500' : 'text-green-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${stats.calorieBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.calorieBalance > 0 ? '+' : ''}{stats.calorieBalance.toLocaleString()} kcal
          </div>
          <p className="text-xs text-slate-400 mt-1">Balanço Final</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            {stats.weightChangeKg < 0 ? <TrendingDown size={64} /> : <TrendingUp size={64} />}
          </div>
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500">Projeção de Peso</h3>
            <ScaleIcon weight={stats.weightChangeKg} />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.weightChangeKg > 0 ? '+' : ''}{stats.weightChangeKg.toFixed(2)} kg
          </div>
          <p className="text-xs text-slate-400 mt-1">Baseado em 7000kcal/kg</p>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Ingestão vs Gasto Diário</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                <Bar dataKey="ingestao" name="Ingestão (kcal)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gasto" name="Gasto Total (kcal)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Macro Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-slate-800 mb-2 w-full text-left">Distribuição de Macros (Total)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full mt-4 space-y-2 text-sm">
             <div className="flex justify-between">
                <span className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>Proteína</span>
                <span className="font-bold">{stats.totals.protein.toFixed(0)}g</span>
             </div>
             <div className="flex justify-between">
                <span className="flex items-center"><div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>Carbo</span>
                <span className="font-bold">{stats.totals.carbs.toFixed(0)}g</span>
             </div>
             <div className="flex justify-between">
                <span className="flex items-center"><div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>Gordura</span>
                <span className="font-bold">{stats.totals.fat.toFixed(0)}g</span>
             </div>
          </div>
        </div>
      </div>

      {/* AI Insight Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5" />
            Análise Nutricional Inteligente
          </h3>
          <button 
            onClick={handleAiAnalysis}
            disabled={isLoadingAi}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
          >
            {isLoadingAi ? <span className="animate-spin">⌛</span> : <Sparkles className="w-4 h-4" />}
            {isLoadingAi ? "Analisando..." : "Gerar Insights"}
          </button>
        </div>
        
        {aiInsight ? (
          <div className="prose prose-sm max-w-none text-slate-700 bg-white p-4 rounded-lg shadow-sm">
            <div className="whitespace-pre-wrap leading-relaxed">{aiInsight}</div>
          </div>
        ) : (
          <p className="text-indigo-400 text-sm italic">
            Clique no botão para receber uma análise detalhada do seu progresso, macros e dicas personalizadas usando Inteligência Artificial.
          </p>
        )}
      </div>
    </div>
  );
};

// Helper component for icon based on weight direction
const ScaleIcon = ({ weight }: { weight: number }) => {
    if (weight < -0.1) return <TrendingDown className="h-4 w-4 text-green-500" />;
    if (weight > 0.1) return <TrendingUp className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-slate-500" />;
}
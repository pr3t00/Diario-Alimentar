import { GoogleGenerativeAI } from "@google/generative-ai";
import { DayLog, UserSettings, Macros } from "../types";

// ATENÇÃO: Em projetos Vite, usamos import.meta.env para variáveis
// Para testar agora, você pode colocar sua chave direto aqui entre aspas,
// mas não mostre para ninguém. Ex: const apiKey = "AIzaSy...";
const apiKey = ""; 

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const generateNutritionalInsight = async (
  logs: DayLog[],
  settings: UserSettings,
  totalStats: Macros,
  projectedWeightChange: number
): Promise<string> => {
  if (!genAI) {
    return "Chave de API não configurada. Configure a variável apiKey no arquivo geminiService.ts";
  }

  try {
    // Usando o modelo padrão estável
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const analysisData = {
      periodDays: logs.length,
      tmb: settings.tmb,
      totalIntake: totalStats,
      projectedWeightChangeKg: projectedWeightChange.toFixed(3),
      dailyAverage: {
          calories: (totalStats.calories / Math.max(1, logs.length)).toFixed(0),
          protein: (totalStats.protein / Math.max(1, logs.length)).toFixed(0),
          carbs: (totalStats.carbs / Math.max(1, logs.length)).toFixed(0),
          fat: (totalStats.fat / Math.max(1, logs.length)).toFixed(0),
      }
    };

    const prompt = `
      Atue como um nutricionista esportivo sênior. Analise os seguintes dados do usuário:
      ${JSON.stringify(analysisData, null, 2)}

      O cálculo de mudança de peso foi feito baseada na regra de 7000kcal = 1kg.
      
      Por favor, forneça um resumo curto e motivacional (máximo 3 parágrafos) em Português do Brasil:
      1. Avalie a qualidade da distribuição de macros.
      2. Comente sobre o déficit ou superávit calórico.
      3. Dê uma dica prática para melhorar os resultados.
      Use formatação Markdown simples.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text || "Não foi possível gerar uma análise no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao conectar com a IA. Verifique sua chave de API.";
  }
};

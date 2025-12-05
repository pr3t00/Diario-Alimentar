import { GoogleGenAI } from "@google/genai";
import { DayLog, UserSettings, Macros } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize only if key exists to avoid immediate crash, handle check later
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateNutritionalInsight = async (
  logs: DayLog[],
  settings: UserSettings,
  totalStats: Macros,
  projectedWeightChange: number
): Promise<string> => {
  if (!ai) {
    return "Chave de API não configurada. Por favor, configure a API_KEY.";
  }

  const model = "gemini-2.5-flash";
  
  const analysisData = {
    periodDays: logs.length,
    tmb: settings.tmb,
    totalIntake: totalStats,
    projectedWeightChangeKg: projectedWeightChange.toFixed(3),
    dailyAverage: {
        calories: (totalStats.calories / logs.length).toFixed(0),
        protein: (totalStats.protein / logs.length).toFixed(0),
        carbs: (totalStats.carbs / logs.length).toFixed(0),
        fat: (totalStats.fat / logs.length).toFixed(0),
    }
  };

  const prompt = `
    Atue como um nutricionista esportivo sênior. Analise os seguintes dados do usuário:
    ${JSON.stringify(analysisData, null, 2)}

    O cálculo de mudança de peso foi feito baseada na regra de 7000kcal = 1kg.
    
    Por favor, forneça um resumo curto e motivacional (máximo 3 parágrafos) em Português do Brasil:
    1. Avalie a qualidade da distribuição de macros (Proteína, Carboidrato, Gordura).
    2. Comente sobre o déficit ou superávit calórico.
    3. Dê uma dica prática para melhorar os resultados baseada nos dados.
    Use formatação Markdown simples.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "Não foi possível gerar uma análise no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao conectar com a IA. Verifique sua chave de API ou tente novamente mais tarde.";
  }
};

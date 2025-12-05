export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export enum MealType {
  BREAKFAST = 'Café da Manhã',
  LUNCH = 'Almoço',
  DINNER = 'Jantar',
  SNACK = 'Lanche',
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  meals: Record<MealType, Macros>;
  exerciseCalories: number;
}

export interface UserSettings {
  tmb: number; // Taxa Metabólica Basal
  name: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

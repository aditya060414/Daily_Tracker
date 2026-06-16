export type IncomeFrequency = 'monthly' | 'weekly' | 'one-time';

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  createdAt: string;
}

export interface SavingsBucket {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
}

export type ExpenseCategory = 'Food' | 'Transport' | 'Entertainment' | 'Subscriptions' | 'Health' | 'Other';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  note?: string;
  isRecurring: boolean;
  createdAt: string;
}

export interface CategoryBudget {
  category: ExpenseCategory;
  limit: number;
}

export interface MonthlySummaryMock {
  month: string; // e.g., 'Jan', 'Feb'
  income: number;
  expenses: number;
  savings: number;
}

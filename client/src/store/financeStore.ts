import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  IncomeSource, 
  SavingsBucket, 
  Expense, 
  CategoryBudget, 
  ExpenseCategory 
} from '../types/finance';

interface FinanceState {
  incomes: IncomeSource[];
  savings: SavingsBucket[];
  expenses: Expense[];
  budgets: CategoryBudget[];
  netWorthAssets: number;
  netWorthLiabilities: number;
  totalBudgetLimit: number;
  paydayDay: number; // Day of month for payday (1-31)
  
  // Actions
  addIncome: (income: Omit<IncomeSource, 'id' | 'createdAt'>) => void;
  editIncome: (id: string, income: Partial<Omit<IncomeSource, 'id' | 'createdAt'>>) => void;
  deleteIncome: (id: string) => void;
  
  addSavings: (bucket: Omit<SavingsBucket, 'id' | 'createdAt'>) => void;
  editSavings: (id: string, bucket: Partial<Omit<SavingsBucket, 'id' | 'createdAt'>>) => void;
  deleteSavings: (id: string) => void;
  updateSavingsAmount: (id: string, currentAmount: number) => void;
  
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  editExpense: (id: string, expense: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;
  deleteExpense: (id: string) => void;
  
  updateBudgetLimit: (limit: number) => void;
  setCategoryBudget: (category: ExpenseCategory, limit: number) => void;
  updateNetWorth: (assets: number, liabilities: number) => void;
  setPaydayDay: (day: number) => void;
}

// Sensible defaults
const defaultBudgets: CategoryBudget[] = [
  { category: 'Food', limit: 0 },
  { category: 'Transport', limit: 0 },
  { category: 'Entertainment', limit: 0 },
  { category: 'Subscriptions', limit: 0 },
  { category: 'Health', limit: 0 },
  { category: 'Other', limit: 0 },
];

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      incomes: [],
      savings: [],
      expenses: [],
      budgets: defaultBudgets,
      netWorthAssets: 0,
      netWorthLiabilities: 0,
      totalBudgetLimit: 0,
      paydayDay: 1, // Payday on the 1st of every month
      
      addIncome: (income) => set((state) => ({
        incomes: [
          ...state.incomes,
          {
            ...income,
            id: `inc-${Date.now()}`,
            createdAt: new Date().toISOString(),
          }
        ]
      })),
      
      editIncome: (id, updatedFields) => set((state) => ({
        incomes: state.incomes.map((inc) => inc.id === id ? { ...inc, ...updatedFields } : inc)
      })),
      
      deleteIncome: (id) => set((state) => ({
        incomes: state.incomes.filter((inc) => inc.id !== id)
      })),
      
      addSavings: (bucket) => set((state) => ({
        savings: [
          ...state.savings,
          {
            ...bucket,
            id: `sav-${Date.now()}`,
            createdAt: new Date().toISOString(),
          }
        ]
      })),
      
      editSavings: (id, updatedFields) => set((state) => ({
        savings: state.savings.map((sav) => sav.id === id ? { ...sav, ...updatedFields } : sav)
      })),
      
      deleteSavings: (id) => set((state) => ({
        savings: state.savings.filter((sav) => sav.id !== id)
      })),
      
      updateSavingsAmount: (id, currentAmount) => set((state) => ({
        savings: state.savings.map((sav) => sav.id === id ? { ...sav, currentAmount } : sav)
      })),
      
      addExpense: (expense) => set((state) => ({
        expenses: [
          ...state.expenses,
          {
            ...expense,
            id: `exp-${Date.now()}`,
            createdAt: new Date().toISOString(),
          }
        ]
      })),
      
      editExpense: (id, updatedFields) => set((state) => ({
        expenses: state.expenses.map((exp) => exp.id === id ? { ...exp, ...updatedFields } : exp)
      })),
      
      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter((exp) => exp.id !== id)
      })),
      
      updateBudgetLimit: (limit) => set({ totalBudgetLimit: limit }),
      
      setCategoryBudget: (category, limit) => set((state) => {
        const index = state.budgets.findIndex((b) => b.category === category);
        if (index > -1) {
          const updated = [...state.budgets];
          updated[index] = { category, limit };
          return { budgets: updated };
        } else {
          return { budgets: [...state.budgets, { category, limit }] };
        }
      }),
      
      updateNetWorth: (assets, liabilities) => set({
        netWorthAssets: assets,
        netWorthLiabilities: liabilities,
      }),

      setPaydayDay: (day) => set({ paydayDay: day }),
    }),
    {
      name: 'dailyos-finance-v2',
    }
  )
);

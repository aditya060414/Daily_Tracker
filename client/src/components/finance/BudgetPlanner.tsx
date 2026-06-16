import React, { useState } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Edit, Save, X, Wallet, ShieldAlert } from 'lucide-react';
import { ExpenseCategory } from '../../types/finance';

export const BudgetPlanner: React.FC = () => {
  const {
    expenses,
    budgets,
    totalBudgetLimit,
    updateBudgetLimit,
    setCategoryBudget,
  } = useFinanceStore();

  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [editingLimit, setEditingLimit] = useState('');

  const [isEditingTotalLimit, setIsEditingTotalLimit] = useState(false);
  const [newTotalLimit, setNewTotalLimit] = useState(totalBudgetLimit.toString());

  // Date constants to filter current month
  const today = new Date();
  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  // Group actual expenses this month by category
  const categories: ExpenseCategory[] = ['Food', 'Transport', 'Entertainment', 'Subscriptions', 'Health', 'Other'];
  
  const categoryTotals = categories.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  expenses.forEach((exp) => {
    if (exp.date >= startOfThisMonth && exp.date <= endOfThisMonth) {
      if (categoryTotals[exp.category] !== undefined) {
        categoryTotals[exp.category] += exp.amount;
      } else {
        categoryTotals['Other'] += exp.amount;
      }
    }
  });

  // Combine Budget vs Actual data for the BarChart
  const chartData = categories.map((cat) => {
    const budgetObj = budgets.find((b) => b.category === cat);
    const limit = budgetObj ? budgetObj.limit : 0;
    const actual = categoryTotals[cat];
    return {
      category: cat,
      Budgeted: limit,
      Spent: actual,
    };
  });

  // Calculate total budgeted amount across categories
  const totalCategoryBudgeted = budgets.reduce((acc, b) => acc + b.limit, 0);

  // Edit Handlers
  const handleEditCategoryStart = (cat: ExpenseCategory, currentLimit: number) => {
    setEditingCategory(cat);
    setEditingLimit(currentLimit.toString());
  };

  const handleSaveCategoryBudget = (cat: ExpenseCategory) => {
    const limitNum = parseFloat(editingLimit);
    if (!isNaN(limitNum) && limitNum >= 0) {
      setCategoryBudget(cat, limitNum);
      setEditingCategory(null);
    }
  };

  const handleSaveTotalLimit = () => {
    const limitNum = parseFloat(newTotalLimit);
    if (!isNaN(limitNum) && limitNum >= 0) {
      updateBudgetLimit(limitNum);
      setIsEditingTotalLimit(false);
    }
  };

  return (
    <div className="bg-panel border border-border rounded-lg p-5 space-y-6 flex flex-col">
      {/* Header */}
      <div className="border-b border-border pb-3 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-off-white">Budget Planner</h3>
          <p className="text-[10px] text-off-white-muted font-mono mt-0.5">
            Configure monthly category limits and audit actual expenditures
          </p>
        </div>

        {/* Total Budget Edit */}
        <div className="flex items-center gap-2 font-mono text-xs shrink-0 bg-card border border-border/80 rounded px-3 py-1.5">
          <Wallet className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="text-off-white-muted">Total Limit:</span>
          {isEditingTotalLimit ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                className="w-16 bg-darkbg border border-border focus:border-accent/50 outline-none text-xs px-1.5 py-0.5 rounded text-off-white text-center font-bold"
                value={newTotalLimit}
                onChange={(e) => setNewTotalLimit(e.target.value)}
              />
              <button onClick={handleSaveTotalLimit} className="text-emerald-400 hover:text-emerald-300">
                <Save className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setIsEditingTotalLimit(false)} className="text-red-400 hover:text-red-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-bold text-accent">₹{totalBudgetLimit.toLocaleString('en-IN')}</span>
              <button
                onClick={() => {
                  setNewTotalLimit(totalBudgetLimit.toString());
                  setIsEditingTotalLimit(true);
                }}
                className="p-0.5 text-off-white-muted hover:text-off-white"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-[250px] w-full font-mono text-[9px] bg-card/20 border border-border/40 rounded p-2.5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="category" stroke="#8c8c8c" tick={{ fontSize: 9 }} />
            <YAxis stroke="#8c8c8c" tick={{ fontSize: 9 }} />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
              contentStyle={{
                backgroundColor: '#171717',
                borderColor: '#262626',
                borderRadius: '6px',
                color: '#f5f5f5',
                fontFamily: 'monospace',
                fontSize: '11px',
              }}
              formatter={(value) => [`₹${(value as number).toLocaleString('en-IN')}`]}
            />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Bar dataKey="Budgeted" fill="#3b82f6" fillOpacity={0.65} stroke="#3b82f6" strokeWidth={1} radius={[2, 2, 0, 0]} />
            <Bar dataKey="Spent" fill="#ec4899" fillOpacity={0.65} stroke="#ec4899" strokeWidth={1} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category List & Remaining Chips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const budgetObj = budgets.find((b) => b.category === cat);
          const limit = budgetObj ? budgetObj.limit : 0;
          const spent = categoryTotals[cat];
          const remaining = limit - spent;
          const isEditMode = editingCategory === cat;

          // Compute remaining budget status colors
          let statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          let statusText = 'Safe';
          const percentRemaining = limit > 0 ? (remaining / limit) * 100 : 0;

          if (remaining < 0) {
            statusColor = 'bg-red-500/10 text-red-400 border-red-500/20';
            statusText = 'Limit Exceeded';
          } else if (percentRemaining <= 25) {
            statusColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            statusText = 'Critical Warning';
          }

          return (
            <div key={cat} className="bg-card border border-border/60 hover:bg-[#222] hover:border-accent/20 p-3 rounded flex flex-col justify-between space-y-2.5 transition-colors">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <span className="text-xs font-mono font-bold text-off-white">{cat}</span>
                  <div className="flex gap-2 items-center mt-1">
                    <span className={`text-[9px] font-mono font-bold border rounded px-1.5 py-0.5 uppercase tracking-wide ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>
                </div>

                {/* Edit Category budget form */}
                <div className="flex items-center gap-2 shrink-0">
                  {isEditMode ? (
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        className="w-16 bg-darkbg border border-border focus:border-accent/50 outline-none text-xs px-2 py-0.5 rounded text-off-white"
                        value={editingLimit}
                        onChange={(e) => setEditingLimit(e.target.value)}
                      />
                      <button onClick={() => handleSaveCategoryBudget(cat)} className="text-emerald-400 p-0.5">
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingCategory(null)} className="text-red-400 p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 font-mono text-xs text-off-white-muted">
                      <span>Limit: <b>₹{limit.toLocaleString('en-IN')}</b></span>
                      <button
                        onClick={() => handleEditCategoryStart(cat, limit)}
                        className="text-off-white-muted hover:text-off-white p-0.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress and values */}
              <div className="flex justify-between items-center text-[10px] font-mono border-t border-border/40 pt-2 text-off-white-muted">
                <div>
                  Spent: <span className="text-pink-400 font-bold">₹{spent.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  Remaining:{' '}
                  <span className={`font-bold ${remaining < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    ₹{remaining.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warnings & Sanity checks */}
      {totalCategoryBudgeted > totalBudgetLimit && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded p-3 text-[10px] font-mono flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <b>Attention:</b> Sum of your category budgets (₹{totalCategoryBudgeted.toLocaleString('en-IN')}) exceeds your set Total Budget Limit (₹{totalBudgetLimit.toLocaleString('en-IN')}). Consider revising your category limits.
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetPlanner;

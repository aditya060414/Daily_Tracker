import React, { useState } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { Plus, Trash2, Search, Filter, AlertTriangle, RefreshCw } from 'lucide-react';
import { ExpenseCategory } from '../../types/finance';

export const ExpenseTracker: React.FC = () => {
  const {
    expenses,
    totalBudgetLimit,
    addExpense,
    deleteExpense,
  } = useFinanceStore();

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Submit expense
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!title.trim() || isNaN(amountNum) || amountNum <= 0 || !date) return;

    addExpense({
      title,
      amount: amountNum,
      category,
      date,
      note: note.trim() || undefined,
      isRecurring,
    });

    // Reset form
    setTitle('');
    setAmount('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setIsRecurring(false);
    setIsFormOpen(false);
  };

  // Filter logic
  const filteredExpenses = expenses.filter((exp) => {
    // 1. Search term match
    const matchesSearch =
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.note && exp.note.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Category match
    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;

    // 3. Date range match
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && exp.date >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && exp.date <= endDate;
    }

    return matchesSearch && matchesCategory && matchesDate;
  }).sort((a, b) => b.date.localeCompare(a.date)); // Sort newest first

  // Current Month calculations
  const today = new Date();
  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const thisMonthExpensesVal = expenses.reduce((acc, curr) => {
    if (curr.date >= startOfThisMonth && curr.date <= endOfThisMonth) {
      return acc + curr.amount;
    }
    return acc;
  }, 0);

  const budgetPercent = Math.min(100, Math.round((thisMonthExpensesVal / totalBudgetLimit) * 100));
  const isOverBudget = thisMonthExpensesVal > totalBudgetLimit;

  return (
    <div className="bg-panel border border-border rounded-lg p-5 flex flex-col space-y-4">
      {/* Header and Add Button */}
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div className="min-w-0">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-off-white">Expense Tracker</h3>
          <p className="text-[10px] text-off-white-muted font-mono mt-0.5">
            Log your daily expenses and check current monthly spending
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={`px-3 py-1.5 rounded font-mono text-xs font-bold border transition-all duration-150 flex items-center gap-1.5 ${
            isFormOpen
              ? 'bg-card border-border text-off-white hover:bg-darkbg'
              : 'bg-accent/10 hover:bg-accent/20 border-accent/20 text-accent hover:scale-105'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          {isFormOpen ? 'Close Panel' : 'Log Expense'}
        </button>
      </div>

      {/* Budget Limit Progress Indicator */}
      <div className="bg-card/40 border border-border/50 rounded p-3 space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-off-white-muted">Monthly Limit Progress</span>
          <span className={`font-bold ${isOverBudget ? 'text-red-400' : budgetPercent > 80 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            ₹{thisMonthExpensesVal.toLocaleString('en-IN')} / ₹{totalBudgetLimit.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="w-full bg-darkbg border border-border h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget ? 'bg-red-400' : budgetPercent > 80 ? 'bg-yellow-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${budgetPercent}%` }}
          ></div>
        </div>
        {isOverBudget && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Warning: You have exceeded your monthly budget limit!</span>
          </div>
        )}
      </div>

      {/* Expandable Log Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-card border border-border/80 p-4 rounded-md space-y-3 font-mono text-xs animate-slide-in">
          <h4 className="font-bold text-accent uppercase tracking-wider text-[11px] border-b border-border/40 pb-1.5 mb-2">
            Record New Transaction
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-off-white-muted">Expense Item/Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Groceries, Coffee"
                className="w-full bg-darkbg border border-border focus:border-accent/50 outline-none p-2 rounded text-off-white"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-off-white-muted">Amount (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="e.g. 350"
                className="w-full bg-darkbg border border-border focus:border-accent/50 outline-none p-2 rounded text-off-white"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-off-white-muted">Category</label>
              <select
                className="w-full bg-darkbg border border-border focus:border-accent/50 outline-none p-2 rounded text-off-white"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              >
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-off-white-muted">Date</label>
              <input
                type="date"
                required
                className="w-full bg-darkbg border border-border focus:border-accent/50 outline-none p-2 rounded text-off-white"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-off-white-muted">Note (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Purchased at local supermarket"
              className="w-full bg-darkbg border border-border focus:border-accent/50 outline-none p-2 rounded text-off-white"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="recurring"
              className="rounded bg-darkbg border-border text-accent focus:ring-accent"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <label htmlFor="recurring" className="text-off-white-muted select-none flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className="w-3 h-3 text-accent" />
              Mark as Recurring Monthly Expense
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-accent text-darkbg hover:bg-accent/90 transition-all font-bold uppercase tracking-wider py-2.5 rounded text-[11px] mt-2"
          >
            Submit Transaction
          </button>
        </form>
      )}

      {/* Filter Toolbar */}
      <div className="bg-card/25 border border-border/40 p-3 rounded space-y-3 font-mono text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-off-white-muted" />
            <input
              type="text"
              placeholder="Search expenses..."
              className="w-full bg-darkbg border border-border outline-none pl-8 pr-2.5 py-1.5 rounded text-xs text-off-white placeholder-off-white-muted"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative flex items-center">
            <Filter className="absolute left-2.5 w-3.5 h-3.5 text-off-white-muted" />
            <select
              className="w-full bg-darkbg border border-border outline-none pl-8 pr-2.5 py-1.5 rounded text-xs text-off-white appearance-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Subscriptions">Subscriptions</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-off-white-muted shrink-0">From:</span>
            <input
              type="date"
              className="w-full bg-darkbg border border-border outline-none px-2 py-1 rounded text-xs text-off-white"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-off-white-muted shrink-0">To:</span>
            <input
              type="date"
              className="w-full bg-darkbg border border-border outline-none px-2 py-1 rounded text-xs text-off-white"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Clear Filters helper */}
        {(searchTerm || selectedCategory !== 'All' || startDate || endDate) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setStartDate('');
                setEndDate('');
              }}
              className="text-[10px] text-accent hover:underline cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Expense List Panel */}
      <div className="border border-border/80 rounded overflow-hidden">
        <div className="max-h-[350px] overflow-y-auto pr-1 text-xs font-mono">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-card border-b border-border text-[10px] uppercase text-off-white-muted tracking-wider">
                <th className="p-3 font-bold">Date</th>
                <th className="p-3 font-bold">Item</th>
                <th className="p-3 font-bold">Category</th>
                <th className="p-3 font-bold text-right">Amount</th>
                <th className="p-3 text-center font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-off-white-muted italic">
                    No transactions matching the criteria found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  let catColor = 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
                  if (exp.category === 'Food') catColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                  else if (exp.category === 'Transport') catColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                  else if (exp.category === 'Entertainment') catColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
                  else if (exp.category === 'Subscriptions') catColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                  else if (exp.category === 'Health') catColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

                  return (
                    <tr key={exp.id} className="border-b border-border/50 hover:bg-card/40 transition-colors">
                      <td className="p-3 text-off-white-muted whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="p-3 max-w-[150px] md:max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-off-white">{exp.title}</span>
                          {exp.isRecurring && (
                            <span title="Recurring">
                              <RefreshCw className="w-3 h-3 text-accent shrink-0" />
                            </span>
                          )}
                        </div>
                        {exp.note && (
                          <div className="text-[10px] text-off-white-muted italic mt-0.5 truncate">{exp.note}</div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-block text-[9px] font-bold border rounded px-1.5 py-0.5 uppercase tracking-wide ${catColor}`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-off-white whitespace-nowrap">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1 text-off-white-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;

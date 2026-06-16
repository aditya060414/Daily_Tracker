import React, { useState } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { Plus, Trash2, Edit, IndianRupee, PiggyBank, TrendingUp, X } from 'lucide-react';
import { IncomeFrequency, IncomeSource, SavingsBucket } from '../../types/finance';

export const FundManager: React.FC = () => {
  const {
    incomes,
    savings,
    expenses,
    addIncome,
    editIncome,
    deleteIncome,
    addSavings,
    editSavings,
    deleteSavings,
    updateSavingsAmount,
  } = useFinanceStore();

  // State for Income Modal/Form
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [incomeName, setIncomeName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeFrequency, setIncomeFrequency] = useState<IncomeFrequency>('monthly');

  // State for Savings Modal/Form
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [editingSavings, setEditingSavings] = useState<SavingsBucket | null>(null);
  const [savingsName, setSavingsName] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [savingsCurrent, setSavingsCurrent] = useState('');

  // State for Quick Deposit
  const [depositBucketId, setDepositBucketId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Calculate stats for current month
  const totalIncomeVal = incomes.reduce((acc, curr) => {
    if (curr.frequency === 'monthly') return acc + curr.amount;
    if (curr.frequency === 'weekly') return acc + curr.amount * 4.33; // Approx weeks in month
    return acc + curr.amount; // One-time
  }, 0);

  const currentMonthExpenses = expenses.reduce((acc, curr) => {
    // Basic filter for current month's expenses
    const expDate = new Date(curr.date);
    const today = new Date();
    if (expDate.getMonth() === today.getMonth() && expDate.getFullYear() === today.getFullYear()) {
      return acc + curr.amount;
    }
    return acc;
  }, 0);

  const totalSavedSoFar = savings.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const calculatedLiquidBalance = totalIncomeVal - currentMonthExpenses + totalSavedSoFar;

  // Handlers for Income
  const handleOpenIncomeAdd = () => {
    setEditingIncome(null);
    setIncomeName('');
    setIncomeAmount('');
    setIncomeFrequency('monthly');
    setIsIncomeModalOpen(true);
  };

  const handleOpenIncomeEdit = (income: IncomeSource) => {
    setEditingIncome(income);
    setIncomeName(income.name);
    setIncomeAmount(income.amount.toString());
    setIncomeFrequency(income.frequency);
    setIsIncomeModalOpen(true);
  };

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(incomeAmount);
    if (!incomeName.trim() || isNaN(amountNum) || amountNum <= 0) return;

    if (editingIncome) {
      editIncome(editingIncome.id, {
        name: incomeName,
        amount: amountNum,
        frequency: incomeFrequency,
      });
    } else {
      addIncome({
        name: incomeName,
        amount: amountNum,
        frequency: incomeFrequency,
      });
    }
    setIsIncomeModalOpen(false);
  };

  // Handlers for Savings Bucket
  const handleOpenSavingsAdd = () => {
    setEditingSavings(null);
    setSavingsName('');
    setSavingsTarget('');
    setSavingsCurrent('0');
    setIsSavingsModalOpen(true);
  };

  const handleOpenSavingsEdit = (bucket: SavingsBucket) => {
    setEditingSavings(bucket);
    setSavingsName(bucket.name);
    setSavingsTarget(bucket.targetAmount.toString());
    setSavingsCurrent(bucket.currentAmount.toString());
    setIsSavingsModalOpen(true);
  };

  const handleSaveSavings = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(savingsTarget);
    const currentNum = parseFloat(savingsCurrent);
    if (!savingsName.trim() || isNaN(targetNum) || targetNum <= 0 || isNaN(currentNum)) return;

    if (editingSavings) {
      editSavings(editingSavings.id, {
        name: savingsName,
        targetAmount: targetNum,
        currentAmount: currentNum,
      });
    } else {
      addSavings({
        name: savingsName,
        targetAmount: targetNum,
        currentAmount: currentNum,
      });
    }
    setIsSavingsModalOpen(false);
  };

  const handleQuickDeposit = (bucketId: string) => {
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const bucket = savings.find(b => b.id === bucketId);
    if (bucket) {
      updateSavingsAmount(bucketId, bucket.currentAmount + amountNum);
    }
    setDepositBucketId(null);
    setDepositAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <div className="bg-panel border border-border p-6 rounded-lg glow-accent relative overflow-hidden">
        <div className="absolute right-4 top-4 p-3 rounded-full bg-accent/10 border border-accent/20 text-accent">
          <IndianRupee className="w-6 h-6" />
        </div>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-off-white-muted">Calculated Liquid Funds</span>
        <h2 className="text-4xl font-mono font-bold mt-2 text-accent">
          ₹{calculatedLiquidBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-off-white-muted border-t border-border/50 pt-4">
          <div>
            Est. Monthly Income: <span className="text-emerald-400 font-bold">₹{totalIncomeVal.toLocaleString('en-IN')}</span>
          </div>
          <div className="border-r border-border h-4 hidden sm:block"></div>
          <div>
            This Month Expenses: <span className="text-red-400 font-bold">₹{currentMonthExpenses.toLocaleString('en-IN')}</span>
          </div>
          <div className="border-r border-border h-4 hidden sm:block"></div>
          <div>
            Savings Stashed: <span className="text-blue-400 font-bold">₹{totalSavedSoFar.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Income Sources Panel */}
        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Income Sources
            </h3>
            <button
              onClick={handleOpenIncomeAdd}
              className="p-1 rounded bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 flex-1 max-h-[350px] overflow-y-auto pr-1">
            {incomes.length === 0 ? (
              <p className="text-xs font-mono text-off-white-muted text-center py-8">No income sources configured.</p>
            ) : (
              incomes.map((inc) => (
                <div key={inc.id} className="bg-card border border-border/60 hover:border-accent/30 p-3 rounded flex justify-between items-center transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-bold text-off-white truncate">{inc.name}</p>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5 uppercase tracking-wide font-mono font-bold">
                        {inc.frequency}
                      </span>
                      <span className="text-[10px] text-off-white-muted font-mono">
                        Added: {new Date(inc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-2 shrink-0">
                    <span className="text-sm font-mono font-bold text-emerald-400">₹{inc.amount.toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => handleOpenIncomeEdit(inc)}
                      className="p-1 text-off-white-muted hover:text-accent transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteIncome(inc.id)}
                      className="p-1 text-off-white-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Savings Buckets Panel */}
        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-blue-400" />
              Savings Goals
            </h3>
            <button
              onClick={handleOpenSavingsAdd}
              className="p-1 rounded bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 flex-1 max-h-[350px] overflow-y-auto pr-1">
            {savings.length === 0 ? (
              <p className="text-xs font-mono text-off-white-muted text-center py-8">No savings buckets configured.</p>
            ) : (
              savings.map((bucket) => {
                const percent = Math.min(100, Math.round((bucket.currentAmount / bucket.targetAmount) * 100));
                return (
                  <div key={bucket.id} className="bg-card border border-border/60 p-3.5 rounded space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-bold text-off-white truncate">{bucket.name}</p>
                        <p className="text-[10px] text-off-white-muted font-mono mt-0.5">
                          ₹{bucket.currentAmount.toLocaleString('en-IN')} of ₹{bucket.targetAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 ml-2">
                        <button
                          onClick={() => setDepositBucketId(bucket.id)}
                          className="text-[10px] font-mono font-bold px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded transition-colors"
                        >
                          + Add Funds
                        </button>
                        <button
                          onClick={() => handleOpenSavingsEdit(bucket)}
                          className="p-1 text-off-white-muted hover:text-accent transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSavings(bucket.id)}
                          className="p-1 text-off-white-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-darkbg border border-border h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-[9px] font-mono text-off-white-muted">
                        {percent}% Completed
                      </div>
                    </div>

                    {/* Quick Deposit Form */}
                    {depositBucketId === bucket.id && (
                      <div className="flex gap-2 items-center pt-2 border-t border-border/40 animate-fade-in">
                        <input
                          type="number"
                          placeholder="Amount"
                          className="flex-1 bg-darkbg border border-border focus:border-blue-400/50 outline-none text-xs font-mono px-2.5 py-1.5 rounded text-off-white"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                        <button
                          onClick={() => handleQuickDeposit(bucket.id)}
                          className="text-[10px] font-mono font-bold px-3 py-1.5 bg-blue-500 text-darkbg rounded hover:bg-blue-400 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setDepositBucketId(null)}
                          className="p-1 text-off-white-muted hover:text-off-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Income Add/Edit Modal */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-panel border border-border rounded-lg max-w-sm w-full p-6 space-y-4 glow-accent">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-accent">
                {editingIncome ? 'Edit Income Source' : 'Add Income Source'}
              </h4>
              <button onClick={() => setIsIncomeModalOpen(false)} className="text-off-white-muted hover:text-off-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIncome} className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-off-white-muted">Source Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Salary, Freelance, Dividends"
                  className="w-full bg-card border border-border focus:border-accent/50 outline-none p-2 rounded text-off-white"
                  value={incomeName}
                  onChange={(e) => setIncomeName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-off-white-muted">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="e.g. 50000"
                  className="w-full bg-card border border-border focus:border-accent/50 outline-none p-2 rounded text-off-white"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-off-white-muted">Frequency</label>
                <select
                  className="w-full bg-card border border-border focus:border-accent/50 outline-none p-2 rounded text-off-white"
                  value={incomeFrequency}
                  onChange={(e) => setIncomeFrequency(e.target.value as IncomeFrequency)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-accent text-darkbg hover:bg-accent/90 transition-colors py-2 rounded font-bold uppercase tracking-wider text-xs"
              >
                {editingIncome ? 'Save Changes' : 'Add Source'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Savings Add/Edit Modal */}
      {isSavingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-panel border border-border rounded-lg max-w-sm w-full p-6 space-y-4 glow-accent">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-accent">
                {editingSavings ? 'Edit Savings Goal' : 'Create Savings Goal'}
              </h4>
              <button onClick={() => setIsSavingsModalOpen(false)} className="text-off-white-muted hover:text-off-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSavings} className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-off-white-muted">Goal/Bucket Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, New Bike"
                  className="w-full bg-card border border-border focus:border-accent/50 outline-none p-2 rounded text-off-white"
                  value={savingsName}
                  onChange={(e) => setSavingsName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-off-white-muted">Target Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 100000"
                  className="w-full bg-card border border-border focus:border-accent/50 outline-none p-2 rounded text-off-white"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-off-white-muted">Current Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="e.g. 15000"
                  className="w-full bg-card border border-border focus:border-accent/50 outline-none p-2 rounded text-off-white"
                  value={savingsCurrent}
                  onChange={(e) => setSavingsCurrent(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-accent text-darkbg hover:bg-accent/90 transition-colors py-2 rounded font-bold uppercase tracking-wider text-xs"
              >
                {editingSavings ? 'Save Changes' : 'Create Bucket'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundManager;

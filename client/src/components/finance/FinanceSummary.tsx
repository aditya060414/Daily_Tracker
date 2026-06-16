import React, { useState } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Edit2, Check, X, Calendar } from 'lucide-react';
import { format, differenceInDays, addMonths } from 'date-fns';

export const FinanceSummary: React.FC = () => {
  const {
    expenses,
    incomes,
    savings,
    netWorthAssets,
    netWorthLiabilities,
    paydayDay,
    updateNetWorth,
    setPaydayDay,
  } = useFinanceStore();

  // Net Worth Edit states
  const [isEditingNetWorth, setIsEditingNetWorth] = useState(false);
  const [tempAssets, setTempAssets] = useState(netWorthAssets.toString());
  const [tempLiabilities, setTempLiabilities] = useState(netWorthLiabilities.toString());

  // Payday Edit states
  const [isEditingPayday, setIsEditingPayday] = useState(false);
  const [tempPayday, setTempPayday] = useState(paydayDay.toString());

  const calculatedNetWorth = netWorthAssets - netWorthLiabilities;
  const hasData = incomes.length > 0 || expenses.length > 0 || savings.length > 0;

  // Calculate live values for current month
  const today = new Date();
  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const currentMonthIncomesVal = incomes.reduce((acc, curr) => {
    if (curr.frequency === 'monthly') return acc + curr.amount;
    if (curr.frequency === 'weekly') return acc + curr.amount * 4.33;
    // For one-time incomes, check if added in this month
    const incDate = new Date(curr.createdAt);
    if (incDate.getMonth() === today.getMonth() && incDate.getFullYear() === today.getFullYear()) {
      return acc + curr.amount;
    }
    return acc;
  }, 0);

  const currentMonthExpensesVal = expenses.reduce((acc, curr) => {
    if (curr.date >= startOfThisMonth && curr.date <= endOfThisMonth) {
      return acc + curr.amount;
    }
    return acc;
  }, 0);


  // Quick stats: Biggest expense this month
  const thisMonthExpensesList = expenses.filter(
    (exp) => exp.date >= startOfThisMonth && exp.date <= endOfThisMonth
  );

  const biggestExpense = thisMonthExpensesList.reduce(
    (max, curr) => (curr.amount > max.amount ? curr : max),
    { title: 'N/A', amount: 0 } as { title: string; amount: number }
  );

  // Quick stats: Most used category this month (by amount)
  const categoryAmounts = thisMonthExpensesList.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  let mostUsedCategoryName = 'N/A';
  let mostUsedCategoryAmount = 0;
  Object.entries(categoryAmounts).forEach(([cat, amt]) => {
    if (amt > mostUsedCategoryAmount) {
      mostUsedCategoryName = cat;
      mostUsedCategoryAmount = amt;
    }
  });

  // Payday Countdown calculation
  const getPaydayDate = (year: number, month: number, targetDay: number): Date => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const resolvedDay = Math.min(targetDay, lastDayOfMonth);
    return new Date(year, month, resolvedDay);
  };

  let nextPaydayDate = getPaydayDate(today.getFullYear(), today.getMonth(), paydayDay);
  if (nextPaydayDate < today) {
    // If payday this month has passed, target next month
    const nextMonth = addMonths(today, 1);
    nextPaydayDate = getPaydayDate(nextMonth.getFullYear(), nextMonth.getMonth(), paydayDay);
  }
  const daysUntilPayday = differenceInDays(nextPaydayDate, today);

  // Construct historical data (past 5 months + current month) using real user entries
  const getHistoricalData = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = addMonths(today, -i);
      const year = targetMonth.getFullYear();
      const monthIndex = targetMonth.getMonth(); // 0-11
      const monthLabel = format(targetMonth, 'MMM');

      // End date of this target month
      const endOfMonth = new Date(year, monthIndex + 1, 0);

      // 1. Calculate Income for this month
      const monthIncome = incomes.reduce((acc, curr) => {
        const created = new Date(curr.createdAt);
        if (curr.frequency === 'monthly') {
          if (created <= endOfMonth) return acc + curr.amount;
        } else if (curr.frequency === 'weekly') {
          if (created <= endOfMonth) return acc + (curr.amount * 4.33);
        } else {
          if (created.getMonth() === monthIndex && created.getFullYear() === year) {
            return acc + curr.amount;
          }
        }
        return acc;
      }, 0);

      // 2. Calculate Expenses for this month
      const monthExpenses = expenses.reduce((acc, curr) => {
        const expDate = new Date(curr.date);
        if (curr.isRecurring) {
          if (expDate <= endOfMonth) return acc + curr.amount;
        } else {
          if (expDate.getMonth() === monthIndex && expDate.getFullYear() === year) {
            return acc + curr.amount;
          }
        }
        return acc;
      }, 0);

      // 3. Calculate Savings for this month
      const monthSavings = savings.reduce((acc, curr) => {
        const created = new Date(curr.createdAt);
        if (created <= endOfMonth) {
          return acc + curr.currentAmount;
        }
        return acc;
      }, 0);

      data.push({
        month: monthLabel,
        Income: Math.round(monthIncome),
        Expenses: Math.round(monthExpenses),
        Savings: Math.round(monthSavings),
      });
    }
    return data;
  };

  const historicalData = getHistoricalData();

  // Save Net Worth edits
  const handleSaveNetWorth = () => {
    const assetsNum = parseFloat(tempAssets);
    const liabilitiesNum = parseFloat(tempLiabilities);
    if (!isNaN(assetsNum) && !isNaN(liabilitiesNum) && assetsNum >= 0 && liabilitiesNum >= 0) {
      updateNetWorth(assetsNum, liabilitiesNum);
      setIsEditingNetWorth(false);
    }
  };

  // Save Payday edits
  const handleSavePayday = () => {
    const paydayNum = parseInt(tempPayday, 10);
    if (!isNaN(paydayNum) && paydayNum >= 1 && paydayNum <= 31) {
      setPaydayDay(paydayNum);
      setIsEditingPayday(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Net Worth and Payday Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        {/* Net Worth Card */}
        <div className="bg-panel border border-border p-5 rounded-lg flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h4 className="font-bold uppercase tracking-wider text-off-white flex items-center gap-1.5">
              Net Worth Tracker
            </h4>
            {!isEditingNetWorth ? (
              <button
                onClick={() => {
                  setTempAssets(netWorthAssets.toString());
                  setTempLiabilities(netWorthLiabilities.toString());
                  setIsEditingNetWorth(true);
                }}
                className="p-1 hover:bg-card border border-transparent hover:border-border rounded text-off-white-muted hover:text-off-white"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={handleSaveNetWorth} className="p-1 text-emerald-400 hover:text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsEditingNetWorth(false)} className="p-1 text-red-400 hover:text-red-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {isEditingNetWorth ? (
            <div className="space-y-2.5 py-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-off-white-muted">Total Assets:</span>
                <input
                  type="number"
                  className="bg-darkbg border border-border focus:border-accent/50 outline-none text-right px-2 py-1 rounded text-off-white w-32 font-bold"
                  value={tempAssets}
                  onChange={(e) => setTempAssets(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-off-white-muted">Total Liabilities:</span>
                <input
                  type="number"
                  className="bg-darkbg border border-border focus:border-accent/50 outline-none text-right px-2 py-1 rounded text-off-white w-32 font-bold"
                  value={tempLiabilities}
                  onChange={(e) => setTempLiabilities(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-off-white-muted">Assets:</span>
                <span className="text-emerald-400 font-bold">₹{netWorthAssets.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-off-white-muted">Liabilities:</span>
                <span className="text-red-400 font-bold">₹{netWorthLiabilities.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-border/40 my-2 pt-2 flex justify-between items-center text-sm">
                <span className="text-off-white font-bold">Estimated Net Worth:</span>
                <span className="text-accent font-bold text-base">₹{calculatedNetWorth.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Config / Payday Card */}
        <div className="bg-panel border border-border p-5 rounded-lg flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h4 className="font-bold uppercase tracking-wider text-off-white flex items-center gap-1.5">
              System Payroll Countdown
            </h4>
            {!isEditingPayday ? (
              <button
                onClick={() => {
                  setTempPayday(paydayDay.toString());
                  setIsEditingPayday(true);
                }}
                className="p-1 hover:bg-card border border-transparent hover:border-border rounded text-off-white-muted hover:text-off-white"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={handleSavePayday} className="p-1 text-emerald-400 hover:text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsEditingPayday(false)} className="p-1 text-red-400 hover:text-red-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center flex-1 py-1">
            {isEditingPayday ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-off-white-muted">Monthly Payday (1-31):</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="bg-darkbg border border-border focus:border-accent/50 outline-none text-center px-2 py-1 rounded text-off-white w-20 font-bold"
                  value={tempPayday}
                  onChange={(e) => setTempPayday(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded bg-accent/10 text-accent border border-accent/20">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-off-white-muted">Days until next Payday</div>
                    <div className="text-xl font-bold text-accent">
                      {daysUntilPayday === 0
                        ? 'Payday is Today!'
                        : `${daysUntilPayday} ${daysUntilPayday === 1 ? 'Day' : 'Days'} Remaining`}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-off-white-muted italic">
                  Next payday configured for: {format(nextPaydayDate, 'dd-MMMM-yyyy')} (Payday: Day {paydayDay} of month)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Composed Chart */}
      <div className="bg-panel border border-border rounded-lg p-5 flex flex-col space-y-4">
        <div>
          <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-off-white flex items-center gap-1">
            Historical Cash Flow Trend
          </h4>
          <p className="text-[10px] text-off-white-muted font-mono mt-0.5">
            Audit monthly income, expenses, and approximate savings over the last 6 months
          </p>
        </div>

        <div className="h-[250px] w-full font-mono text-[9px] bg-card/25 border border-border/40 rounded p-2.5 flex flex-col items-center justify-center">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={historicalData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="month" stroke="#8c8c8c" tick={{ fontSize: 9 }} />
                <YAxis stroke="#8c8c8c" tick={{ fontSize: 9 }} />
                <Tooltip
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
                <Bar dataKey="Income" fill="#10b981" fillOpacity={0.6} stroke="#10b981" strokeWidth={1} radius={[2, 2, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f43f5e" fillOpacity={0.6} stroke="#f43f5e" strokeWidth={1} radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="Savings" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center space-y-2 py-8 px-4 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-accent uppercase tracking-widest font-mono">Start Managing Expenses Now</span>
              <p className="text-[10px] text-off-white-muted max-w-xs font-mono">
                Log your income stream sources and record daily transaction expenditures in the other tabs to compile visual cash flow telemetry reports.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        {/* Biggest Expense */}
        <div className="bg-panel border border-border p-4 rounded-lg flex flex-col justify-between space-y-2">
          <span className="text-[10px] text-off-white-muted uppercase tracking-wider font-bold">Biggest Expense</span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-off-white truncate" title={biggestExpense.title}>
              {biggestExpense.title}
            </div>
            <div className="text-lg font-bold text-red-400 mt-1">
              ₹{biggestExpense.amount.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-[9px] text-off-white-muted border-t border-border/40 pt-1.5">
            This current calendar month
          </div>
        </div>

        {/* Most Used Category */}
        <div className="bg-panel border border-border p-4 rounded-lg flex flex-col justify-between space-y-2">
          <span className="text-[10px] text-off-white-muted uppercase tracking-wider font-bold">Top Expense Category</span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-off-white truncate">
              {mostUsedCategoryName}
            </div>
            <div className="text-lg font-bold text-pink-400 mt-1">
              ₹{mostUsedCategoryAmount.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-[9px] text-off-white-muted border-t border-border/40 pt-1.5">
            By aggregate category cost
          </div>
        </div>

        {/* Cash Flow Balance Status */}
        <div className="bg-panel border border-border p-4 rounded-lg flex flex-col justify-between space-y-2">
          <span className="text-[10px] text-off-white-muted uppercase tracking-wider font-bold">Surplus Ratio</span>
          <div className="min-w-0">
            {currentMonthIncomesVal > 0 ? (
              <>
                <div className="text-sm font-bold text-off-white">
                  {Math.round(((currentMonthIncomesVal - currentMonthExpensesVal) / currentMonthIncomesVal) * 100)}% Saved/Free
                </div>
                <div className="text-lg font-bold text-emerald-400 mt-1">
                  ₹{(currentMonthIncomesVal - currentMonthExpensesVal).toLocaleString('en-IN')} Surplus
                </div>
              </>
            ) : currentMonthExpensesVal > 0 ? (
              <>
                <div className="text-sm font-bold text-off-white">No Income Recorded</div>
                <div className="text-lg font-bold text-red-400 mt-1">₹-{currentMonthExpensesVal.toLocaleString('en-IN')}</div>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-off-white">No Cash Flow</div>
                <div className="text-lg font-bold text-accent mt-1">₹0.00</div>
              </>
            )}
          </div>
          <div className="text-[9px] text-off-white-muted border-t border-border/40 pt-1.5">
            Monthly surplus (Income - Expenses)
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceSummary;

import React, { useState } from 'react';
import { Wallet, Landmark, Receipt, BarChart3, LineChart } from 'lucide-react';
import { FundManager } from '../components/finance/FundManager';
import { ExpenseTracker } from '../components/finance/ExpenseTracker';
import { BudgetPlanner } from '../components/finance/BudgetPlanner';
import { FinanceSummary } from '../components/finance/FinanceSummary';

type ActiveTabType = 'overview' | 'funds' | 'expenses' | 'budget';

export const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('overview');

  const tabs = [
    { id: 'overview' as ActiveTabType, label: 'Overview', icon: <LineChart className="w-3.5 h-3.5" /> },
    { id: 'funds' as ActiveTabType, label: 'Funds & Savings', icon: <Landmark className="w-3.5 h-3.5" /> },
    { id: 'expenses' as ActiveTabType, label: 'Expenses', icon: <Receipt className="w-3.5 h-3.5" /> },
    { id: 'budget' as ActiveTabType, label: 'Budget Planner', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 select-none animate-fade-in pb-16 md:pb-6">
      {/* Top Banner Header */}
      <div className="bg-panel border border-border rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow backdrop decorator */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-accent/5 blur-3xl"></div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-accent/20 border border-accent/30 text-accent">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-mono font-bold text-off-white flex items-center gap-1.5 uppercase tracking-wider">
              Financial Telemetry
            </h1>
            <p className="text-xs font-mono text-off-white-muted">
              Audit cash flow metrics, trace budgets, manage savings checkpoints, and compile ledger transactions
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1 bg-darkbg p-1 rounded border border-border font-mono text-[10px] uppercase">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded transition-all duration-150 flex items-center gap-1.5 font-bold cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-accent text-darkbg font-bold glow-accent'
                  : 'text-off-white-muted hover:text-off-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel Content Render */}
      <div className="transition-all duration-200">
        {activeTab === 'overview' && <FinanceSummary />}
        {activeTab === 'funds' && <FundManager />}
        {activeTab === 'expenses' && <ExpenseTracker />}
        {activeTab === 'budget' && <BudgetPlanner />}
      </div>
    </div>
  );
};

export default Finance;

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CommandPalette } from './components/CommandPalette';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DailyTasks } from './pages/DailyTasks';
import { GymTracker } from './pages/GymTracker';
import { DayPlanning } from './pages/DayPlanning';
import { GoalPlanning } from './pages/GoalPlanning';
import { Meals } from './pages/Meals';
import { DailyReview } from './pages/DailyReview';
import { Focus } from './pages/Focus';

// Authenticated Route Shell
const DashboardLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global keydown listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-darkbg text-off-white select-none">
      {/* Navigation Left Sidebar */}
      <Sidebar />

      {/* Main Core Window Panel */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Sticky top system banner */}
        <TopBar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

        {/* Scrollable page panels */}
        <main className="flex-grow overflow-y-auto">
          {/* Page outlet router */}
          <Outlet context={{ onOpenCommandPalette: () => setIsCommandPaletteOpen(true) }} />
        </main>
      </div>

      {/* Floating command palette overlay */}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login gateway */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />

        {/* Protected Dashboard Nodes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route
            index
            element={
              <Dashboard
                onOpenCommandPalette={() => {
                  // Emits event that toggles palette
                  const e = new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' });
                  window.dispatchEvent(e);
                }}
              />
            }
          />
          <Route path="tasks" element={<DailyTasks />} />
          <Route path="gym" element={<GymTracker />} />
          <Route path="plan" element={<DayPlanning />} />
          <Route path="goals" element={<GoalPlanning />} />
          <Route path="meals" element={<Meals />} />
          <Route path="review" element={<DailyReview />} />
          <Route path="focus" element={<Focus />} />
        </Route>

        {/* Fallback to root index */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

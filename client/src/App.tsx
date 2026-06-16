import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './store';
import { authApi } from './api';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CommandPalette } from './components/CommandPalette';
import { StickyNotesLayer } from './components/StickyNotesLayer';

// Capacitor Native imports
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';


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
import { SkincareTracker } from './pages/SkincareTracker';
import { Finance } from './pages/Finance';

// Authenticated Route Shell
const DashboardLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const location = useLocation();

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

  const isFocusRoute = location.pathname === '/focus';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-darkbg text-off-white select-none">
      {/* Navigation Left Sidebar */}
      {!isFocusRoute && <Sidebar />}

      {/* Main Core Window Panel */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Sticky top system banner */}
        {!isFocusRoute && <TopBar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />}

        {/* Scrollable page panels */}
        <main className={`flex-grow overflow-y-auto ${isFocusRoute ? 'pb-0' : 'pb-16 md:pb-0'}`}>
          {/* Page outlet router */}
          <Outlet context={{ onOpenCommandPalette: () => setIsCommandPaletteOpen(true) }} />
        </main>
      </div>

      {/* Floating command palette overlay */}
      {!isFocusRoute && (
        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      )}

      {/* Global floating sticky notes system */}
      {!isFocusRoute && <StickyNotesLayer />}
    </div>
  );
};

export const App: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [booting, setBooting] = useState(true);
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  // Native Platform Initialization (StatusBar, Hardware Back Button)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Set StatusBar theme and background color
    try {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#0f0f0f' });
    } catch (err) {
      console.warn('StatusBar plugin error:', err);
    }

    // Android Hardware Back Button Listener
    const backButtonListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '/login' || !canGoBack) {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      backButtonListener.then((listener) => listener.remove());
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setBootLogs(['INITIALIZING_SYSTEM_BOOT...']);
      try {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setBootLogs((prev) => [...prev, 'CONNECTING_TO_AUTH_GATEWAY...']);
        
        const res = await authApi.me();
        if (res.success && res.data?.user) {
          setBootLogs((prev) => [...prev, 'ACTIVE_SESSION_VERIFIED.', 'MOUNTING_COMPONENTS...']);
          await new Promise((resolve) => setTimeout(resolve, 200));
          setAuth(token || '', res.data.user);
        } else {
          clearAuth();
        }
      } catch (err) {
        setBootLogs((prev) => [...prev, 'NO_ACTIVE_SESSION_FOUND.', 'BOOTING_GATEWAY_V1...']);
        clearAuth();
      } finally {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setBooting(false);
      }
    };
    initAuth();
  }, []);

  if (booting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-darkbg text-off-white font-mono p-6 select-none relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35"></div>
        
        <div className="w-full max-w-sm bg-panel border border-border rounded-lg shadow-2xl p-6 z-10 glow-accent animate-fade-in">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3 text-accent">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping"></span>
            <span className="text-xs font-bold tracking-widest uppercase">SYS_LOADER_V1</span>
          </div>
          
          <div className="space-y-1 text-[10px] text-off-white-muted mb-4 h-20 overflow-y-auto">
            {bootLogs.map((log, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-accent shrink-0">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>

          <div className="w-full bg-card h-1 rounded-full overflow-hidden border border-border">
            <div className="bg-accent h-full rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    );
  }

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
          <Route path="skincare" element={<SkincareTracker />} />
          <Route path="finance" element={<Finance />} />
        </Route>

        {/* Fallback to root index */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

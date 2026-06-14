import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useFocusStore, useDailyStore, useGoalsStore, useDateStore, useAuthStore } from '../store';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Timer,
  Sparkles,
  Maximize2,
  Minimize2,
  Flame,
  Trophy,
  Clock,
  Award,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';



// ==========================================
// BACKGROUND CANVAS RENDERING ENGINE
// ==========================================
interface ThemeCanvasProps {
  theme: 'gradient' | 'rain' | 'forest' | 'library' | 'night' | 'cyber' | 'aurora' | 'nebula' | 'ocean' | 'snow' | 'matrix' | 'sakura';
}

const ThemeCanvas: React.FC<ThemeCanvasProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initializer assets for specific themes
    // Rain droplets
    const raindrops: { x: number; y: number; length: number; speed: number; opacity: number }[] = [];
    if (theme === 'rain') {
      for (let i = 0; i < 90; i++) {
        raindrops.push({
          x: Math.random() * width,
          y: Math.random() * height - height,
          length: 12 + Math.random() * 18,
          speed: 9 + Math.random() * 7,
          opacity: 0.15 + Math.random() * 0.25,
        });
      }
    }

    // Forest particles/leaves
    const leaves: { x: number; y: number; size: number; speedY: number; speedX: number; angle: number; drift: number; opacity: number }[] = [];
    if (theme === 'forest') {
      for (let i = 0; i < 40; i++) {
        leaves.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 2 + Math.random() * 4,
          speedY: -0.2 - Math.random() * 0.4,
          speedX: -0.2 + Math.random() * 0.4,
          angle: Math.random() * Math.PI * 2,
          drift: 0.1 + Math.random() * 0.3,
          opacity: 0.1 + Math.random() * 0.3,
        });
      }
    }

    // Library fireplace spark particles
    const sparks: { x: number; y: number; size: number; speedY: number; speedX: number; opacity: number }[] = [];
    if (theme === 'library') {
      for (let i = 0; i < 35; i++) {
        sparks.push({
          x: width / 2 + (Math.random() - 0.5) * 400,
          y: height + Math.random() * 100,
          size: 1.5 + Math.random() * 2.5,
          speedY: -0.8 - Math.random() * 1.5,
          speedX: -0.5 + Math.random() * 1.0,
          opacity: 0.15 + Math.random() * 0.35,
        });
      }
    }

    // Night stars
    const stars: { x: number; y: number; size: number; maxOpacity: number; phase: number; speed: number }[] = [];
    if (theme === 'night') {
      for (let i = 0; i < 70; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.75, // top part of the screen mostly
          size: 0.8 + Math.random() * 1.5,
          maxOpacity: 0.2 + Math.random() * 0.6,
          phase: Math.random() * Math.PI * 2,
          speed: 0.01 + Math.random() * 0.02,
        });
      }
    }

    // Cyber elements
    let cyberOffset = 0;
    const cyberDust: { x: number; y: number; size: number; speedY: number; opacity: number }[] = [];
    if (theme === 'cyber') {
      for (let i = 0; i < 50; i++) {
        cyberDust.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 1 + Math.random() * 2,
          speedY: 0.5 + Math.random() * 1.2,
          opacity: 0.1 + Math.random() * 0.25,
        });
      }
    }

    // Ocean bubbles
    const bubbles: { x: number; y: number; r: number; speed: number; opacity: number }[] = [];
    if (theme === 'ocean') {
      for (let i = 0; i < 35; i++) {
        bubbles.push({
          x: Math.random() * width,
          y: height + Math.random() * 200,
          r: 1.0 + Math.random() * 2.8,
          speed: 0.3 + Math.random() * 0.6,
          opacity: 0.05 + Math.random() * 0.15,
        });
      }
    }

    // Nebula clouds
    const nebulaClouds = [
      { x: width * 0.3, y: height * 0.4, r: width * 0.35, color: 'rgba(124, 58, 237, 0.035)' },
      { x: width * 0.7, y: height * 0.5, r: width * 0.4, color: 'rgba(219, 39, 119, 0.028)' }
    ];

    // Snow theme snowflakes
    const snowflakes: { x: number; y: number; r: number; d: number; speed: number; opacity: number }[] = [];
    if (theme === 'snow') {
      for (let i = 0; i < 60; i++) {
        snowflakes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 1.0 + Math.random() * 2.5,
          d: Math.random() * 8,
          speed: 0.6 + Math.random() * 1.0,
          opacity: 0.15 + Math.random() * 0.4,
        });
      }
    }

    // Matrix green rain streams
    const matrixColumns: { x: number; y: number; speed: number; chars: string[] }[] = [];
    if (theme === 'matrix') {
      const colWidth = 14;
      const colCount = Math.floor(width / colWidth);
      for (let i = 0; i < colCount; i++) {
        matrixColumns.push({
          x: i * colWidth,
          y: Math.random() * height - height,
          speed: 2.0 + Math.random() * 3.5,
          chars: Array.from({ length: 14 }, () => String.fromCharCode(33 + Math.floor(Math.random() * 93))),
        });
      }
    }

    // Sakura cherry blossoms petals
    const petals: { x: number; y: number; r: number; speedY: number; speedX: number; rot: number; rotSpeed: number; opacity: number }[] = [];
    if (theme === 'sakura') {
      for (let i = 0; i < 35; i++) {
        petals.push({
          x: Math.random() * width,
          y: Math.random() * height - height,
          r: 3.5 + Math.random() * 3.5,
          speedY: 0.5 + Math.random() * 0.7,
          speedX: 0.3 + Math.random() * 0.6,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: 0.006 + Math.random() * 0.012,
          opacity: 0.2 + Math.random() * 0.35,
        });
      }
    }

    // Morphing Gradient colors
    let gradAngle = 0;

    // --- ANIMATION LOOP ---
    const tick = () => {
      if (theme !== 'matrix') {
        ctx.clearRect(0, 0, width, height);
      }

      if (theme === 'gradient') {
        gradAngle += 0.002;
        const color1 = `hsl(${Math.sin(gradAngle) * 30 + 260}, 45%, 5%)`;
        const color2 = `hsl(${Math.cos(gradAngle) * 20 + 280}, 50%, 6%)`;
        const color3 = `hsl(${Math.sin(gradAngle * 1.5) * 15 + 240}, 40%, 4%)`;

        const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 20, width * 0.5, height * 0.5, Math.max(width, height) * 0.8);
        grad.addColorStop(0, color1);
        grad.addColorStop(0.5, color2);
        grad.addColorStop(1, color3);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      else if (theme === 'rain') {
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(174, 180, 205, 0.12)';
        ctx.lineWidth = 1.2;

        raindrops.forEach((r) => {
          ctx.strokeStyle = `rgba(124, 90, 237, ${r.opacity})`;
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x + 1, r.y + r.length);
          ctx.stroke();

          // update position
          r.y += r.speed;
          if (r.y > height) {
            r.y = -r.length;
            r.x = Math.random() * width;
          }
        });
      }

      else if (theme === 'forest') {
        // Deep forest green gradient
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#030806');
        grad.addColorStop(1, '#08140f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Render forest spore spores
        leaves.forEach((l) => {
          ctx.fillStyle = `rgba(16, 185, 129, ${l.opacity})`;
          ctx.beginPath();
          ctx.arc(l.x, l.y, l.size, 0, Math.PI * 2);
          ctx.fill();

          l.angle += l.drift;
          l.x += l.speedX + Math.sin(l.angle) * 0.2;
          l.y += l.speedY;

          if (l.y < -l.size * 2) {
            l.y = height + l.size * 2;
            l.x = Math.random() * width;
          }
        });

        // Silhouetted mountain/tree vectors at the bottom
        ctx.fillStyle = 'rgba(2, 8, 6, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.quadraticCurveTo(width * 0.25, height - 70, width * 0.5, height - 40);
        ctx.quadraticCurveTo(width * 0.75, height - 20, width, height - 80);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      }

      else if (theme === 'library') {
        // Warm brown candle-lit library feel
        const grad = ctx.createRadialGradient(width * 0.5, height * 0.7, 10, width * 0.5, height * 0.7, Math.max(width, height) * 0.85);
        grad.addColorStop(0, '#1a100a');
        grad.addColorStop(0.5, '#0d0703');
        grad.addColorStop(1, '#050302');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Fireplace glow sparks
        sparks.forEach((s) => {
          ctx.fillStyle = `rgba(249, 115, 22, ${s.opacity})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();

          s.y += s.speedY;
          s.x += s.speedX + Math.sin(s.y * 0.05) * 0.3;

          if (s.y < -s.size) {
            s.y = height + Math.random() * 50;
            s.x = width / 2 + (Math.random() - 0.5) * 500;
          }
        });
      }

      else if (theme === 'night') {
        // Dark blue moonlit sky
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#020208');
        grad.addColorStop(0.5, '#050512');
        grad.addColorStop(1, '#0b0b1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Starfield twinkling
        stars.forEach((s) => {
          s.phase += s.speed;
          const currentOpacity = s.maxOpacity * (0.3 + 0.7 * Math.abs(Math.sin(s.phase)));

          ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Cozy soft yellow crescent moon
        ctx.shadowColor = 'rgba(254, 240, 138, 0.15)';
        ctx.shadowBlur = 40;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
        ctx.beginPath();
        ctx.arc(width * 0.8, height * 0.2, 32, 0, Math.PI * 2);
        ctx.fill();

        // Moon mask to make crescent
        ctx.fillStyle = '#020208';
        ctx.beginPath();
        ctx.arc(width * 0.78, height * 0.18, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      else if (theme === 'cyber') {
        // Deep cyber black grid
        ctx.fillStyle = '#030307';
        ctx.fillRect(0, 0, width, height);

        cyberOffset = (cyberOffset + 1.2) % 40;

        ctx.strokeStyle = 'rgba(124, 58, 237, 0.08)';
        ctx.lineWidth = 1.0;

        // Draw horizontal grid lines moving down
        for (let y = cyberOffset; y < height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Draw vertical grid lines
        for (let x = 0; x < width; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Cyber particles drifting
        cyberDust.forEach((d) => {
          ctx.fillStyle = `rgba(139, 92, 246, ${d.opacity})`;
          ctx.beginPath();
          ctx.fillRect(d.x, d.y, d.size, d.size);

          d.y += d.speedY;
          if (d.y > height) {
            d.y = 0;
            d.x = Math.random() * width;
          }
        });

        // Scanline bar scrolling down
        const scanY = (gradAngle * 450) % height;
        ctx.fillStyle = 'rgba(124, 58, 237, 0.015)';
        ctx.fillRect(0, scanY, width, 6);
      }

      else if (theme === 'aurora') {
        // Northern Lights waving ribbons
        ctx.fillStyle = '#020205';
        ctx.fillRect(0, 0, width, height);

        gradAngle += 0.005;

        // Wave path calculation
        const points: { x: number; y: number }[] = [];
        for (let x = 0; x < width; x += 15) {
          const wave = Math.sin(x * 0.003 + gradAngle * 1.8) * 45 + Math.cos(x * 0.007 - gradAngle * 0.8) * 25;
          points.push({ x, y: height * 0.25 + wave });
        }

        // 1. Green glowing aurora ribbon
        ctx.shadowColor = 'rgba(16, 185, 129, 0.42)';
        ctx.shadowBlur = 35;
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.16)';
        ctx.lineWidth = 18;
        ctx.beginPath();
        points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // 2. Secondary purple aurora ribbon
        ctx.shadowColor = 'rgba(139, 92, 246, 0.35)';
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.14)';
        ctx.lineWidth = 24;
        ctx.beginPath();
        points.forEach((p, idx) => {
          const offset = Math.sin(p.x * 0.0018 + gradAngle) * 35;
          if (idx === 0) ctx.moveTo(p.x, p.y + 65 + offset);
          else ctx.lineTo(p.x, p.y + 65 + offset);
        });
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }

      else if (theme === 'nebula') {
        // Deep cosmic gas clouds
        ctx.fillStyle = '#030206';
        ctx.fillRect(0, 0, width, height);

        gradAngle += 0.0015;

        // Draw shifting clouds
        nebulaClouds.forEach((c, idx) => {
          const dx = Math.sin(gradAngle + idx) * 30;
          const dy = Math.cos(gradAngle * 0.8 + idx) * 22;
          const g = ctx.createRadialGradient(c.x + dx, c.y + dy, 10, c.x + dx, c.y + dy, c.r);
          g.addColorStop(0, c.color);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(c.x + dx, c.y + dy, c.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Floating stardust
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (let i = 0; i < 30; i++) {
          const x = (Math.sin(i + gradAngle * 0.25) * 0.5 + 0.5) * width;
          const y = (Math.cos(i * 1.4 - gradAngle * 0.12) * 0.5 + 0.5) * height;
          const size = (Math.sin(gradAngle * 3.5 + i) * 0.5 + 0.5) * 1.0 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      else if (theme === 'ocean') {
        // Deep blue underwater rays & bubbles
        ctx.fillStyle = '#010813';
        ctx.fillRect(0, 0, width, height);

        // Ambient sun rays from top surface
        gradAngle += 0.0025;
        ctx.fillStyle = 'rgba(14, 165, 233, 0.012)';
        for (let i = 0; i < 4; i++) {
          const angle = 0.35 + Math.sin(gradAngle + i) * 0.12;
          const rayWidth = 110 + i * 35;
          ctx.beginPath();
          ctx.moveTo(width * 0.2 + i * 95, 0);
          ctx.lineTo(width * 0.2 + i * 95 + rayWidth, 0);
          ctx.lineTo(width * 0.2 + i * 95 + rayWidth + Math.tan(angle) * height, height);
          ctx.lineTo(width * 0.2 + i * 95 + Math.tan(angle) * height, height);
          ctx.closePath();
          ctx.fill();
        }

        // Ocean bubbles rising
        bubbles.forEach((b) => {
          ctx.strokeStyle = `rgba(56, 189, 248, ${b.opacity})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.stroke();

          // Move bubbles up
          b.y -= b.speed;
          b.x += Math.sin(b.y * 0.015) * 0.2;
          if (b.y < -b.r * 2) {
            b.y = height + b.r * 2;
            b.x = Math.random() * width;
          }
        });
      }

      else if (theme === 'snow') {
        // Peaceful winter snow falling
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, width, height);

        snowflakes.forEach((s) => {
          ctx.fillStyle = `rgba(224, 231, 255, ${s.opacity})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();

          s.y += s.speed;
          s.x += Math.sin(s.y * 0.01 + s.d) * 0.35; // wind sway

          if (s.y > height) {
            s.y = -s.r * 2;
            s.x = Math.random() * width;
          }
        });
      }

      else if (theme === 'matrix') {
        // Falling green terminal code streams (cascading code)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'; // trails overlay
        ctx.fillRect(0, 0, width, height);

        ctx.font = '11px monospace';
        matrixColumns.forEach((c) => {
          c.chars.forEach((char, idx) => {
            const yPos = c.y - idx * 14;
            if (yPos < 0 || yPos > height) return;

            if (idx === 0) {
              ctx.fillStyle = '#a7f3d0'; // bright terminal green head
            } else {
              ctx.fillStyle = `rgba(16, 185, 129, ${1 - idx / 14})`; // fading green stream
            }
            ctx.fillText(char, c.x, yPos);
          });

          c.y += c.speed;

          if (Math.random() > 0.95) {
            c.chars[0] = String.fromCharCode(33 + Math.floor(Math.random() * 93));
          }

          if (c.y - 14 * 14 > height) {
            c.y = 0;
            c.speed = 2.0 + Math.random() * 3.5;
          }
        });
      }

      else if (theme === 'sakura') {
        // Falling pink cherry blossoms petals
        ctx.fillStyle = '#0f0c10';
        ctx.fillRect(0, 0, width, height);

        petals.forEach((p) => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);

          ctx.fillStyle = `rgba(244, 143, 177, ${p.opacity})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 1.4, p.r * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          p.y += p.speedY;
          p.x += p.speedX + Math.sin(p.y * 0.012) * 0.18; // drifting sway
          p.rot += p.rotSpeed;

          if (p.y > height || p.x > width) {
            p.y = -p.r * 2;
            p.x = Math.random() * width * 0.8 - width * 0.2;
          }
        });
      }

      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
};

// ==========================================
// FOCUS MODE MAIN PAGE COMPONENT
// ==========================================
export const Focus: React.FC = () => {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const { dailyLog, fetchLog } = useDailyStore();
  const { goals, fetchGoals } = useGoalsStore();
  const user = useAuthStore((state) => state.user);

  const {
    timeLeft,
    duration,
    isRunning,
    mode,
    selectedTaskId,
    selectedGoalId,
    priorityLevel,
    analytics,
    achievements,
    startTimer,
    pauseTimer,
    resetTimer,
    setMode,
    setCustomDuration,
    setSelectedTaskId,
    setSelectedGoalId,
    setPriorityLevel,
    tick,
    fetchAnalytics,
    fetchAchievements,
    saveFocusSession,
  } = useFocusStore();

  const [activeTab, setActiveTab] = useState<'timer' | 'analytics' | 'achievements'>('timer');
  const [ambientTheme, setAmbientTheme] = useState<'gradient' | 'rain' | 'forest' | 'library' | 'night' | 'cyber' | 'aurora' | 'nebula' | 'ocean' | 'snow' | 'matrix' | 'sakura'>('gradient');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusLock, setIsFocusLock] = useState(false);
  const [isSettingCustomTime, setIsSettingCustomTime] = useState(false);
  const [customMin, setCustomMin] = useState<number>(45);

  const [quote, setQuote] = useState('');

  // Motivational quotes system
  const quotes = useMemo(
    () => [
      'Focus is a muscle, and you are building it right now.',
      'One focus block at a time. The results will compound.',
      'Simplify. Deep work requires leaving the noise behind.',
      'Your mind is for having ideas, not holding them. Zero distractions.',
      'Great things are done by a series of small things brought together.',
      'Quiet the mind. Link your target. Begin typing.',
      'Deep work is not a chore. It is an act of extreme presence.',
    ],
    []
  );

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [mode, quotes]);

  // Load telemetry data on date sync or mount
  useEffect(() => {
    fetchLog(selectedDate);
    fetchGoals();
    fetchAnalytics(selectedDate);
    fetchAchievements();
  }, [selectedDate, fetchLog, fetchGoals, fetchAnalytics, fetchAchievements]);

  // Clock tick interval
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);



  // Web Audio session completion bell beep
  const playCompletionBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const time = ctx.currentTime;

      // Double high-pitch chime (E5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, time);
      gain1.gain.setValueAtTime(0, time);
      gain1.gain.linearRampToValueAtTime(0.28, time + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);
      osc1.start(time);
      osc1.stop(time + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, time + 0.18);
      gain2.gain.setValueAtTime(0, time + 0.18);
      gain2.gain.linearRampToValueAtTime(0.28, time + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);
      osc2.start(time + 0.18);
      osc2.stop(time + 0.7);
    } catch (err) {
      console.error('Beep synthesizer error:', err);
    }
  };

  // Browser Notification helper
  const sendBrowserNotification = (title: string, message: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  };

  // Listen for timer completion
  const wasRunning = useRef(isRunning);
  useEffect(() => {
    const handleCompletion = async () => {
      if (timeLeft === 0 && wasRunning.current && !isRunning) {
        // Trigger completion
        playCompletionBeep();

        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
        sendBrowserNotification(
          'Focus Session Completed!',
          mode === 'focus'
            ? 'Great job! Take a short break.'
            : 'Break is over, ready to focus?'
        );

        // Submit completed session to backend
        await saveFocusSession(selectedDate, true);
      }
    };
    handleCompletion();
    wasRunning.current = isRunning;
  }, [timeLeft, isRunning, mode, selectedDate, saveFocusSession]);



  // Fullscreen support helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((e) => console.error(e));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        return; // skip typing in inputs
      }

      const key = e.key.toLowerCase();
      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) pauseTimer();
        else startTimer();
      } else if (key === 'r') {
        resetTimer();
      } else if (key === 'n') {
        // Skip current session
        saveFocusSession(selectedDate, false);
        resetTimer();
      } else if (key === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, startTimer, pauseTimer, resetTimer, saveFocusSession, selectedDate]);

  // Format countdown string
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Select item lists
  const activeChecklistTasks = dailyLog?.tasks.filter((t) => !t.completed) || [];
  const currentFocusedTask = dailyLog?.tasks.find((t) => t._id === selectedTaskId);
  const currentFocusedGoal = goals.find((g) => g._id === selectedGoalId);

  const handleCustomTimeSubmit = () => {
    if (customMin < 1 || customMin > 1440) {
      alert('Duration must be between 1 and 1440 minutes.');
      return;
    }
    setCustomDuration(customMin * 60);
    setIsSettingCustomTime(false);
  };

  // Complete checklist task instantly in-focus
  const handleCompleteCurrentTask = async () => {
    if (!selectedTaskId) return;
    // Mark completed on backend and reset state
    await saveFocusSession(selectedDate, true);
  };

  // Countdown calculations
  const progressPercent = duration > 0 ? (timeLeft / duration) * 100 : 0;
  const radius = 105;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Render Analytics Tab
  const renderAnalyticsDashboard = () => {
    if (!analytics) {
      return (
        <div className="text-center font-mono text-xs text-off-white-muted animate-pulse py-8">
          Calculating telemetry charts...
        </div>
      );
    }

    const { todayFocusTime, weeklyFocusTime, monthlyFocusTime, totalSessions, longestSession, averageSessionLength, charts } = analytics;

    const formatSecondsToMinutesString = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.round((seconds % 3600) / 60);
      if (hrs > 0) return `${hrs}h ${mins}m`;
      return `${mins}m`;
    };

    return (
      <div className="space-y-6 w-full max-w-4xl animate-fade-in pb-12">
        {/* Core telemetry stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="col-span-2 bg-panel/75 backdrop-blur border border-border p-4 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-off-white-muted">Today focus time</span>
            <h3 className="text-2xl font-bold font-mono text-accent mt-2">{formatSecondsToMinutesString(todayFocusTime)}</h3>
          </div>
          <div className="col-span-2 bg-panel/75 backdrop-blur border border-border p-4 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-off-white-muted">Weekly focus time</span>
            <h3 className="text-2xl font-bold font-mono text-off-white mt-2">{formatSecondsToMinutesString(weeklyFocusTime)}</h3>
          </div>
          <div className="col-span-2 bg-panel/75 backdrop-blur border border-border p-4 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-off-white-muted">Monthly focus time</span>
            <h3 className="text-2xl font-bold font-mono text-off-white mt-2">{formatSecondsToMinutesString(monthlyFocusTime)}</h3>
          </div>

          <div className="col-span-2 lg:col-span-2 bg-panel/75 backdrop-blur border border-border p-4 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-off-white-muted">Total focus sessions</span>
            <h3 className="text-2xl font-bold font-mono text-off-white mt-2">{totalSessions} <span className="text-xs text-off-white-muted">completed</span></h3>
          </div>
          <div className="col-span-2 lg:col-span-2 bg-panel/75 backdrop-blur border border-border p-4 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-off-white-muted">Longest Session</span>
            <h3 className="text-2xl font-bold font-mono text-off-white mt-2">{formatSecondsToMinutesString(longestSession)}</h3>
          </div>
          <div className="col-span-2 lg:col-span-2 bg-panel/75 backdrop-blur border border-border p-4 rounded-lg flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-off-white-muted">Avg Session Length</span>
            <h3 className="text-2xl font-bold font-mono text-off-white mt-2">{formatSecondsToMinutesString(averageSessionLength)}</h3>
          </div>
        </div>

        {/* Analytics charts widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily hours */}
          <div className="bg-panel/75 backdrop-blur border border-border p-5 rounded-lg flex flex-col">
            <h4 className="text-xs font-mono font-bold text-off-white uppercase tracking-wider mb-4">Daily Focus Hours</h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.dailyFocusHours}>
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={9} tickLine={false} width={20} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px', fontSize: '10px' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="hours" fill="#7c3aed" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly trends */}
          <div className="bg-panel/75 backdrop-blur border border-border p-5 rounded-lg flex flex-col">
            <h4 className="text-xs font-mono font-bold text-off-white uppercase tracking-wider mb-4">Weekly Focus Trend</h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.weeklyFocusTrend}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="#6b7280" fontSize={9} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={9} tickLine={false} width={20} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px', fontSize: '10px' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deep work months */}
          <div className="bg-panel/75 backdrop-blur border border-border p-5 rounded-lg flex flex-col">
            <h4 className="text-xs font-mono font-bold text-off-white uppercase tracking-wider mb-4">Monthly Deep Work Trend</h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.monthlyDeepWorkTrend}>
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={9} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={9} tickLine={false} width={20} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px', fontSize: '10px' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Achievements Tab
  const renderAchievementsList = () => {
    const iconMap = (name: string, unlocked: boolean) => {
      const cl = `w-6 h-6 ${unlocked ? 'text-accent' : 'text-off-white-muted opacity-40'}`;
      if (name === 'Sparkles') return <Sparkles className={cl} />;
      if (name === 'Flame') return <Flame className={cl} />;
      if (name === 'Trophy') return <Trophy className={cl} />;
      if (name === 'Clock') return <Clock className={cl} />;
      return <Award className={cl} />;
    };

    return (
      <div className="w-full max-w-2xl bg-panel/70 backdrop-blur border border-border rounded-lg p-6 animate-fade-in relative overflow-hidden">
        {/* Glow header */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
          <Trophy className="w-4 h-4 text-accent" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-off-white">ACHIEVEMENT_TELEMETRY</h2>
        </div>

        <div className="space-y-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`flex items-center gap-4 p-3.5 border rounded-lg transition-all ${
                ach.unlocked
                  ? 'bg-accent/5 border-accent/25 glow-accent'
                  : 'bg-card/20 border-border/60 opacity-60'
              }`}
            >
              <div className={`p-2.5 rounded border ${ach.unlocked ? 'bg-accent/15 border-accent/30' : 'bg-darkbg/40 border-border/50'}`}>
                {iconMap(ach.icon, ach.unlocked)}
              </div>

              <div className="flex-1 min-w-0 font-mono">
                <div className="flex items-center gap-2">
                  <h3 className={`text-xs font-bold uppercase ${ach.unlocked ? 'text-off-white' : 'text-off-white-muted'}`}>
                    {ach.title}
                  </h3>
                  {ach.unlocked && (
                    <span className="text-[8px] bg-accent/25 border border-accent/30 text-accent font-extrabold px-1 rounded">
                      UNLOCKED
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-off-white-muted mt-1 leading-relaxed">{ach.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#050508] text-off-white p-6 font-mono select-none overflow-x-hidden">
      {/* Animated Background Canvas */}
      <ThemeCanvas theme={ambientTheme} />

      {/* Main Focus Control Container */}
      <div className="w-full max-w-4xl z-10 flex flex-col items-center gap-6">
        
        {/* Immersive Top Bar: Exit and Mode Toggles (Hidden in Distraction Focus Lock) */}
        {!isFocusLock && (
          <div className="w-full flex items-center justify-between border-b border-border/60 pb-3 mb-2 max-w-2xl animate-fade-in bg-panel/20 px-3.5 py-2 rounded-lg backdrop-blur">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border/70 hover:border-accent/30 rounded text-[9px] font-bold text-off-white-muted hover:text-off-white uppercase transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 rotate-180" />
              <span>Dashboard</span>
            </button>

            {/* Navigation Tab Nodes */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('timer')}
                className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${
                  activeTab === 'timer'
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-off-white-muted hover:text-off-white border border-transparent'
                }`}
              >
                Timer
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-off-white-muted hover:text-off-white border border-transparent'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${
                  activeTab === 'achievements'
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-off-white-muted hover:text-off-white border border-transparent'
                }`}
              >
                Badges
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: TIMER CONTAINER */}
        {activeTab === 'timer' && (
          <div className="w-full flex flex-col items-center gap-6">
            
            {/* The main countdown central timer card */}
            <div className="w-full max-w-xl bg-panel/75 backdrop-blur-md border border-border/80 rounded-xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden glow-accent">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

              {/* Timer Header */}
              <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4 w-full justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-accent animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-off-white">FOCUS_OS_V1.0</span>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Focus lock toggler */}
                  <button
                    onClick={() => setIsFocusLock(!isFocusLock)}
                    className={`p-1.5 rounded border transition-colors ${
                      isFocusLock
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-card/40 border-border/50 text-off-white-muted hover:text-off-white'
                    }`}
                    title={isFocusLock ? 'Disable Distraction Lock' : 'Enable Distraction Lock'}
                  >
                    {isFocusLock ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <div className="text-[9px] uppercase font-bold text-accent tracking-wider bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                    {isRunning ? 'Ticking' : 'Idle'}
                  </div>
                </div>
              </div>

              {/* Preset buttons: Hidden in Focus Lock */}
              {!isFocusLock && (
                <div className="flex flex-wrap gap-2 bg-darkbg/50 border border-border/50 p-1.5 rounded-lg w-full mb-6">
                  <button
                    onClick={() => {
                      setMode('focus');
                      setIsSettingCustomTime(false);
                    }}
                    className={`flex-1 py-1.5 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all ${
                      mode === 'focus'
                        ? 'bg-accent/15 text-accent border border-accent/25'
                        : 'text-off-white-muted hover:text-off-white border border-transparent'
                    }`}
                  >
                    Pomodoro (25m)
                  </button>
                  <button
                    onClick={() => {
                      setMode('custom');
                      setCustomDuration(50 * 60);
                      setIsSettingCustomTime(false);
                    }}
                    className={`flex-1 py-1.5 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all ${
                      mode === 'custom' && duration === 50 * 60
                        ? 'bg-accent/15 text-accent border border-accent/25'
                        : 'text-off-white-muted hover:text-off-white border border-transparent'
                    }`}
                  >
                    Deep Work (50m)
                  </button>
                  <button
                    onClick={() => {
                      setMode('shortBreak');
                      setIsSettingCustomTime(false);
                    }}
                    className={`px-3 py-1.5 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all ${
                      mode === 'shortBreak'
                        ? 'bg-accent/15 text-accent border border-accent/25'
                        : 'text-off-white-muted hover:text-off-white border border-transparent'
                    }`}
                  >
                    Break (5m)
                  </button>
                  <button
                    onClick={() => setIsSettingCustomTime(!isSettingCustomTime)}
                    className={`px-3 py-1.5 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all ${
                      isSettingCustomTime || (mode === 'custom' && duration !== 50 * 60)
                        ? 'bg-accent/15 text-accent border border-accent/25'
                        : 'text-off-white-muted hover:text-off-white border border-transparent'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              )}

              {/* Custom time settings widget */}
              {isSettingCustomTime && !isFocusLock && (
                <div className="flex items-center gap-2.5 bg-darkbg/60 border border-border p-2.5 rounded mb-6 w-full animate-fade-in">
                  <span className="text-[9px] uppercase font-extrabold text-off-white-muted pl-1">Minutes:</span>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={customMin}
                    onChange={(e) => setCustomMin(parseInt(e.target.value) || 0)}
                    className="w-16 px-2.5 py-1 bg-card border border-border rounded text-xs text-off-white text-center outline-none focus:border-accent font-bold"
                  />
                  <button
                    onClick={handleCustomTimeSubmit}
                    className="px-3.5 py-1.5 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded text-[9px] font-bold uppercase transition-colors ml-auto"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setIsSettingCustomTime(false)}
                    className="px-3 py-1.5 bg-card hover:bg-card-dim border border-border rounded text-[9px] text-off-white-muted hover:text-off-white uppercase transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Large circular countdown timer graphics */}
              <div className="relative w-64 h-64 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r={radius}
                    className="stroke-card/40"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r={radius}
                    className="stroke-accent transition-all duration-300 ease-linear"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0px 0px 4px rgba(124, 58, 237, 0.45))' }}
                  />
                </svg>

                {/* Centered text timer digits */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-5xl font-extrabold tracking-tighter text-off-white font-mono">
                    {formatTimeRemaining(timeLeft)}
                  </span>
                  <span className="text-[8px] uppercase tracking-widest text-off-white-muted mt-2">
                    {mode === 'focus'
                      ? 'Deep Focus'
                      : mode === 'shortBreak'
                      ? 'Short Break'
                      : mode === 'longBreak'
                      ? 'Long Break'
                      : 'Custom Focus'}
                  </span>
                </div>
              </div>

              {/* Controls triggers */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={resetTimer}
                  className="p-3 bg-card hover:bg-card-dim border border-border/80 hover:border-accent/40 rounded-full text-off-white transition-all active:scale-95"
                  title="Reset Timer (R)"
                >
                  <RotateCcw className="w-4 h-4 text-off-white-muted hover:text-off-white" />
                </button>

                <button
                  onClick={isRunning ? pauseTimer : startTimer}
                  className="p-5 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded-full transition-all active:scale-90 glow-accent"
                  title={isRunning ? 'Pause Timer (Space)' : 'Start Timer (Space)'}
                >
                  {isRunning ? <Pause className="w-6 h-6 stroke-[3]" /> : <Play className="w-6 h-6 stroke-[3] fill-darkbg" />}
                </button>

                <button
                  onClick={() => {
                    saveFocusSession(selectedDate, false);
                    resetTimer();
                  }}
                  className="p-3 bg-card hover:bg-card-dim border border-border/80 hover:border-accent/40 rounded-full text-off-white transition-all active:scale-95 text-off-white-muted hover:text-off-white text-xs font-bold"
                  title="Skip Session (N)"
                >
                  Skip
                </button>
              </div>

              {/* Connected details status (Current Task / Goal) */}
              {(currentFocusedTask || currentFocusedGoal) && (
                <div className="w-full flex flex-col gap-2 border-t border-border/30 pt-4 animate-fade-in font-mono text-[10px]">
                  {currentFocusedTask && (
                    <div className="flex items-center justify-between bg-darkbg/40 border border-accent/20 rounded p-2.5">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] uppercase text-off-white-muted">Active Focus Object</span>
                        <span className="font-bold text-off-white truncate">{currentFocusedTask.title}</span>
                      </div>
                      <button
                        onClick={handleCompleteCurrentTask}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded text-[8px] font-extrabold uppercase transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>
                    </div>
                  )}

                  {currentFocusedGoal && (
                    <div className="flex items-center justify-between bg-darkbg/40 border border-border/40 rounded p-2.5">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[8px] uppercase text-off-white-muted">Aligned Objective</span>
                        <span className="font-bold text-off-white truncate">{currentFocusedGoal.title}</span>
                      </div>
                      <span className="text-accent font-bold">{currentFocusedGoal.progress}% Progress</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Config links and Ambient selector (Hidden in Focus Lock distraction mode) */}
            {!isFocusLock && (
              <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                {/* 1. Integration parameters */}
                <div className="bg-panel/75 backdrop-blur border border-border p-5 rounded-lg flex flex-col gap-3.5">
                  <div className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Focus Integrations</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] uppercase font-bold text-off-white-muted">Align with Goal</label>
                      <select
                        value={selectedGoalId || ''}
                        onChange={(e) => setSelectedGoalId(e.target.value || null)}
                        className="w-full px-2 py-1.5 bg-darkbg border border-border rounded text-[10px] text-off-white outline-none focus:border-accent font-bold"
                      >
                        <option value="">-- NO_GOAL_ALIGNED --</option>
                        {goals.map((g) => (
                          <option key={g._id} value={g._id}>
                            {g.title} ({g.progress}%)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] uppercase font-bold text-off-white-muted">Align with Checklist Task</label>
                      <select
                        value={selectedTaskId || ''}
                        onChange={(e) => setSelectedTaskId(e.target.value || null)}
                        className="w-full px-2 py-1.5 bg-darkbg border border-border rounded text-[10px] text-off-white outline-none focus:border-accent font-bold"
                      >
                        <option value="">-- NO_TASK_CONNECTED --</option>
                        {activeChecklistTasks.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.title} (+{t.points} pts) [{t.category.toUpperCase()}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] uppercase font-bold text-off-white-muted">Priority Level</label>
                      <div className="flex gap-2.5">
                        {(['low', 'medium', 'high'] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setPriorityLevel(priorityLevel === p ? null : p)}
                            className={`flex-1 py-1 rounded text-[8px] font-extrabold uppercase border transition-all ${
                              priorityLevel === p
                                ? p === 'high'
                                  ? 'bg-red-500/10 border-red-500/40 text-red-400 font-extrabold'
                                  : p === 'medium'
                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-extrabold'
                                  : 'bg-blue-500/10 border-blue-500/40 text-blue-400 font-extrabold'
                                : 'bg-darkbg/40 border-border/70 text-off-white-muted hover:text-off-white'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Theme selector */}
                <div className="bg-panel/75 backdrop-blur border border-border p-5 rounded-lg flex flex-col gap-3.5">
                  <div className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Background Themes</span>
                  </div>

                  <div className="space-y-3.5">
                    {/* Ambient Themes selection grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'gradient', label: 'Gradient' },
                        { id: 'rain', label: 'Rain' },
                        { id: 'forest', label: 'Forest' },
                        { id: 'library', label: 'Library' },
                        { id: 'night', label: 'Night' },
                        { id: 'cyber', label: 'Cyber' },
                        { id: 'aurora', label: 'Aurora' },
                        { id: 'nebula', label: 'Nebula' },
                        { id: 'ocean', label: 'Ocean' },
                        { id: 'snow', label: 'Snow' },
                        { id: 'matrix', label: 'Matrix' },
                        { id: 'sakura', label: 'Sakura' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setAmbientTheme(t.id as any)}
                          className={`py-2 rounded text-[8px] font-extrabold uppercase border text-center transition-all ${
                            ambientTheme === t.id
                              ? 'bg-accent/15 border-accent/30 text-accent glow-accent'
                              : 'bg-darkbg/40 border-border/50 text-off-white-muted hover:text-off-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Immersive stats display: Hide in Focus Lock distraction mode */}
            {!isFocusLock && (
              <div className="w-full max-w-xl grid grid-cols-3 gap-4 border border-border/50 bg-panel/30 rounded-lg p-4 backdrop-blur font-mono text-[9px] uppercase tracking-wider text-off-white-muted text-center animate-fade-in">
                <div className="flex flex-col gap-1 border-r border-border/40">
                  <span>Streak counts</span>
                  <span className="text-sm font-bold text-accent font-mono mt-0.5">
                    {user?.dailyFocusStreak || 0} days
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-r border-border/40">
                  <span>Deep weeks</span>
                  <span className="text-sm font-bold text-off-white font-mono mt-0.5">
                    {user?.weeklyDeepWorkStreak || 0} wks
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span>Focus Hours</span>
                  <span className="text-sm font-bold text-off-white font-mono mt-0.5">
                    {parseFloat((user?.totalFocusHours || 0).toFixed(1))} hrs
                  </span>
                </div>
              </div>
            )}

            {/* Motivational Quote Footer (Hidden in Focus Lock) */}
            {!isFocusLock && (
              <p className="text-[10px] text-off-white-muted max-w-md text-center italic mt-2 opacity-75">
                "{quote}"
              </p>
            )}

            {/* Fullscreen Button overlay */}
            <button
              onClick={toggleFullscreen}
              className="fixed bottom-6 right-6 p-3 bg-panel/85 border border-border hover:border-accent/40 rounded-full text-off-white transition-all shadow-2xl active:scale-95 pointer-events-auto"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-off-white-muted hover:text-off-white" /> : <Maximize2 className="w-4 h-4 text-off-white-muted hover:text-off-white" />}
            </button>
          </div>
        )}

        {/* Tab 2: ANALYTICS CONTAINER */}
        {activeTab === 'analytics' && renderAnalyticsDashboard()}

        {/* Tab 3: ACHIEVEMENTS CONTAINER */}
        {activeTab === 'achievements' && renderAchievementsList()}
      </div>
    </div>
  );
};

export default Focus;

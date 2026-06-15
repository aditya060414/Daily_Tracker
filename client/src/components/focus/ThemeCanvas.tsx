import React, { useEffect, useRef } from 'react';

interface ThemeCanvasProps {
  theme: 'gradient' | 'rain' | 'forest' | 'library' | 'night' | 'cyber' | 'aurora' | 'nebula' | 'ocean' | 'snow' | 'matrix' | 'sakura';
}

export const ThemeCanvas: React.FC<ThemeCanvasProps> = ({ theme }) => {
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
          y: Math.random() * height * 0.75,
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

    let gradAngle = 0;

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

          r.y += r.speed;
          if (r.y > height) {
            r.y = -r.length;
            r.x = Math.random() * width;
          }
        });
      }

      else if (theme === 'forest') {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#030806');
        grad.addColorStop(1, '#08140f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

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
        const grad = ctx.createRadialGradient(width * 0.5, height * 0.7, 10, width * 0.5, height * 0.7, Math.max(width, height) * 0.85);
        grad.addColorStop(0, '#1a100a');
        grad.addColorStop(0.5, '#0d0703');
        grad.addColorStop(1, '#050302');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

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
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#020208');
        grad.addColorStop(0.5, '#050512');
        grad.addColorStop(1, '#0b0b1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        stars.forEach((s) => {
          s.phase += s.speed;
          const currentOpacity = s.maxOpacity * (0.3 + 0.7 * Math.abs(Math.sin(s.phase)));

          ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.shadowColor = 'rgba(254, 240, 138, 0.15)';
        ctx.shadowBlur = 40;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
        ctx.beginPath();
        ctx.arc(width * 0.8, height * 0.2, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#020208';
        ctx.beginPath();
        ctx.arc(width * 0.78, height * 0.18, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      else if (theme === 'cyber') {
        ctx.fillStyle = '#030307';
        ctx.fillRect(0, 0, width, height);

        cyberOffset = (cyberOffset + 1.2) % 40;

        ctx.strokeStyle = 'rgba(124, 58, 237, 0.08)';
        ctx.lineWidth = 1.0;

        for (let y = cyberOffset; y < height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        for (let x = 0; x < width; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

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

        const scanY = (gradAngle * 450) % height;
        ctx.fillStyle = 'rgba(124, 58, 237, 0.015)';
        ctx.fillRect(0, scanY, width, 6);
      }

      else if (theme === 'aurora') {
        ctx.fillStyle = '#020205';
        ctx.fillRect(0, 0, width, height);

        gradAngle += 0.005;

        const points: { x: number; y: number }[] = [];
        for (let x = 0; x < width; x += 15) {
          const wave = Math.sin(x * 0.003 + gradAngle * 1.8) * 45 + Math.cos(x * 0.007 - gradAngle * 0.8) * 25;
          points.push({ x, y: height * 0.25 + wave });
        }

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
        ctx.shadowBlur = 0;
      }

      else if (theme === 'nebula') {
        ctx.fillStyle = '#030206';
        ctx.fillRect(0, 0, width, height);

        gradAngle += 0.0015;

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
        ctx.fillStyle = '#010813';
        ctx.fillRect(0, 0, width, height);

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

        bubbles.forEach((b) => {
          ctx.strokeStyle = `rgba(56, 189, 248, ${b.opacity})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.stroke();

          b.y -= b.speed;
          b.x += Math.sin(b.y * 0.015) * 0.2;
          if (b.y < -b.r * 2) {
            b.y = height + b.r * 2;
            b.x = Math.random() * width;
          }
        });
      }

      else if (theme === 'snow') {
        ctx.fillStyle = '#0a0d14';
        ctx.fillRect(0, 0, width, height);

        snowflakes.forEach((s) => {
          ctx.fillStyle = `rgba(224, 231, 255, ${s.opacity})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();

          s.y += s.speed;
          s.x += Math.sin(s.y * 0.01 + s.d) * 0.35;

          if (s.y > height) {
            s.y = -s.r * 2;
            s.x = Math.random() * width;
          }
        });
      }

      else if (theme === 'matrix') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = '11px monospace';
        matrixColumns.forEach((c) => {
          c.chars.forEach((char, idx) => {
            const yPos = c.y - idx * 14;
            if (yPos < 0 || yPos > height) return;

            if (idx === 0) {
              ctx.fillStyle = '#a7f3d0';
            } else {
              ctx.fillStyle = `rgba(16, 185, 129, ${1 - idx / 14})`;
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
          p.x += p.speedX + Math.sin(p.y * 0.012) * 0.18;
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
export default ThemeCanvas;

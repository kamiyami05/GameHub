import React, { useEffect, useRef } from 'react';

export default function AnimatedBackground({ theme = 'lobby' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pools based on theme
    const particles = [];
    const count = theme === 'lobby' ? 45 : 35;

    if (theme === 'caro') {
      // Caro theme: Dual Cyan & Crimson celestial energy nodes
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          radius: 1.5 + Math.random() * 2,
          color: i % 2 === 0 ? '#38bdf8' : '#f43f5e',
          alpha: 0.2 + Math.random() * 0.5
        });
      }
    } else if (theme === '2048') {
      // 2048 theme: Floating glowing number cubes
      const tileValues = [2, 4, 8, 16, 32, 64, 128, 2048];
      for (let i = 0; i < 20; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.3 - Math.random() * 0.5,
          size: 28 + Math.random() * 20,
          val: tileValues[Math.floor(Math.random() * tileValues.length)],
          color: '#f59e0b',
          alpha: 0.15 + Math.random() * 0.35,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.01
        });
      }
    } else if (theme === 'minesweeper') {
      // Minesweeper theme: Sonar radar particles and digital grid
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: 2 + Math.random() * 2,
          color: '#34d399',
          alpha: 0.2 + Math.random() * 0.6
        });
      }
    } else {
      // Lobby: Deep galaxy starlight & constellation links
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: 1 + Math.random() * 2,
          color: '#60a5fa',
          alpha: 0.2 + Math.random() * 0.6
        });
      }
    }

    let radarAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Background ambient gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 3, 50,
        width / 2, height / 2, Math.max(width, height)
      );
      if (theme === 'caro') {
        bgGrad.addColorStop(0, '#131826');
        bgGrad.addColorStop(1, '#0b0d12');
      } else if (theme === '2048') {
        bgGrad.addColorStop(0, '#1c1813');
        bgGrad.addColorStop(1, '#0c0a08');
      } else if (theme === 'minesweeper') {
        bgGrad.addColorStop(0, '#0f1a17');
        bgGrad.addColorStop(1, '#080d0b');
      } else {
        bgGrad.addColorStop(0, '#151922');
        bgGrad.addColorStop(1, '#0d0f14');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Theme Specific Visuals
      if (theme === 'caro') {
        // Subtle cyber grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
        ctx.lineWidth = 1;
        const gridStep = 60;
        for (let x = 0; x < width; x += gridStep) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += gridStep) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        // Render & link particles
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Connect nearby particles
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 110) {
              ctx.save();
              ctx.globalAlpha = (1 - dist / 110) * 0.15;
              ctx.strokeStyle = p.color;
              ctx.lineWidth = 0.75;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      } else if (theme === '2048') {
        // Render floating 2048 tiles
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx; p.y += p.vy; p.rot += p.vRot;
          if (p.y + p.size < 0) { p.y = height + 20; p.x = Math.random() * width; }
          if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = p.alpha;

          // Tile box
          ctx.fillStyle = p.val >= 128 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.08)';
          ctx.strokeStyle = p.val >= 128 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(56, 189, 248, 0.2)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-p.size / 2, -p.size / 2, p.size, p.size, 8);
          ctx.fill();
          ctx.stroke();

          // Tile text
          ctx.fillStyle = p.val >= 128 ? '#fbbf24' : '#94a3b8';
          ctx.font = `bold ${p.size * 0.35}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.val.toString(), 0, 0);

          ctx.restore();
        }
      } else if (theme === 'minesweeper') {
        // Radar Sonar sweep
        radarAngle += 0.015;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxR = Math.min(width, height) * 0.45;

        ctx.save();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.08)';
        ctx.lineWidth = 1;
        for (let r = 80; r <= maxR; r += 80) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Radar line
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(radarAngle) * maxR, centerY + Math.sin(radarAngle) * maxR);
        ctx.stroke();
        ctx.restore();

        // Particles
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else {
        // Lobby galaxy particles & constellation lines
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 100) {
              ctx.save();
              ctx.globalAlpha = (1 - dist / 100) * 0.12;
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
    />
  );
}

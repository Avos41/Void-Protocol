import { useEffect, useRef, useCallback } from "react";

// ── Configuration ──────────────────────────────────────
const STAR_COUNTS = [150, 90, 45]; // far, mid, near layers
const STAR_SPEEDS = [0.1, 0.25, 0.45]; // pixels per frame
const STAR_SIZES = [0.6, 1.1, 1.8]; // radius — crisp pinpoints
const STAR_BASE_OPACITY = [0.3, 0.5, 0.75]; // visible but not harsh
const TWINKLE_AMPLITUDE = [0.55, 0.45, 0.3]; // noticeable blink
const SHOOTING_STAR_INTERVAL = 4000; // ms between shooting stars
const NEBULA_COLORS = [
  { x: 0.15, y: 0.25, r: 380, color: "rgba(90, 20, 120, 0.045)" }, // dark purple
  { x: 0.8, y: 0.6, r: 420, color: "rgba(10, 40, 90, 0.055)" }, // deep blue
  { x: 0.5, y: 0.85, r: 320, color: "rgba(0, 80, 100, 0.04)" }, // dark cyan
];

interface Star {
  x: number;
  y: number;
  twinkleOffset: number;
  twinkleSpeed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
  opacity: number;
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[][]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);
  const lastShootingRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const dprRef = useRef(1);

  // Generate stars once
  const initStars = useCallback((w: number, h: number) => {
    starsRef.current = STAR_COUNTS.map((count) => {
      const layer: Star[] = [];
      for (let i = 0; i < count; i++) {
        layer.push({
          x: Math.random() * w,
          y: Math.random() * h,
          twinkleOffset: Math.random() * Math.PI * 2,
          // Much faster twinkle: full cycle every ~120–300 frames
          twinkleSpeed: 0.02 + Math.random() * 0.04,
        });
      }
      return layer;
    });
  }, []);

  // Spawn a shooting star
  const spawnShootingStar = useCallback((w: number, h: number) => {
    const angle = (Math.PI / 6) + Math.random() * (Math.PI / 4);
    const speed = 4 + Math.random() * 6;
    shootingStarsRef.current.push({
      x: Math.random() * w * 0.7,
      y: Math.random() * h * 0.3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      length: 60 + Math.random() * 80,
      life: 0,
      maxLife: 40 + Math.random() * 30,
      opacity: 0.7 + Math.random() * 0.3,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check reduced motion preference
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mql.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mql.addEventListener("change", handleMotionChange);

    const ctx = canvas.getContext("2d", { alpha: true })!;

    // Resize handler
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      // Reset transform before setting new scale
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      initStars(w, h);
    };

    resize();
    window.addEventListener("resize", resize);

    // Animation loop — draw directly to main canvas (simpler, avoids DPR blit issues)
    const animate = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const frame = frameRef.current++;
      const now = performance.now();

      // Clear canvas
      ctx.clearRect(0, 0, w, h);

      // Draw nebula gradients
      for (const neb of NEBULA_COLORS) {
        const gradient = ctx.createRadialGradient(
          neb.x * w, neb.y * h, 0,
          neb.x * w, neb.y * h, neb.r
        );
        gradient.addColorStop(0, neb.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      // Draw star layers
      for (let layer = 0; layer < starsRef.current.length; layer++) {
        const stars = starsRef.current[layer];
        const speed = reducedMotionRef.current ? 0 : STAR_SPEEDS[layer];
        const size = STAR_SIZES[layer];
        const baseOpacity = STAR_BASE_OPACITY[layer];
        const amplitude = TWINKLE_AMPLITUDE[layer];

        for (const star of stars) {
          // Move star downward (parallax scroll)
          if (!reducedMotionRef.current) {
            star.y += speed;
            if (star.y > h + 5) {
              star.y = -5;
              star.x = Math.random() * w;
            }
          }

          // Twinkle — use sin wave with strong amplitude so stars visibly blink
          const twinkle = reducedMotionRef.current
            ? baseOpacity
            : baseOpacity + Math.sin(frame * star.twinkleSpeed + star.twinkleOffset) * amplitude;

          const opacity = Math.max(0.03, Math.min(1, twinkle));

          ctx.beginPath();
          ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220, 230, 255, ${opacity})`;
          ctx.fill();

          // Soft glow halo for near stars when bright
          if (layer === 2 && opacity > 0.65) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, size * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 220, 255, ${(opacity - 0.65) * 0.25})`;
            ctx.fill();
          }

          // Very subtle glow for medium stars at peak brightness
          if (layer === 1 && opacity > 0.8) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, size * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 230, 255, ${(opacity - 0.8) * 0.15})`;
            ctx.fill();
          }
        }
      }

      // Shooting stars
      if (!reducedMotionRef.current) {
        if (now - lastShootingRef.current > SHOOTING_STAR_INTERVAL) {
          spawnShootingStar(w, h);
          lastShootingRef.current = now;
        }

        shootingStarsRef.current = shootingStarsRef.current.filter((s) => {
          s.x += s.vx;
          s.y += s.vy;
          s.life++;
          const progress = s.life / s.maxLife;
          const alpha = progress < 0.1 ? progress * 10 : (1 - progress) * s.opacity;

          if (alpha <= 0 || s.life >= s.maxLife) return false;

          const mag = Math.hypot(s.vx, s.vy);

          // Draw trail
          const gradient = ctx.createLinearGradient(
            s.x, s.y,
            s.x - s.vx * (s.length / mag),
            s.y - s.vy * (s.length / mag)
          );
          gradient.addColorStop(0, `rgba(200, 240, 255, ${alpha})`);
          gradient.addColorStop(0.3, `rgba(150, 220, 255, ${alpha * 0.5})`);
          gradient.addColorStop(1, "transparent");

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          const tailLen = s.length * Math.min(1, s.life / 10);
          ctx.lineTo(
            s.x - (s.vx / mag) * tailLen,
            s.y - (s.vy / mag) * tailLen
          );
          ctx.stroke();

          // Head glow
          ctx.beginPath();
          ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220, 250, 255, ${alpha})`;
          ctx.fill();

          return true;
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      mql.removeEventListener("change", handleMotionChange);
    };
  }, [initStars, spawnShootingStar]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

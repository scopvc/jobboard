"use client";

import { useEffect, useRef } from "react";

const DOT_SPACING = 28;
const DOT_RADIUS = 1.8;
const CURSOR_RADIUS = 180;
const DISPLACEMENT = 50;
const LERP = 0.06;
const DOT_COLOR = "#374151"; // gray-700
const INSET_X_LEFT = DOT_SPACING;
const INSET_X_RIGHT = DOT_SPACING * 2;
const INSET_Y = DOT_SPACING;

interface Dot {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
}

export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function buildGrid() {
      const dots: Dot[] = [];
      const rect = canvas!.getBoundingClientRect();
      const usableW = rect.width - INSET_X_LEFT - INSET_X_RIGHT;
      const usableH = rect.height - INSET_Y * 2;
      const cols = Math.floor(usableW / DOT_SPACING) + 1;
      const rows = Math.floor(usableH / DOT_SPACING) + 1;
      const offsetX = INSET_X_LEFT + (usableW - (cols - 1) * DOT_SPACING) / 2;
      const offsetY = INSET_Y + (usableH - (rows - 1) * DOT_SPACING) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offsetX + c * DOT_SPACING;
          const y = offsetY + r * DOT_SPACING;
          dots.push({ homeX: x, homeY: y, x, y });
        }
      }
      dotsRef.current = dots;
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx!.scale(dpr, dpr);
      buildGrid();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    function onMouseLeave() {
      mouseRef.current = null;
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    let time = 0;

    function draw() {
      time += 0.015;
      const w = canvas!.getBoundingClientRect().width;
      const h = canvas!.getBoundingClientRect().height;
      ctx!.clearRect(0, 0, w, h);

      const mouse = mouseRef.current;
      const dots = dotsRef.current;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        let targetX = dot.homeX;
        let targetY = dot.homeY;

        if (mouse) {
          const dx = dot.homeX - mouse.x;
          const dy = dot.homeY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CURSOR_RADIUS) {
            const force = (1 - dist / CURSOR_RADIUS) * DISPLACEMENT;
            const angle = Math.atan2(dy, dx);
            targetX = dot.homeX + Math.cos(angle) * force;
            targetY = dot.homeY + Math.sin(angle) * force;
          }
        } else {
          // Ambient wave on mobile / no cursor
          const wave =
            Math.sin(dot.homeX * 0.02 + time) *
            Math.cos(dot.homeY * 0.02 + time * 0.7) *
            3;
          targetX = dot.homeX + wave;
          targetY = dot.homeY + wave * 0.6;
        }

        dot.x += (targetX - dot.x) * LERP;
        dot.y += (targetY - dot.y) * LERP;

        ctx!.beginPath();
        ctx!.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx!.fillStyle = DOT_COLOR;
        ctx!.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ display: "block" }}
    />
  );
}

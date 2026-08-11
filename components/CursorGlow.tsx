"use client";

import { useEffect, useRef, useState } from "react";

export function CursorGlow() {
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [targetPosition, setTargetPosition] = useState({ x: -1000, y: -1000 });
  const [isVisible, setIsVisible] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const lastPos = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      const v = Math.sqrt(dx * dx + dy * dy);
      setVelocity(Math.min(v, 50));
      lastPos.current = { x: e.clientX, y: e.clientY };
      setTargetPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isVisible]);

  // Smooth trailing with spring-like interpolation
  useEffect(() => {
    const lerp = () => {
      setPosition((prev) => ({
        x: prev.x + (targetPosition.x - prev.x) * 0.12,
        y: prev.y + (targetPosition.y - prev.y) * 0.12,
      }));
      animRef.current = requestAnimationFrame(lerp);
    };
    animRef.current = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(animRef.current);
  }, [targetPosition]);

  // Color shifts from indigo to cyan based on velocity
  const hue = 290 - Math.min(velocity, 30) * 3; // 290 (indigo) → 200 (cyan)
  const size = 500 + velocity * 4;

  return (
    <>
      {/* Outer aurora layer */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
        style={{
          opacity: isVisible ? 0.6 : 0,
          background: `radial-gradient(${size + 200}px circle at ${position.x}px ${position.y}px, oklch(0.65 0.15 ${hue} / 0.08), transparent 50%)`,
        }}
      />
      {/* Inner focused spotlight */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: isVisible ? 1 : 0,
          background: `radial-gradient(${size}px circle at ${position.x}px ${position.y}px, oklch(0.65 0.22 ${hue} / 0.12), transparent 40%)`,
        }}
      />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

export function CursorGlow() {
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
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

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
      style={{
        opacity: isVisible ? 1 : 0,
        background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, oklch(0.65 0.18 290 / 0.15), transparent 40%)`,
      }}
    />
  );
}

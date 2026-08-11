"use client";

import { useRef, useState, type ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glareOpacity?: number;
  tiltDegree?: number;
}

export function TiltCard({ 
  children, 
  className = "", 
  glareOpacity = 0.15, 
  tiltDegree = 15 
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg)");
  const [glareStyle, setGlareStyle] = useState({ opacity: 0, background: "" });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -tiltDegree;
    const rotateY = ((x - centerX) / centerX) * tiltDegree;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    
    // Glare effect
    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;
    setGlareStyle({
      opacity: glareOpacity,
      background: `linear-gradient(${angle}deg, rgba(255,255,255,0.25) 0%, transparent 60%)`,
    });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlareStyle({ opacity: 0, background: "" });
  };

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        transform,
        transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {/* Glare overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-inherit"
        style={{
          opacity: glareStyle.opacity,
          background: glareStyle.background,
          transition: "opacity 0.3s ease",
          borderRadius: "inherit",
        }}
      />
    </div>
  );
}

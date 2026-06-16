'use client'

import React, { useState, useRef } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export function TiltCard({ children, className = '' }: TiltCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Y eksenindeki eğim X rotasyonunu, X eksenindeki eğim Y rotasyonunu belirler
    const tiltX = ((y - centerY) / centerY) * -15;
    const tiltY = ((x - centerX) / centerX) * 15;
    
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Gölge pozisyonu eğime göre değişsin (Aydınlatma efekti)
  const shadowX = tilt.y * 1;
  const shadowY = tilt.x * -1; // Y ekseni aşağısı için eksi
  const shadowBlur = 30 + Math.abs(tilt.x + tilt.y) * 1;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      // Kartın kendisi ve hover durumu
      className={`relative cursor-pointer transition-transform duration-200 ease-out transform-gpu ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`,
        // Neon mavi bir 3D gölge efekti
        boxShadow: `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0, 242, 254, 0.15)`,
      }}
    >
      {children}
    </div>
  );
}

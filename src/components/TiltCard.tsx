'use client'

import React, { useState, useRef } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
}

export function TiltCard({ children, className = '', wrapperClassName = '' }: TiltCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
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
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
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
      // Sabit kapsayıcı - Mouse olaylarını yakalar ve asla hareket etmez, böylece sınırda titreme (jitter) yapmaz.
      className={`relative perspective-[1000px] ${wrapperClassName}`}
    >
      <div
        // Kartın kendisi ve görsel özellikleri - Sadece bu div eğilir
        className={`transition-transform duration-200 ease-out transform-gpu ${className}`}
        style={{
          transform: isHovered ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)` : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          boxShadow: isHovered ? `${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0, 242, 254, 0.15)` : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

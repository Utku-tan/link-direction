"use client";

import { useRef, useEffect } from "react";
import { useScroll, useSpring, useAnimationFrame } from "framer-motion";

export function ScrollVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll();
  
  // Kaydırma hareketini yumuşatmak için Spring animasyonu ekliyoruz
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001
  });

  // Framer Motion'ın her karede (60fps) çalışan döngüsüyle videoyu senkronize et
  useAnimationFrame(() => {
    if (videoRef.current && videoRef.current.readyState >= 1 && !isNaN(videoRef.current.duration)) {
      const targetTime = videoRef.current.duration * smoothProgress.get();
      
      // Sadece zaman farkı belirginse (0.01 saniyeden büyükse) videoyu sar (Performans için)
      if (Math.abs(videoRef.current.currentTime - targetTime) > 0.01) {
        videoRef.current.currentTime = targetTime;
      }
    }
  });

  // Tarayıcının videoyu kendi kendine oynatmasını durdur
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden pointer-events-none bg-black">
      <video
        ref={videoRef}
        src="/videos/hero-stamp.mp4"
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        preload="auto"
      />
      {/* Hafif karartma katmanı (Overlay) - Yazıların videonun önünde okunabilmesi için */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/80 via-[#030712]/50 to-transparent" />
      <div className="absolute inset-0 bg-[#030712]/30" />
    </div>
  );
}

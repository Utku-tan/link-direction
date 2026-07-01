"use client";

import { useRef, useEffect } from "react";
import { useScroll, useMotionValueEvent, useSpring } from "framer-motion";

export function ScrollVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll();
  
  // Kaydırma hareketini yumuşatmak için Spring animasyonu ekliyoruz
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001
  });

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (videoRef.current && !isNaN(videoRef.current.duration)) {
      videoRef.current.currentTime = videoRef.current.duration * latest;
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

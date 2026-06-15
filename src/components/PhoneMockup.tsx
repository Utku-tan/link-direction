'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

// Konfeti parçacıkları için basit bir dizi
const PARTICLE_COUNT = 12
const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  const angle = (i / PARTICLE_COUNT) * Math.PI * 2
  const distance = 100 + Math.random() * 50
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 1.5,
  }
})

export function PhoneMockup() {
  const ref = useRef(null)
  const isInView = useInView(ref, { margin: "-40% 0px -40% 0px", once: false })
  const [isTapped, setIsTapped] = useState(false)

  useEffect(() => {
    if (isInView) {
      // Damganın "bam" diye vurduğu anı (tahmini gecikme)
      const timer = setTimeout(() => setIsTapped(true), 300) 
      return () => clearTimeout(timer)
    } else {
      setIsTapped(false)
    }
  }, [isInView])

  return (
    <div ref={ref} className="relative w-[280px] h-[580px] rounded-[50px] border-[14px] border-[#1e293b] bg-black shadow-2xl flex flex-col overflow-visible ring-1 ring-white/20">
      
      {/* Çentik (Notch) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[25px] bg-[#1e293b] rounded-b-[16px] z-20 flex items-center justify-center">
        <div className="w-12 h-1.5 rounded-full bg-black/60" />
      </div>

      {/* Ekran İçeriği */}
      <div className="flex-1 w-full relative bg-gradient-to-b from-[#020617] to-[#0f172a] p-6 pt-16 flex flex-col items-center overflow-hidden rounded-[36px]">
        
        {/* Arka plan sahte UI */}
        <div className="w-full flex justify-between items-center opacity-20 blur-[1px]">
          <div className="w-1/3 h-2 rounded-full bg-white/30" />
          <div className="w-8 h-8 rounded-full bg-white/30" />
        </div>
        <div className="w-full h-32 mt-8 rounded-3xl bg-white/5 opacity-20 blur-[1px]" />
        <div className="w-full h-12 mt-4 rounded-xl bg-white/5 opacity-20 blur-[1px]" />

        {/* NFC Okutma Hedefi */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/5 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border border-dashed border-white/10 animate-[spin_10s_linear_infinite]" />
        </div>

        {/* Konfeti / Patlama Efekti (Z-40) */}
        {isTapped && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
            {particles.map((p, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                animate={{ x: p.x, y: p.y, scale: p.scale, opacity: 0, rotate: p.rotation }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute w-2 h-2 rounded-full bg-[#00f2fe] shadow-[0_0_10px_#00f2fe]"
              />
            ))}
          </div>
        )}

        {/* Başarı Pop-up'ı */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5, y: 30 }}
          animate={isTapped ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.5, y: 30 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="absolute inset-0 m-auto w-[240px] h-[280px] bg-[#0f172a]/95 backdrop-blur-xl rounded-[32px] border border-[#00f2fe]/40 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(0,242,254,0.2)] z-30"
        >
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={isTapped ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
            className="w-16 h-16 bg-[#00f2fe]/20 rounded-full flex items-center justify-center mb-4 relative"
          >
            <div className="absolute inset-0 rounded-full bg-[#00f2fe]/30 animate-ping" style={{ animationDuration: '2s' }} />
            <CheckCircle2 className="w-8 h-8 text-[#00f2fe]" />
          </motion.div>
          
          <h3 className="text-xl font-bold text-white mb-1 tracking-tight">Başarılı!</h3>
          <p className="text-xs text-zinc-400 text-center px-4">
            1 Yıldız kazandınız.
          </p>
          
          <div className="mt-6 flex gap-1.5">
            {[1,2,3,4,5].map((i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0, y: 10 }}
                animate={isTapped ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0, y: 10 }}
                transition={{ delay: 0.2 + (i * 0.08), type: "spring" }}
                className={`w-6 h-6 rounded-full ${i === 1 ? 'bg-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.6)]' : 'bg-white/10'}`} 
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

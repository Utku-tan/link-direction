'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { useGLTF, Center, Environment } from '@react-three/drei'
import * as THREE from 'three'

function DamgaModel() {
  const { scene } = useGLTF('/damga.glb')
  
  // Sadece gölge ayarlarını yapıyoruz, orijinal materyalleri (kullanıcının GLB'sindeki) bozmuyoruz.
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  return (
    <Center>
      {/* Modelin orijinal boyutu çok büyük olduğu için scale={0.1} yapıyoruz */}
      <primitive object={scene} rotation={[0.2, -Math.PI / 2, 0.2]} scale={0.1} />
    </Center>
  )
}

useGLTF.preload('/damga.glb')

export function StampAnimation() {
  const { scrollYProgress } = useScroll()

  // 1. AŞAMA (0% - 20%): Masaya Düşüş ve Yuvarlanma
  // 2. AŞAMA (20% - 50%): Telefona Yaklaşma ve Baskı
  // 3. AŞAMA (50% - 100%): Uçarak Sona Gidiş

  const x = useTransform(scrollYProgress, 
    [0, 0.2, 0.45, 0.5, 0.7, 1], 
    ['25vw', '25vw', '0vw', '0vw', '-30vw', '-40vw']
  )

  // Y Ekseninde vurma (BAM!) efekti: 
  // -15vh'de bekler, -20vh'ye gerilip 0vh'ye (telefona) şiddetle çarpar
  const y = useTransform(scrollYProgress, 
    [0, 0.2, 0.45, 0.48, 0.5, 0.7, 1], 
    ['10vh', '10vh', '-15vh', '-20vh', '0vh', '20vh', '40vh']
  )

  // Telefona yaklaşırken büyür, vururken iyice büyür ve sonra küçülerek uzaklaşır
  const scale = useTransform(scrollYProgress, 
    [0, 0.2, 0.45, 0.48, 0.5, 0.8, 1], 
    [1, 1, 1.8, 1.9, 1.8, 0.8, 0.5]
  )

  // Framer Motion CSS 3D Perspektif Transformları
  const rotateX = useTransform(scrollYProgress, 
    [0, 0.2, 0.45, 0.5, 1], 
    [0, 0, 30, 0, -30]
  )
  const rotateY = useTransform(scrollYProgress, 
    [0, 0.2, 0.45, 0.5, 1], 
    [0, 0, -20, 0, 180]
  )
  const rotateZ = useTransform(scrollYProgress, 
    [0, 0.2, 0.45, 0.48, 0.5, 1], 
    [0, 0, 0, -10, 0, -45] // Vururken çok hafif geri çekilme (-10)
  )

  // Masadaki gölge sadece ilk %20'lik kısımda görünsün
  const shadowOpacity = useTransform(scrollYProgress, [0, 0.15, 0.25], [1, 0.8, 0])

  // Uçarken bırakacağı Neon İz
  const trailOpacity = useTransform(scrollYProgress, [0.4, 0.6, 1], [0, 1, 0])
  const trailScale = useTransform(scrollYProgress, [0.5, 1], [1, 3])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {/* Dış Wrapper: Tamamen scrollYProgress'e bağlı CSS Transformları işler */}
      <motion.div
        style={{
          x,
          y,
          scale,
          rotateX,
          rotateY,
          rotateZ,
          perspective: 1000,
        }}
        className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] flex items-center justify-center transform-gpu"
      >
        {/* İç Wrapper: Yalnızca sayfa ilk yüklendiğinde "masaya düşme" zamanlı animasyonunu işler */}
        <motion.div
          initial={{ y: '-100vh', rotateZ: -45, rotateY: 90 }}
          animate={{ 
            y: 0, 
            rotateZ: [-15, 10, -5, 0], 
            rotateY: 0 
          }}
          transition={{
            y: { type: "spring", stiffness: 80, damping: 10, mass: 1.2 }, 
            rotateZ: { duration: 1.5, ease: "easeOut", times: [0, 0.4, 0.6, 1] },
            rotateY: { duration: 1.2, ease: "easeOut" }
          }}
          className="w-full h-full relative flex items-center justify-center transform-gpu"
        >
          {/* Gerçekçi Zemin Gölgesi (CSS Tabanlı) */}
          <motion.div 
            style={{ opacity: shadowOpacity }}
            className="absolute -bottom-10 w-[180px] h-[30px] bg-black/40 blur-[20px] rounded-[100%] transform-gpu"
          />

          {/* Sadece modeli render eden saf Three.js Canvas */}
          <Canvas 
            camera={{ position: [0, 0, 10], fov: 50 }}
            gl={{ alpha: true, antialias: true }}
            className="w-full h-full"
          >
            <ambientLight intensity={0.6} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={2} color="#00f2fe" />
            <Environment preset="city" />
            <DamgaModel />
          </Canvas>

          {/* Süzülürken arkasında bıraktığı Neon İz Efekti */}
          <motion.div 
            style={{ 
              opacity: trailOpacity,
              scaleX: trailScale
            }}
            className="absolute top-1/2 right-full w-[200px] h-[4px] bg-gradient-to-r from-transparent to-[#00f2fe] blur-[4px] transform -translate-y-1/2 origin-right"
          />
        </motion.div>
      </motion.div>
    </div>
  )
}

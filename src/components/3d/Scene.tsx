'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows, OrbitControls, Float } from '@react-three/drei'
import { NfcStamp } from './NfcStamp'

export function Scene() {
  return (
    <div className="w-full h-[700px] lg:h-[900px] relative z-10 cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
        {/* Ortam Işıkları */}
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        {/* Neon Mavi Vurgu Işığı (#00f2fe) */}
        <pointLight position={[-10, -10, -10]} intensity={2} color="#00f2fe" />
        <pointLight position={[10, -10, 10]} intensity={1} color="#4facfe" />
        
        {/* Model */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <NfcStamp />
        </Float>
        
        {/* Çevresel Yansıma (Metalik ve cam yüzeyler için önemli) */}
        <Environment preset="city" />
        
        {/* Alt Gölge */}
        <ContactShadows position={[0, -2.5, 0]} opacity={0.6} scale={15} blur={2} far={4} color="#00f2fe" />
        
        {/* Kontroller (Kullanıcı fareyle döndürebilsin diye) */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 2 + 0.2} // Sadece üstten ve biraz alttan bakılmasına izin ver
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  )
}

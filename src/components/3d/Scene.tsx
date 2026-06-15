'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, ScrollControls, Scroll } from '@react-three/drei'
import { NfcStamp } from './NfcStamp'

export function Scene({ children }: { children?: React.ReactNode }) {
  return (
    <div className="fixed inset-0 w-full h-full z-0">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        {/* Ortam Işıkları */}
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={2} color="#00f2fe" />
        
        <ScrollControls pages={3} damping={0.25}>
          {/* 3D Obje: Damga */}
          <NfcStamp />
          
          {/* HTML İçerikler */}
          {children && (
            <Scroll html style={{ width: '100%', height: '100%' }}>
              {children}
            </Scroll>
          )}
        </ScrollControls>
        
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}

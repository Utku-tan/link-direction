'use client'

import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { NfcStamp } from './NfcStamp'

export function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={2} color="#00f2fe" />
      
      <NfcStamp />
      
      <Environment preset="city" />
    </Canvas>
  )
}

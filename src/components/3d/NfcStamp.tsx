'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export function NfcStamp() {
  const group = useRef<THREE.Group>(null)
  
  // Modelleri yüklüyoruz.
  const { scene: sapiScene } = useGLTF('/damga_sapi.glb')
  const { scene: ucuScene } = useGLTF('/damga_ucu.glb')

  // Mouse hareketine göre hafif salınım (float) ve dönüş
  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.getElapsedTime()
    // Hafif yukarı aşağı hareket
    group.current.position.y = Math.sin(t / 1.5) / 10
    
    // Mouse pozisyonuna göre rotasyon (hafifçe fareyi takip etme)
    const targetX = (state.mouse.x * Math.PI) / 8
    const targetY = (state.mouse.y * Math.PI) / 8
    
    group.current.rotation.y += 0.05 * (targetX - group.current.rotation.y)
    group.current.rotation.x += 0.05 * (-targetY - group.current.rotation.x)
  })

  // Sitenin konseptine uygun olarak neon/metalik dokunuşlar yapmak için 
  // traverse edip materyalleri özelleştirebiliriz (opsiyonel).
  sapiScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Modelin kendi kaplamaları kalabilir, şimdilik sadece gölge atamasını yapalım
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  ucuScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  return (
    <group ref={group} dispose={null} scale={0.25}>
      {/* Sahneleri doğrudan ekliyoruz */}
      <primitive object={sapiScene} />
      <primitive object={ucuScene} />
    </group>
  )
}

// Performans için modelleri önden yükleyelim (preload)
useGLTF.preload('/damga_sapi.glb')
useGLTF.preload('/damga_ucu.glb')

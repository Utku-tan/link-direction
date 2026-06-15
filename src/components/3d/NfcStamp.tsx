'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Center } from '@react-three/drei'
import { useScroll, useSpring } from 'framer-motion'
import * as THREE from 'three'

export function NfcStamp() {
  const group = useRef<THREE.Group>(null)
  const { scene: damgaScene } = useGLTF('/damga.glb')
  
  // Native window scroll kontrolü (framer-motion)
  const { scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100 })

  useFrame((state) => {
    if (!group.current) return
    const offset = smoothProgress.get()
    const t = state.clock.getElapsedTime()
    
    // Yüzerlik (floating) sadece belirli aralıklarda
    const floatY = Math.sin(t * 3) * 0.1

    if (offset < 0.4) {
      // 1. AŞAMA (0.0 - 0.4): Yaklaşma ve Havaya Kalkma
      const progress = offset / 0.4
      // Sağdan merkeze, telefona yukarıdan yaklaşma (Y: 6 yüksek)
      group.current.position.x = THREE.MathUtils.lerp(6, 0, progress)
      group.current.position.y = THREE.MathUtils.lerp(0, 6, progress) + floatY
      group.current.position.z = THREE.MathUtils.lerp(0, 3, progress)

      // Rotasyon: Sapı doğrudan ekrana bakacak şekilde tam dik (90 derece) dönüş
      group.current.rotation.x = THREE.MathUtils.lerp(0.5, Math.PI / 2, progress)
      group.current.rotation.y = THREE.MathUtils.lerp(-0.5, 0, progress)
      group.current.rotation.z = THREE.MathUtils.lerp(0.2, 0, progress)

    } else if (offset >= 0.4 && offset < 0.5) {
      // 2. AŞAMA (0.4 - 0.5): BAM! Ekrana Sert Vurma
      const progress = (offset - 0.4) / 0.1
      
      group.current.position.x = 0
      // Hızla aşağı inip telefona tam yapışma (Y: 0, Z: 0.5 -> 0'a daha yakın)
      group.current.position.y = THREE.MathUtils.lerp(6, -0.5, progress)
      group.current.position.z = THREE.MathUtils.lerp(3, 0.5, progress)
      
      // Tam dik açı korunuyor
      group.current.rotation.x = Math.PI / 2
      group.current.rotation.y = 0
      group.current.rotation.z = 0

    } else {
      // 3. AŞAMA (0.5 - 1.0): Ayrılma ve Fiyat Kartına Dönerek İnme
      const progress = (offset - 0.5) * 2

      group.current.position.x = THREE.MathUtils.lerp(0, -6, progress)
      group.current.position.y = THREE.MathUtils.lerp(-0.5, -1, progress) + floatY
      group.current.position.z = THREE.MathUtils.lerp(0.5, 0, progress)

      // Vurma açısından -> Normal duruşa geri dönüp takla atma (spin)
      group.current.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0.2, progress)
      group.current.rotation.y = THREE.MathUtils.lerp(0, Math.PI * 2, progress)
      group.current.rotation.z = THREE.MathUtils.lerp(0, -0.2, progress)
    }
  })

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#0f172a',
    emissive: '#00f2fe',
    emissiveIntensity: 0.1,
    metalness: 0.5,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    thickness: 2.0,
    transparent: true,
    opacity: 1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  })

  damgaScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = glassMaterial
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  return (
    <group ref={group} dispose={null} scale={0.1}>
      <Center>
        <primitive object={damgaScene} />
      </Center>
    </group>
  )
}

useGLTF.preload('/damga.glb')

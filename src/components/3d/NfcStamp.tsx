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

    if (offset < 0.25) {
      // 1. AŞAMA (0.0 - 0.25): Hero Bölümü. Damga yukarıda bekler.
      group.current.position.set(6, 6, 3)
      group.current.rotation.set(0.5, -Math.PI / 2, 0.2)
      
    } else if (offset >= 0.25 && offset < 0.48) {
      // 2. AŞAMA (0.25 - 0.48): Telefona Yaklaşma
      const progress = (offset - 0.25) / 0.23
      
      group.current.position.x = THREE.MathUtils.lerp(6, 0, progress)
      group.current.position.y = THREE.MathUtils.lerp(6, 4, progress) + floatY
      group.current.position.z = THREE.MathUtils.lerp(3, 2, progress)

      // Sapı yukarıda, düz basmaya hazırlanıyor
      group.current.rotation.x = THREE.MathUtils.lerp(0.5, -Math.PI / 2, progress)
      group.current.rotation.y = THREE.MathUtils.lerp(-0.5, 0, progress)
      group.current.rotation.z = THREE.MathUtils.lerp(0.2, 0, progress)

    } else if (offset >= 0.48 && offset < 0.50) {
      // 3. AŞAMA (0.48 - 0.50): BAM! Vurma
      const progress = (offset - 0.48) / 0.02
      
      group.current.position.x = 0
      // Telefon z-20 DOM'da tam ortada. 3D'de Y: 0 tam orta demek.
      // Ekrana yapışması için Y: 0.1, Z: 0.5
      group.current.position.y = THREE.MathUtils.lerp(4, 0.1, progress)
      group.current.position.z = THREE.MathUtils.lerp(2, 0.5, progress)
      
      group.current.rotation.set(-Math.PI / 2, 0, 0)

    } else if (offset >= 0.50 && offset < 0.65) {
      // 4. AŞAMA (0.50 - 0.65): Telefonla Beraber Sabit Kalma (Sticky Scroll)
      // Kullanıcı sayfayı kaydırıyor ama telefon sticky olduğu için sabit.
      // Damga da telefonun üstünde tam bu pozisyonda basılı bekleyecek!
      group.current.position.set(0, 0.1, 0.5)
      group.current.rotation.set(-Math.PI / 2, 0, 0)

    } else if (offset >= 0.65 && offset < 0.80) {
      // 5. AŞAMA (0.65 - 0.80): Ekranda Ayrılma ve Takla Atarak Sola Kayma
      const progress = (offset - 0.65) / 0.15

      group.current.position.x = THREE.MathUtils.lerp(0, -6, progress)
      group.current.position.y = THREE.MathUtils.lerp(0.1, -1, progress) + floatY
      group.current.position.z = THREE.MathUtils.lerp(0.5, 0, progress)

      group.current.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, 0.2, progress)
      group.current.rotation.y = THREE.MathUtils.lerp(0, Math.PI * 2, progress)
      group.current.rotation.z = THREE.MathUtils.lerp(0, -0.2, progress)
      
    } else {
      // 6. AŞAMA (0.80 - 1.0): Fiyatlandırma Bölümü (Solda Sabit)
      group.current.position.set(-6, -1 + floatY, 0)
      group.current.rotation.set(0.2, Math.PI * 2, -0.2)
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

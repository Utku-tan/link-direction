'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Center } from '@react-three/drei'
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

  // Premium Cam (Glassmorphism) Materyali
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#0f172a',     // Koyu lacivert/siyah ton
    emissive: '#00f2fe',  // Hafif neon mavi parlaması
    emissiveIntensity: 0.1,
    metalness: 0.5,
    roughness: 0.1,
    transmission: 0.95,   // Cam şeffaflığı (Işığı geçirgenlik)
    ior: 1.5,             // Kırılma indisi (Cam için 1.5 ideal)
    thickness: 2.0,       // Hacimsel kalınlık
    transparent: true,
    opacity: 1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  })

  // Daha parlak ve belirgin bir cam (Belki uç kısım için)
  const neonGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#00f2fe',     // Neon mavi
    metalness: 0.2,
    roughness: 0.05,
    transmission: 0.8,
    ior: 1.5,
    thickness: 1.0,
    transparent: true,
    opacity: 0.9,
  })

  // Materyalleri Uygulama
  sapiScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = glassMaterial
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  ucuScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = neonGlassMaterial
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  return (
    <group ref={group} dispose={null} scale={0.1}>
      {/* Modeli merkeze almak için Center kullanıyoruz. Böylece kenarlara çarpması engellenir. */}
      <Center>
        <group rotation={[Math.PI, 0, 0]}>
          <primitive object={sapiScene} />
          <primitive object={ucuScene} />
        </group>
      </Center>
    </group>
  )
}

// Performans için modelleri önden yükleyelim (preload)
useGLTF.preload('/damga_sapi.glb')
useGLTF.preload('/damga_ucu.glb')

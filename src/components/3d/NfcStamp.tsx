'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Center, useScroll } from '@react-three/drei'
import * as THREE from 'three'

export function NfcStamp() {
  const group = useRef<THREE.Group>(null)
  
  // Tek bir modeli yüklüyoruz.
  const { scene: damgaScene } = useGLTF('/damga.glb')
  
  // Scroll kontrolcüsünü alıyoruz
  const scroll = useScroll()

  // Mouse hareketine göre hafif salınım (float) ve scroll tabanlı hikayeleştirme
  useFrame((state) => {
    if (!group.current) return
    const offset = scroll.offset
    const t = state.clock.getElapsedTime()
    
    // Sürekli devam eden hafif yüzerlik efekti
    const floatY = Math.sin(t * 2) * 0.15

    if (offset < 0.5) {
      // 1. Kısım: Hero'dan (0) -> Telefona Dokunma (0.5)
      // offset 0'dan 0.5'e giderken, progress 0'dan 1'e gider
      const progress = offset * 2 
      
      // Pozisyon: Sağdan (X:6) -> Merkeze/Telefona (X:0) ve Ekrana Yaklaşma (Z:4)
      group.current.position.x = THREE.MathUtils.lerp(6, 0, progress)
      group.current.position.y = THREE.MathUtils.lerp(0, 1.5, progress) + floatY
      group.current.position.z = THREE.MathUtils.lerp(0, 4, progress) 

      // Rotasyon: Çapraz havalı duruştan -> Telefone paralel dokunma açısına
      group.current.rotation.x = THREE.MathUtils.lerp(0.5, Math.PI / 2.5, progress)
      group.current.rotation.y = THREE.MathUtils.lerp(-0.5, 0, progress)
      group.current.rotation.z = THREE.MathUtils.lerp(0.2, 0, progress)
      
    } else {
      // 2. Kısım: Telefondan (0.5) -> Fiyatlandırma Kartına (1.0)
      // offset 0.5'ten 1.0'a giderken, progress 0'dan 1'e gider
      const progress = (offset - 0.5) * 2

      // Pozisyon: Merkezden (X:0) -> Sola (X:-5)
      group.current.position.x = THREE.MathUtils.lerp(0, -5, progress)
      group.current.position.y = THREE.MathUtils.lerp(1.5, -1, progress) + floatY
      group.current.position.z = THREE.MathUtils.lerp(4, 0, progress)

      // Rotasyon: Dokunma açısından -> Etkileyici bir dönüşle (Spin) fiyat kartı yanına
      group.current.rotation.x = THREE.MathUtils.lerp(Math.PI / 2.5, 0.2, progress)
      group.current.rotation.y = THREE.MathUtils.lerp(0, Math.PI * 2.5, progress) // 1.25 tur dönüyor
      group.current.rotation.z = THREE.MathUtils.lerp(0, -0.2, progress)
    }
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

  // Materyalleri Uygulama (Tüm modele cam dokusu veriliyor)
  damgaScene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = glassMaterial
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  return (
    // Model scale'ini 0.1'den 0.15'e çıkaralım ki sahnede daha heybetli dursun
    <group ref={group} dispose={null} scale={0.15}>
      <Center>
        <primitive object={damgaScene} />
      </Center>
    </group>
  )
}

// Performans için modeli önden yükleyelim (preload)
useGLTF.preload('/damga.glb')

'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Center, ContactShadows } from '@react-three/drei'
import { useScroll, useSpring } from 'framer-motion'
import * as THREE from 'three'

export function NfcStamp() {
  const group = useRef<THREE.Group>(null)
  const shadowRef = useRef<THREE.Group>(null)
  const { scene: damgaScene } = useGLTF('/damga.glb')
  
  const { scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100 })

  useFrame((state) => {
    if (!group.current) return
    const offset = smoothProgress.get()
    const t = state.clock.getElapsedTime()
    
    const floatY = Math.sin(t * 3) * 0.1

    // 1. INTRO ANİMASYONU: Masaya düşme ve yuvarlanma efekti
    const offsetFade = 1 - Math.min(1, offset / 0.05)
    let introY = 0
    let introRotZ = 0
    let introRotX = 0

    if (t < 1.5 && offsetFade > 0) {
      const p = t / 1.5
      const dropHeight = Math.pow(1 - p, 2) * 8
      const bounce = Math.abs(Math.sin(p * Math.PI * 3)) * (1 - p) * 3
      introY = (dropHeight + bounce) * offsetFade
      introRotZ = (1 - p) * Math.PI * 2 * offsetFade
      introRotX = (1 - p) * Math.PI * offsetFade
    }

    if (offset < 0.25) {
      const progress = offset / 0.25
      group.current.position.x = THREE.MathUtils.lerp(5, 4, progress)
      group.current.position.y = THREE.MathUtils.lerp(-2.5, 4, progress) + floatY + introY
      group.current.position.z = THREE.MathUtils.lerp(1, 2, progress)

      group.current.rotation.x = THREE.MathUtils.lerp(-Math.PI / 3, -Math.PI / 2, progress) + introRotX
      group.current.rotation.y = THREE.MathUtils.lerp(Math.PI / 4, 0, progress)
      group.current.rotation.z = THREE.MathUtils.lerp(0.2, 0, progress) + introRotZ

    } else if (offset >= 0.25 && offset < 0.45) {
      const progress = (offset - 0.25) / 0.20
      group.current.position.x = THREE.MathUtils.lerp(4, 0, progress)
      group.current.position.y = 4 + floatY
      group.current.position.z = 2
      group.current.rotation.set(-Math.PI / 2, 0, 0)

    } else if (offset >= 0.45 && offset < 0.48) {
      const progress = (offset - 0.45) / 0.03
      group.current.position.x = 0
      group.current.position.y = THREE.MathUtils.lerp(4, 3.5, progress) + floatY
      group.current.position.z = 2
      group.current.rotation.set(-Math.PI / 2, 0, 0)

    } else if (offset >= 0.48 && offset < 0.50) {
      const progress = (offset - 0.48) / 0.02
      group.current.position.x = 0
      group.current.position.y = THREE.MathUtils.lerp(3.5, 0.1, progress)
      group.current.position.z = THREE.MathUtils.lerp(2, 0.5, progress)
      group.current.rotation.set(-Math.PI / 2, 0, 0)

    } else if (offset >= 0.50 && offset < 0.65) {
      group.current.position.set(0, 0.1, 0.5)
      group.current.rotation.set(-Math.PI / 2, 0, 0)

    } else if (offset >= 0.65 && offset < 0.80) {
      const progress = (offset - 0.65) / 0.15
      group.current.position.x = THREE.MathUtils.lerp(0, -6, progress)
      group.current.position.y = THREE.MathUtils.lerp(0.1, -1, progress) + floatY
      group.current.position.z = THREE.MathUtils.lerp(0.5, 0, progress)
      group.current.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, 0.2, progress)
      group.current.rotation.y = THREE.MathUtils.lerp(0, Math.PI * 2, progress)
      group.current.rotation.z = THREE.MathUtils.lerp(0, -0.2, progress)
      
    } else {
      group.current.position.set(-6, -1 + floatY, 0)
      group.current.rotation.set(0.2, Math.PI * 2, -0.2)
    }

    if (shadowRef.current) {
      const shadowOpacity = THREE.MathUtils.lerp(0.6, 0, Math.min(1, offset / 0.1))
      shadowRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          child.material.opacity = shadowOpacity
        }
      })
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
    <>
      <group ref={group} dispose={null} scale={0.1}>
        <Center>
          <primitive object={damgaScene} />
        </Center>
      </group>

      <ContactShadows 
        ref={shadowRef}
        position={[5, -2.5, 1]} 
        opacity={0.6} 
        scale={15} 
        blur={2} 
        far={5}
        color="#000000"
      />
    </>
  )
}

useGLTF.preload('/damga.glb')

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CMEParticle {
    position: THREE.Vector3
    velocity: THREE.Vector3
    life: number
    maxLife: number
    size: number
}

interface CMESystemProps {
    starPosition: THREE.Vector3
    starRadius: number
    active: boolean
    onComplete: () => void
}

export default function CMESystem({ starPosition, starRadius, active, onComplete }: CMESystemProps) {
    const particlesRef = useRef<THREE.Points>(null)
    const particlesDataRef = useRef<CMEParticle[]>([])
    const materialRef = useRef<THREE.PointsMaterial | null>(null)

    // Create particle geometry
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry()
        const positions = new Float32Array(500 * 3) // 500 particles
        const colors = new Float32Array(500 * 3)
        const sizes = new Float32Array(500)

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

        return geo
    }, [])

    // Create material
    const material = useMemo(() => {
        const mat = new THREE.PointsMaterial({
            size: 20,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })
        materialRef.current = mat
        return mat
    }, [])

    // Initialize CME when activated
    useEffect(() => {
        if (!active) return

        // Create burst of particles
        const particles: CMEParticle[] = []
        const particleCount = 500

        // Random direction for CME (hemisphere)
        const cmeDirection = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() * 0.5,
            Math.random() - 0.5
        ).normalize()

        for (let i = 0; i < particleCount; i++) {
            // Cone-shaped burst
            const spreadAngle = Math.PI / 6 // 30 degree cone
            const randomAngle = (Math.random() - 0.5) * spreadAngle

            const direction = cmeDirection.clone()
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), randomAngle)
                .applyAxisAngle(new THREE.Vector3(1, 0, 0), randomAngle)

            const speed = 50 + Math.random() * 100 // Variable speeds

            particles.push({
                position: starPosition.clone().add(direction.clone().multiplyScalar(starRadius * 1.2)),
                velocity: direction.multiplyScalar(speed),
                life: 0,
                maxLife: 2 + Math.random() * 3, // 2-5 seconds
                size: 15 + Math.random() * 25,
            })
        }

        particlesDataRef.current = particles

        // Complete after max lifetime
        setTimeout(() => {
            onComplete()
        }, 5000)
    }, [active, starPosition, starRadius, onComplete])

    useFrame((_state, delta) => {
        if (!active || particlesDataRef.current.length === 0) return

        const particles = particlesDataRef.current
        const positions = geometry.attributes.position.array as Float32Array
        const colors = geometry.attributes.color.array as Float32Array
        const sizes = geometry.attributes.size.array as Float32Array

        // Update particles
        let aliveCount = 0

        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i]
            particle.life += delta

            if (particle.life < particle.maxLife) {
                // Update position
                particle.position.add(particle.velocity.clone().multiplyScalar(delta))

                // Decelerate
                particle.velocity.multiplyScalar(0.98)

                // Update geometry
                positions[i * 3] = particle.position.x
                positions[i * 3 + 1] = particle.position.y
                positions[i * 3 + 2] = particle.position.z

                // Color: orange to red as it cools
                const lifeFraction = particle.life / particle.maxLife
                colors[i * 3] = 1.0
                colors[i * 3 + 1] = 0.6 - lifeFraction * 0.4
                colors[i * 3 + 2] = 0.2 - lifeFraction * 0.2

                // Fade out
                sizes[i] = particle.size * (1 - lifeFraction)

                aliveCount++
            } else {
                // Dead particle
                sizes[i] = 0
            }
        }

        geometry.attributes.position.needsUpdate = true
        geometry.attributes.color.needsUpdate = true
        geometry.attributes.size.needsUpdate = true

        // Update material opacity
        if (materialRef.current) {
            materialRef.current.opacity = Math.max(0.1, 0.8 * (1 - aliveCount / particles.length))
        }
    })

    if (!active) return null

    return (
        <points ref={particlesRef} geometry={geometry} material={material} />
    )
}

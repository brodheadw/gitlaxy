import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface WarpEffectProps {
    active: boolean
}

export default function WarpEffect({ active }: WarpEffectProps) {
    const count = 1000
    const mesh = useRef<THREE.InstancedMesh>(null)
    const dummy = useMemo(() => new THREE.Object3D(), [])

    // Generate random initial positions
    const particles = useMemo(() => {
        const temp = []
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100
            const factor = 20 + Math.random() * 100
            const speed = 0.01 + Math.random() / 200
            const x = (Math.random() - 0.5) * 2000 // Wide spread
            const y = (Math.random() - 0.5) * 2000
            const z = (Math.random() - 0.5) * 2000
            temp.push({ t, factor, speed, x, y, z, mx: 0, my: 0 })
        }
        return temp
    }, [])

    useFrame((state) => {
        if (!mesh.current) return

        // If not active, hide everything or fade out
        if (!active) {
            mesh.current.visible = false
            return
        }
        mesh.current.visible = true

        particles.forEach((particle, i) => {
            let { t, factor, speed, x, y, z } = particle

            // Move particles towards camera (assuming camera looks down -Z or similar)
            // Actually, for a warp effect, we usually want them streaming PAST the camera.
            // Let's move them along Z.

            z = z + speed * 500 // Move fast
            if (z > 1000) z = -2000 // Reset if behind camera

            particle.z = z

            // Update dummy object
            dummy.position.set(x, y, z)

            // Stretch based on speed to look like streaks
            const s = Math.max(1, speed * 50)
            dummy.scale.set(1, 1, s * 20)

            dummy.updateMatrix()
            mesh.current!.setMatrixAt(i, dummy.matrix)
        })
        mesh.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 10]} />
            <meshBasicMaterial color="#4ecdc4" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </instancedMesh>
    )
}

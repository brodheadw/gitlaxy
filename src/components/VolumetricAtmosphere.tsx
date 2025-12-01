import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import volumetricAtmosphereVertexShader from '../shaders/volumetricAtmosphere.vert.glsl?raw'
import volumetricAtmosphereFragmentShader from '../shaders/volumetricAtmosphere.frag.glsl?raw'

interface VolumetricAtmosphereProps {
    starPosition: THREE.Vector3
    starRadius: number
    starColor: THREE.Color
    atmosphereRadius: number
    density?: number
}

export default function VolumetricAtmosphere({
    starPosition,
    starRadius,
    starColor,
    atmosphereRadius,
    density = 1.0
}: VolumetricAtmosphereProps) {
    const meshRef = useRef<THREE.Mesh>(null)

    // Create volumetric material
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: volumetricAtmosphereVertexShader,
            fragmentShader: volumetricAtmosphereFragmentShader,
            uniforms: {
                uStarPosition: { value: starPosition },
                uStarRadius: { value: starRadius },
                uStarColor: { value: starColor },
                uTime: { value: 0 },
                uCameraPosition: { value: new THREE.Vector3() },
                uAtmosphereRadius: { value: atmosphereRadius },
                uDensity: { value: density },
            },
            transparent: true,
            side: THREE.BackSide, // Render from inside
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
    }, [starPosition, starRadius, starColor, atmosphereRadius, density])

    useFrame((state) => {
        if (!material.uniforms) return

        const time = state.clock.elapsedTime

        // Update time for animation
        material.uniforms.uTime.value = time

        // Update camera position for ray marching
        material.uniforms.uCameraPosition.value.copy(state.camera.position)
    })

    return (
        <mesh ref={meshRef} material={material}>
            {/* Large sphere encompassing atmosphere */}
            <sphereGeometry args={[atmosphereRadius, 32, 32]} />
        </mesh>
    )
}

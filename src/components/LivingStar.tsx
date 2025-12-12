import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import VolumetricAtmosphere from './VolumetricAtmosphere'
import CMESystem from './CMESystem'
import PlasmaProminence from './PlasmaProminence'

// Import shaders as raw strings
import starVertexShader from '../shaders/star.vert.glsl?raw'
import starFragmentShader from '../shaders/star.frag.glsl?raw'
import coronaFragmentShader from '../shaders/corona.frag.glsl?raw'

export default function LivingStar({ size = 1200, position = [0, 0, -3000] }: {
    size?: number
    position?: [number, number, number]
}) {
    const starRef = useRef<THREE.Mesh>(null)
    const _coronaRef = useRef<THREE.Mesh>(null)
    const lightRef = useRef<THREE.PointLight>(null)

    const [flareIntensity, setFlareIntensity] = useState(1.0)
    const [cmeActive, setCmeActive] = useState(false)
    const [prominenceCount] = useState(2 + Math.floor(Math.random() * 3)) // 2-4 prominences

    // Star colors (orange-yellow main sequence star)
    const starColor = new THREE.Color('#ff8833')
    const sunspotColor = new THREE.Color('#cc4411')
    const coronaColor = new THREE.Color('#ffaa55')

    // Star material with custom shaders
    const starMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: starVertexShader,
            fragmentShader: starFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uBoilIntensity: { value: size * 0.08 },
                uSunspotIntensity: { value: size * 0.05 },
                uStarColor: { value: starColor },
                uSunspotColor: { value: sunspotColor },
                uFlareIntensity: { value: 1.0 },
                uCoreTemperature: { value: 5800.0 },
                uCameraPosition: { value: new THREE.Vector3() },
            },
        })
    }, [size])

    // Corona material (volumetric atmosphere)
    const coronaMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: coronaFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uCoronaColor: { value: coronaColor },
            },
            transparent: true,
            side: THREE.BackSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
    }, [])

    // Random flare events + CMEs
    useEffect(() => {
        const flareInterval = setInterval(() => {
            // Random chance of flare (10% per interval)
            if (Math.random() < 0.1) {
                const flareDuration = 2000 + Math.random() * 3000 // 2-5 seconds
                const flareMax = 1.3 + Math.random() * 0.7 // 1.3-2.0x intensity

                // Flare up
                setFlareIntensity(flareMax)

                // 50% chance of CME with strong flares
                if (flareMax > 1.6 && Math.random() < 0.5) {
                    setCmeActive(true)
                }

                // Fade back down
                setTimeout(() => {
                    setFlareIntensity(1.0)
                }, flareDuration)
            }
        }, 5000) // Check every 5 seconds

        return () => clearInterval(flareInterval)
    }, [])

    useFrame((state) => {
        const time = state.clock.elapsedTime

        // Update shader uniforms
        if (starMaterial.uniforms) {
            starMaterial.uniforms.uTime.value = time
            starMaterial.uniforms.uFlareIntensity.value = flareIntensity

            // Phase 1: Update camera position for chromatic aberration
            starMaterial.uniforms.uCameraPosition.value.copy(state.camera.position)

            // Phase 7: Temperature pulsation with flares (MORE DYNAMIC)
            const baseTemp = 5800.0
            const tempVariation = Math.sin(time * 0.4) * 400 + Math.cos(time * 0.3) * 300 + (flareIntensity - 1.0) * 1500
            starMaterial.uniforms.uCoreTemperature.value = baseTemp + tempVariation
        }

        if (coronaMaterial.uniforms) {
            coronaMaterial.uniforms.uTime.value = time
        }

        // Slow rotation
        if (starRef.current) {
            starRef.current.rotation.y = time * 0.02
        }

        // Update light intensity with flares
        if (lightRef.current) {
            const baseIntensity = 4.0
            lightRef.current.intensity = baseIntensity * flareIntensity
        }
    })

    return (
        <group position={position}>
            {/* Main star sphere - 4K QUALITY with high segment count */}
            <mesh ref={starRef} material={starMaterial}>
                <sphereGeometry args={[size, 128, 128]} />
            </mesh>

            {/* SPRINT 2: Volumetric atmosphere with ray marching */}
            <VolumetricAtmosphere
                starPosition={new THREE.Vector3(...position)}
                starRadius={size}
                starColor={starColor}
                atmosphereRadius={size * 2.0}
                density={0.8}
            />

            {/* Fallback simple corona for distant viewing */}
            <mesh material={coronaMaterial}>
                <sphereGeometry args={[size * 1.15, 32, 32]} />
            </mesh>

            {/* Point light affecting the scene */}
            <pointLight
                ref={lightRef}
                color={starColor}
                intensity={4.0}
                distance={size * 8}
                decay={2}
            />

            {/* Additional ambient glow */}
            <pointLight
                color={coronaColor}
                intensity={1.5}
                distance={size * 6}
                decay={2}
            />

            {/* SPRINT 4: Plasma Prominences */}
            {Array.from({ length: prominenceCount }).map((_, i) => (
                <PlasmaProminence
                    key={i}
                    starPosition={new THREE.Vector3(...position)}
                    starRadius={size}
                    color={coronaColor}
                />
            ))}

            {/* SPRINT 4: Coronal Mass Ejection */}
            <CMESystem
                starPosition={new THREE.Vector3(...position)}
                starRadius={size}
                active={cmeActive}
                onComplete={() => setCmeActive(false)}
            />
        </group>
    )
}

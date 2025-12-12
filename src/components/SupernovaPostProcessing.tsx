import { useRef, useMemo } from 'react'
import { useFrame, extend, useThree } from '@react-three/fiber'
// @ts-expect-error - three.js postprocessing modules lack type declarations
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
// @ts-expect-error - three.js postprocessing modules lack type declarations
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
// @ts-expect-error - three.js postprocessing modules lack type declarations
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
// @ts-expect-error - three.js postprocessing modules lack type declarations
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import * as THREE from 'three'
import postProcessingFragmentShader from '../shaders/postProcessing.frag.glsl?raw'

// Extend for JSX usage
extend({ EffectComposer, RenderPass, ShaderPass, UnrealBloomPass })

interface SupernovaPostProcessingProps {
    starPosition: THREE.Vector3
    starBrightness: number
}

export default function SupernovaPostProcessing({ starPosition, starBrightness }: SupernovaPostProcessingProps) {
    const composerRef = useRef<EffectComposer>(null)
    const { gl, scene, camera, size } = useThree()

    // Custom post-processing shader
    const customPass = useMemo(() => {
        const shader = {
            uniforms: {
                tDiffuse: { value: null },
                tDepth: { value: null },
                uResolution: { value: new THREE.Vector2(size.width, size.height) },
                uTime: { value: 0 },
                uStarScreenPosition: { value: new THREE.Vector3() },
                uStarBrightness: { value: 1.0 },
                uExposure: { value: 1.0 },
            },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: postProcessingFragmentShader,
        }

        return new ShaderPass(shader)
    }, [size])

    // Setup composer
    const composer = useMemo(() => {
        const comp = new EffectComposer(gl)
        comp.setSize(size.width, size.height)

        // Render pass
        const renderPass = new RenderPass(scene, camera)
        comp.addPass(renderPass)

        // Bloom pass (Phase 10)
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(size.width, size.height),
            1.2, // strength
            0.6, // radius
            0.85 // threshold
        )
        comp.addPass(bloomPass)

        // Custom pass (lens flare, aberration, etc)
        comp.addPass(customPass)

        return comp
    }, [gl, scene, camera, size, customPass])

    useFrame((state) => {
        if (!composer) return

        const time = state.clock.elapsedTime

        // Project star 3D position to screen space
        const starScreenPos = starPosition.clone().project(state.camera)

        // Convert from clip space (-1 to 1) to UV space (0 to 1)
        const screenX = (starScreenPos.x + 1) / 2
        const screenY = (starScreenPos.y + 1) / 2

        // Update custom pass uniforms
        if (customPass.uniforms) {
            customPass.uniforms.uTime.value = time
            customPass.uniforms.uStarScreenPosition.value.set(screenX, screenY, starScreenPos.z)
            customPass.uniforms.uStarBrightness.value = starBrightness
            customPass.uniforms.uResolution.value.set(size.width, size.height)

            // Auto-exposure based on star brightness
            const targetExposure = 1.0 / (1.0 + starBrightness * 0.3)
            customPass.uniforms.uExposure.value += (targetExposure - customPass.uniforms.uExposure.value) * 0.05
        }

        // Render with post-processing
        composer.render()
    }, 1) // Priority 1 to render after scene

    return null // This component doesn't render anything directly
}

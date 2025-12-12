import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ProminenceProps {
    starPosition: THREE.Vector3
    starRadius: number
    color: THREE.Color
}

export default function PlasmaProminence({ starPosition, starRadius, color }: ProminenceProps) {
    const lineRef = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>>(null)

    // Create bezier curve for arc
    const curve = useMemo(() => {
        // Random emergence point on star surface
        const angle1 = Math.random() * Math.PI * 2
        const angle2 = Math.random() * Math.PI

        const startPoint = new THREE.Vector3(
            Math.cos(angle1) * Math.sin(angle2),
            Math.cos(angle2),
            Math.sin(angle1) * Math.sin(angle2)
        ).multiplyScalar(starRadius).add(starPosition)

        // Random arc endpoint (nearby on surface)
        const endAngle1 = angle1 + (Math.random() - 0.5) * Math.PI / 2
        const endAngle2 = angle2 + (Math.random() - 0.5) * Math.PI / 3

        const endPoint = new THREE.Vector3(
            Math.cos(endAngle1) * Math.sin(endAngle2),
            Math.cos(endAngle2),
            Math.sin(endAngle1) * Math.sin(endAngle2)
        ).multiplyScalar(starRadius).add(starPosition)

        // Arc height (magnetic loop)
        const arcHeight = starRadius * (0.3 + Math.random() * 0.4)
        const midPoint = startPoint.clone().add(endPoint).multiplyScalar(0.5)
        const normal = midPoint.clone().sub(starPosition).normalize()
        midPoint.add(normal.multiplyScalar(arcHeight))

        // Create quadratic bezier curve
        return new THREE.QuadraticBezierCurve3(startPoint, midPoint, endPoint)
    }, [starPosition, starRadius])

    // Create geometry from curve
    const geometry = useMemo(() => {
        const points = curve.getPoints(50)
        const geo = new THREE.BufferGeometry().setFromPoints(points)

        // Add colors for gradient
        const colors = new Float32Array(points.length * 3)
        for (let i = 0; i < points.length; i++) {
            const t = i / (points.length - 1)
            // Brighter at base, dimmer at top
            const brightness = 1.0 - t * 0.5
            colors[i * 3] = color.r * brightness
            colors[i * 3 + 1] = color.g * brightness
            colors[i * 3 + 2] = color.b * brightness
        }
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        return geo
    }, [curve, color])

    // Create material
    const material = useMemo(() => {
        return new THREE.LineBasicMaterial({
            vertexColors: true,
            linewidth: 3,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
        })
    }, [])

    // Create the Line object
    const lineObject = useMemo(() => {
        return new THREE.Line(geometry, material)
    }, [geometry, material])

    // Animate prominence (pulsate, flow)
    useFrame((state) => {
        const time = state.clock.elapsedTime

        // Pulsate opacity
        const pulsate = Math.sin(time * 2) * 0.15 + 0.7
        material.opacity = pulsate
    })

    return <primitive ref={lineRef} object={lineObject} />
}

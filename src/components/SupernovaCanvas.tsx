import { useRef, useEffect } from 'react'
import { renderCorePlasma } from './supernova/phases/phase01_core_plasma'
import { renderShockWaves } from './supernova/phases/phase02_shock_waves'
import { renderElementEmission } from './supernova/phases/phase03_element_emission'

interface SupernovaCanvasProps {
    width?: number
    height?: number
    quality?: 'draft' | 'normal' | 'high' | 'ultra'
    animate?: boolean
}

export default function SupernovaCanvas({
    width = window.innerWidth,
    height = window.innerHeight,
}: SupernovaCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Render ONCE on mount - static beautiful supernova
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // Medium resolution for quality
        const scale = 0.7;
        const w = Math.floor(width * scale);
        const h = Math.floor(height * scale);

        canvas.width = w;
        canvas.height = h;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.45;

        // Clear background
        ctx.fillStyle = '#000005';
        ctx.fillRect(0, 0, w, h);

        // Render all 3 photorealistic phases ONCE (time = 0 for static)
        renderCorePlasma(ctx, cx, cy, radius, 0, scale);
        renderShockWaves(ctx, cx, cy, radius, 0, scale);
        renderElementEmission(ctx, cx, cy, radius, 0, scale);

    }, [width, height]); // Only re-render if size changes

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                imageRendering: 'auto'
            }}
        />
    );
}

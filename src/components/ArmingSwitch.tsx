import { useState, useRef, useEffect } from 'react'
import './ArmingSwitch.css'

interface ArmingSwitchProps {
    onArmed: () => void
    label?: string
}

export default function ArmingSwitch({ onArmed, label = 'Initialize System' }: ArmingSwitchProps) {
    const [isCharging, setIsCharging] = useState(false)
    const [chargeProgress, setChargeProgress] = useState(0)
    const [isArmed, setIsArmed] = useState(false)

    const holdTimerRef = useRef<number | null>(null)
    const chargeIntervalRef = useRef<number | null>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    const CHARGE_DURATION = 2000 // 2 seconds to full charge
    const CHARGE_INTERVAL = 16 // 60fps

    const handleMouseDown = () => {
        setIsCharging(true)
        setChargeProgress(0)

        const startTime = Date.now()

        // Charge animation with acceleration
        chargeIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime
            const rawProgress = elapsed / CHARGE_DURATION

            // Ease-in-quad for acceleration effect
            const acceleratedProgress = rawProgress * rawProgress
            const clampedProgress = Math.min(acceleratedProgress * 100, 100)

            setChargeProgress(clampedProgress)

            if (clampedProgress >= 100) {
                // Charge complete - trigger armed state
                if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current)
                setIsArmed(true)

                // Brief delay for bloom effect
                setTimeout(() => {
                    onArmed()
                }, 200)
            }
        }, CHARGE_INTERVAL)
    }

    const handleMouseUp = () => {
        setIsCharging(false)
        setChargeProgress(0)

        if (chargeIntervalRef.current) {
            clearInterval(chargeIntervalRef.current)
            chargeIntervalRef.current = null
        }

        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current)
            holdTimerRef.current = null
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current)
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
        }
    }, [])

    // Calculate shake intensity (violent at 90%+)
    const shouldShake = chargeProgress >= 90
    const shakeIntensity = shouldShake ? ((chargeProgress - 90) / 10) : 0

    return (
        <button
            ref={buttonRef}
            className={`arming-switch ${isCharging ? 'charging' : ''} ${shouldShake ? 'shaking' : ''} ${isArmed ? 'armed' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            style={{
                '--shake-intensity': shakeIntensity,
                '--charge-progress': chargeProgress,
            } as React.CSSProperties}
        >
            {/* Background pulse (breathing) */}
            <div className="pulse-bg"></div>

            {/* Charge ring */}
            <svg className="charge-ring" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className="charge-ring-bg"
                />
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className="charge-ring-progress"
                    style={{
                        strokeDashoffset: `${283 - (283 * chargeProgress) / 100}`
                    }}
                />
            </svg>

            {/* Button text */}
            <span className="button-text">{label}</span>

            {/* Bloom effect overlay */}
            {isArmed && <div className="bloom-effect"></div>}
        </button>
    )
}

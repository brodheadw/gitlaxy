export default function LoadingScreen() {
    // Loading state is managed by the store's startApp/startAppWithFolder functions

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: '#0b0b1a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                color: '#fff',
                fontFamily: "'JetBrains Mono', monospace",
            }}
        >
            <div
                style={{
                    width: '50px',
                    height: '50px',
                    border: '3px solid rgba(78, 205, 196, 0.2)',
                    borderTopColor: '#4ecdc4',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '1rem',
                }}
            />
            <div style={{ color: '#4ecdc4', fontSize: '1.2rem', letterSpacing: '2px' }}>
                INITIALIZING WARP DRIVE...
            </div>
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    )
}

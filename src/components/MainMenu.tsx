import { useStore } from '../store'
import ArmingSwitch from './ArmingSwitch'
import SupernovaCanvas from './SupernovaCanvas'
import './MainMenu.css'

export default function MainMenu() {
    const startApp = useStore((state) => state.startApp)

    const stats = {
        files: 142,
        commits: 53,
        branches: 3
    }

    return (
        <div className="main-menu-container">
            {/* Photorealistic Static Supernova */}
            <SupernovaCanvas
                width={window.innerWidth}
                height={window.innerHeight}
            />

            {/* UI Overlay */}
            <div className="ui-overlay">
                {/* Main Card */}
                <div className="menu-card">
                    <div className="title-container">
                        <h1 className="main-title">GITLAXY</h1>
                        <div className="subtitle">Orbital Code Visualization</div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-value">{stats.files}</span>
                            <span className="stat-label">Files Detected</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{stats.commits}</span>
                            <span className="stat-label">Commits Logged</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{stats.branches}</span>
                            <span className="stat-label">Active Branches</span>
                        </div>
                    </div>

                    <ArmingSwitch onArmed={startApp} label="Initialize System" />
                </div>

                {/* Footer */}
                <div className="footer">
                    <span className="version">v0.1.0-alpha</span>
                    <span style={{ margin: '0 1rem' }}>|</span>
                    <span>System Ready</span>
                </div>
            </div>
        </div>
    )
}

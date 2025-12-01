import { useStore, useLandingState, useNearestPlanet } from '../store'
import type { ShipType } from '../store'
import { SHIP_INFO } from './Spaceship'
import './HUD.css'

const SHIP_TYPES: ShipType[] = ['falcon', 'viper', 'hauler', 'explorer', 'custom']

export default function HUD() {
  const {
    repoInfo,
    viewMode,
    cameraMode,
    selectedNode,
    setViewMode,
    setCameraMode,
    commits,
    historyIndex,
    isPlaying,
    setHistoryIndex,
    togglePlayback,
    nextCommit,
    prevCommit,
    viewLevel,
    currentSystem,
    exitSystem,
    selectedShip,
    setSelectedShip,
    flightState,
    showSettings,
    setShowSettings,
  } = useStore()

  const landingState = useLandingState()
  const nearestPlanet = useNearestPlanet()

  const currentCommit = commits[historyIndex]

  return (
    <div className="hud">
      {/* Top bar - repo info */}
      <div className="hud-top">
        <div className="hud-repo-info">
          {/* Back button when in a solar system */}
          {viewLevel === 'system' && currentSystem && (
            <button className="back-btn" onClick={exitSystem}>
              ← Back to Galaxy
            </button>
          )}
          <span className="repo-icon">🌌</span>
          <span className="repo-name">{repoInfo?.name || 'Loading...'}</span>
          {viewLevel === 'system' && currentSystem && (
            <span className="current-system">
              → ☀️ {currentSystem.name}
            </span>
          )}
          <span className="repo-branch">
            <span className="branch-icon">⎇</span>
            {repoInfo?.branch || 'main'}
          </span>
        </div>

        <div className="hud-controls">
          {/* View mode toggle */}
          <div className="control-group">
            <button
              className={`hud-btn ${viewMode === 'explore' ? 'active' : ''}`}
              onClick={() => setViewMode('explore')}
            >
              🔭 Explore
            </button>
            <button
              className={`hud-btn ${viewMode === 'history' ? 'active' : ''}`}
              onClick={() => setViewMode('history')}
            >
              📜 History
            </button>
          </div>

          {/* Camera mode toggle */}
          <div className="control-group">
            <button
              className={`hud-btn ${cameraMode === 'orbit' ? 'active' : ''}`}
              onClick={() => setCameraMode('orbit')}
            >
              🌍 Orbit
            </button>
            <button
              className={`hud-btn ${cameraMode === 'fly' ? 'active' : ''}`}
              onClick={() => setCameraMode('fly')}
            >
              🚀 Fly
            </button>
          </div>

          <button
            className={`settings-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(true)}
          >
            ⚙ Settings
          </button>

          <button
            className="shutdown-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to exit Gitlaxy?')) {
                window.close()
              }
            }}
            title="Exit Application"
          >
            ⏻ Exit
          </button>
        </div>
      </div>

      {/* Bottom left - controls help */}
      <div className="hud-bottom-left">
        {cameraMode === 'fly' ? (
          <div className="controls-help">
            <div className="help-title">Ship Controls</div>
            <div className="help-row">
              <kbd>Mouse</kbd> Pitch &amp; Yaw
            </div>
            <div className="help-row">
              <kbd>W</kbd> Thrust &nbsp; <kbd>S</kbd> Brake
            </div>
            <div className="help-row">
              <kbd>A</kbd><kbd>D</kbd> Barrel Roll
            </div>
            <div className="help-row">
              <kbd>Shift</kbd> Boost
            </div>
            <div className="help-row">
              <kbd>ESC</kbd> Exit fly mode
            </div>
            <div className="help-row">
              <span className="hint">Click to capture mouse</span>
            </div>
          </div>
        ) : (
          <div className="controls-help">
            <div className="help-title">
              {viewLevel === 'galaxy' ? 'Galaxy View' : 'Solar System View'}
            </div>
            <div className="help-row">
              <span className="hint">Left-click + drag to rotate</span>
            </div>
            <div className="help-row">
              <span className="hint">Right-click + drag to pan</span>
            </div>
            <div className="help-row">
              <span className="hint">Scroll to zoom</span>
            </div>
            {viewLevel === 'galaxy' && (
              <div className="help-row">
                <span className="hint">Click a sun ☀️ to enter system</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom right - selected node info */}
      {selectedNode && (
        <div className="hud-bottom-right">
          <div className="node-info">
            <div className="node-type">
              {selectedNode.type === 'folder' ? '☀️ Solar System' : '🪐 Planet'}
            </div>
            <div className="node-name">{selectedNode.name}</div>
            <div className="node-path">{selectedNode.path}</div>
            {selectedNode.type === 'file' && (
              <div className="node-meta">
                <span className="extension">.{selectedNode.extension}</span>
                <span className="size">{(selectedNode.size / 1000).toFixed(1)} KB</span>
              </div>
            )}
            {selectedNode.type === 'folder' && (
              <div className="node-meta">
                <span className="children">{selectedNode.children.length} bodies</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View level indicator */}
      <div className="view-indicator">
        <span className={viewLevel === 'galaxy' ? 'active' : ''}>🌌 Galaxy</span>
        {viewLevel === 'system' && (
          <>
            <span className="separator">→</span>
            <span className="active">☀️ {currentSystem?.name}</span>
          </>
        )}
      </div>

      {/* Landed indicator */}
      {landingState === 'landed' && nearestPlanet && (
        <div className="landed-indicator">
          <span className="landed-icon">🪐</span>
          <span className="landed-text">Landed on</span>
          <span className="landed-planet">{nearestPlanet.node.name}</span>
        </div>
      )}

      {/* Landing prompt (when approaching a planet in fly mode) */}
      {cameraMode === 'fly' && landingState === 'approaching' && nearestPlanet && (
        <div className="landing-prompt">
          <div className="landing-target">
            <span className="planet-icon">🪐</span>
            <span className="planet-name">{nearestPlanet.node.name}</span>
          </div>
          <div className="landing-distance">
            {Math.round(nearestPlanet.distance)} units away
          </div>
          <div className="landing-action">
            <kbd>E</kbd> Land &amp; Edit
          </div>
        </div>
      )}

      {/* Speed indicator (when in fly mode) */}
      {cameraMode === 'fly' && (
        <div className="speed-indicator">
          <div className="speed-bar-container">
            <div
              className={`speed-bar ${flightState.isBoosting ? 'boosting' : ''} ${flightState.speed < 0 ? 'reverse' : ''}`}
              style={{ width: `${Math.min(Math.abs(flightState.speed) / 15000 * 100, 100)}%` }}
            />
          </div>
          <div className="speed-value">
            <span className="speed-number">{Math.round(flightState.speed)}</span>
            <span className="speed-unit">u/s</span>
            {flightState.isBoosting && <span className="boost-label">BOOST</span>}
          </div>
        </div>
      )}

      {/* Ship selector (when in fly mode) */}
      {cameraMode === 'fly' && (
        <div className="ship-selector">
          <div className="ship-selector-title">Select Ship</div>
          <div className="ship-options">
            {SHIP_TYPES.map((shipType) => {
              const info = SHIP_INFO[shipType]
              return (
                <button
                  key={shipType}
                  className={`ship-option ${selectedShip === shipType ? 'active' : ''}`}
                  onClick={() => setSelectedShip(shipType)}
                >
                  <span className="ship-icon">{info.icon}</span>
                  <span className="ship-name">{info.name}</span>
                  <span className="ship-desc">{info.description}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* History timeline (when in history mode) */}
      {viewMode === 'history' && commits.length > 0 && (
        <div className="hud-timeline">
          <div className="timeline-controls">
            <button className="timeline-btn" onClick={prevCommit} disabled={historyIndex === 0}>
              ⏮
            </button>
            <button className="timeline-btn play" onClick={togglePlayback}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              className="timeline-btn"
              onClick={nextCommit}
              disabled={historyIndex >= commits.length - 1}
            >
              ⏭
            </button>
          </div>

          <div className="timeline-track">
            <input
              type="range"
              min={0}
              max={commits.length - 1}
              value={historyIndex}
              onChange={(e) => setHistoryIndex(parseInt(e.target.value))}
              className="timeline-slider"
            />
            <div className="timeline-markers">
              {commits.map((_, i) => (
                <div
                  key={i}
                  className={`timeline-marker ${i === historyIndex ? 'active' : ''} ${
                    i < historyIndex ? 'past' : ''
                  }`}
                  onClick={() => setHistoryIndex(i)}
                />
              ))}
            </div>
          </div>

          {currentCommit && (
            <div className="commit-info">
              <div className="commit-hash">{currentCommit.shortHash}</div>
              <div className="commit-message">{currentCommit.message}</div>
              <div className="commit-meta">
                <span className="author">{currentCommit.author}</span>
                <span className="date">
                  {currentCommit.date.toLocaleDateString()}
                </span>
              </div>
              <div className="commit-files">
                {currentCommit.files.map((f, i) => (
                  <div key={i} className={`file-change ${f.status}`}>
                    <span className="status-icon">
                      {f.status === 'added' && '+'}
                      {f.status === 'modified' && '~'}
                      {f.status === 'deleted' && '-'}
                    </span>
                    {f.path.split('/').pop()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

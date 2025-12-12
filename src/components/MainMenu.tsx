import { useState } from 'react'
import { useStore } from '../store'
import ArmingSwitch from './ArmingSwitch'
import SupernovaCanvas from './SupernovaCanvas'
import { pickDirectory, countTreeStats, readDirectoryAsTree, isFileSystemAccessSupported } from '../utils/fileSystemAccess'
import './MainMenu.css'

export default function MainMenu() {
    const startAppWithFolder = useStore((state) => state.startAppWithFolder)

    const [selectedFolder, setSelectedFolder] = useState<FileSystemDirectoryHandle | null>(null)
    const [stats, setStats] = useState({ files: 0, folders: 0, name: '' })
    const [isLoading, setIsLoading] = useState(false)

    const handleOpenFolder = async () => {
        if (!isFileSystemAccessSupported()) {
            alert('File System Access API is not supported in this browser. Please use Chrome or Edge.')
            return
        }

        setIsLoading(true)
        try {
            const dirHandle = await pickDirectory()
            if (dirHandle) {
                // Read the directory to get stats
                const tree = await readDirectoryAsTree(dirHandle)
                const treeStats = countTreeStats(tree)
                setSelectedFolder(dirHandle)
                setStats({
                    files: treeStats.files,
                    folders: treeStats.folders,
                    name: dirHandle.name
                })
            }
        } catch (error) {
            console.error('Failed to open folder:', error)
            alert('Failed to open folder. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLaunch = () => {
        if (selectedFolder) {
            startAppWithFolder(selectedFolder)
        }
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

                    {!selectedFolder ? (
                        <>
                            <button
                                className="open-folder-btn"
                                onClick={handleOpenFolder}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Scanning...' : 'Open Folder'}
                            </button>
                            <div className="folder-hint">
                                Select a project folder to visualize
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="selected-folder">
                                <span className="folder-icon">📁</span>
                                <span className="folder-name">{stats.name}</span>
                                <button
                                    className="change-folder-btn"
                                    onClick={handleOpenFolder}
                                    disabled={isLoading}
                                >
                                    Change
                                </button>
                            </div>

                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-value">{stats.files}</span>
                                    <span className="stat-label">Files Detected</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{stats.folders}</span>
                                    <span className="stat-label">Folders Found</span>
                                </div>
                            </div>

                            <ArmingSwitch onArmed={handleLaunch} label="Initialize System" />
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="footer">
                    <span className="version">v0.1.0-alpha</span>
                    <span style={{ margin: '0 1rem' }}>|</span>
                    <span>{selectedFolder ? 'Folder Ready' : 'Select a Folder'}</span>
                </div>
            </div>
        </div>
    )
}

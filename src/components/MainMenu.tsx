import { useState, useRef } from 'react'
import { useStore } from '../store'
import ArmingSwitch from './ArmingSwitch'
import SupernovaCanvas from './SupernovaCanvas'
import { pickDirectory, countTreeStats, readDirectoryAsTree, isFileSystemAccessSupported, buildTreeFromFileList } from '../utils/fileSystemAccess'
import './MainMenu.css'

export default function MainMenu() {
    const startAppWithFolder = useStore((state) => state.startAppWithFolder)
    const startAppWithTree = useStore((state) => state.startAppWithTree)
    const startApp = useStore((state) => state.startApp)

    const [selectedFolder, setSelectedFolder] = useState<FileSystemDirectoryHandle | null>(null)
    const [folderTree, setFolderTree] = useState<ReturnType<typeof buildTreeFromFileList> | null>(null)
    const [stats, setStats] = useState({ files: 0, folders: 0, name: '' })
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleOpenFolder = async () => {
        // Use File System Access API if available (Chrome/Edge)
        if (isFileSystemAccessSupported()) {
            setIsLoading(true)
            try {
                const dirHandle = await pickDirectory()
                if (dirHandle) {
                    const tree = await readDirectoryAsTree(dirHandle)
                    const treeStats = countTreeStats(tree)
                    setSelectedFolder(dirHandle)
                    setFolderTree(null)
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
        } else {
            // Fallback: use file input for Safari/Firefox
            fileInputRef.current?.click()
        }
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsLoading(true)
        try {
            const tree = buildTreeFromFileList(files)
            const treeStats = countTreeStats(tree)
            setFolderTree(tree)
            setSelectedFolder(null)
            setStats({
                files: treeStats.files,
                folders: treeStats.folders,
                name: tree.name
            })
        } catch (error) {
            console.error('Failed to process folder:', error)
            alert('Failed to process folder. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLaunch = () => {
        if (selectedFolder) {
            startAppWithFolder(selectedFolder)
        } else if (folderTree) {
            startAppWithTree(folderTree)
        }
    }

    const hasSelection = selectedFolder || folderTree

    return (
        <div className="main-menu-container">
            {/* Hidden file input for Safari/Firefox fallback */}
            <input
                ref={fileInputRef}
                type="file"
                // @ts-expect-error - webkitdirectory is non-standard but widely supported
                webkitdirectory=""
                directory=""
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
            />

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

                    {!hasSelection ? (
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
                    <span>{hasSelection ? 'Folder Ready' : 'Select a Folder'}</span>
                </div>
            </div>
        </div>
    )
}

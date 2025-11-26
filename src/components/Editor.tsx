import { useEffect, useRef, useCallback } from 'react'
import { useStore, useIsEditorOpen, useEditorContent, useEditorHasUnsavedChanges, useEditorError, useLandingTarget } from '../store'
import { readFile, writeFile } from '../utils/fileApi'
import './Editor.css'

export default function Editor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isOpen = useIsEditorOpen()
  const content = useEditorContent()
  const hasUnsavedChanges = useEditorHasUnsavedChanges()
  const error = useEditorError()
  const targetFile = useLandingTarget()
  const { setEditorContent, setEditorError, closeEditor, openEditor, completeTakeoff, setHasUnsavedChanges } = useStore()

  // Load file content when landing
  useEffect(() => {
    if (targetFile && isOpen && content === null) {
      readFile(targetFile.path)
        .then((fileContent) => {
          openEditor(fileContent)
        })
        .catch((err) => {
          setEditorError(err.message)
        })
    }
  }, [targetFile, isOpen, content, openEditor, setEditorError])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(e.target.value)
  }, [setEditorContent])

  const handleSave = useCallback(async () => {
    if (!targetFile || content === null) return

    try {
      await writeFile(targetFile.path, content)
      setHasUnsavedChanges(false)
      setEditorError(null)
    } catch (err) {
      setEditorError((err as Error).message)
    }
  }, [targetFile, content, setHasUnsavedChanges, setEditorError])

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return
      }
    }
    closeEditor()
  }, [hasUnsavedChanges, closeEditor])

  const handleTakeoff = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to take off?')) {
        return
      }
    }
    completeTakeoff()
  }, [hasUnsavedChanges, completeTakeoff])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleSave])

  if (!isOpen) return null

  return (
    <div className="editor-overlay">
      <div className="editor-container">
        <div className="editor-header">
          <div className="editor-file-info">
            <span className="editor-icon">🪐</span>
            <span className="editor-filename">{targetFile?.name || 'Unknown'}</span>
            <span className="editor-path">{targetFile?.path}</span>
            {hasUnsavedChanges && <span className="editor-unsaved">●</span>}
          </div>
          <div className="editor-actions">
            <button className="editor-btn save" onClick={handleSave} disabled={!hasUnsavedChanges}>
              💾 Save
            </button>
            <button className="editor-btn close" onClick={handleClose}>
              ✕ Close
            </button>
            <button className="editor-btn takeoff" onClick={handleTakeoff}>
              🚀 Take Off
            </button>
          </div>
        </div>

        {error && (
          <div className="editor-error">
            ⚠️ {error}
          </div>
        )}

        <div className="editor-content">
          {content === null ? (
            <div className="editor-loading">
              <div className="loading-spinner"></div>
              <span>Loading file...</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              value={content}
              onChange={handleChange}
              spellCheck={false}
            />
          )}
        </div>

        <div className="editor-footer">
          <span className="editor-hint">
            <kbd>Cmd/Ctrl+S</kbd> Save
          </span>
          <span className="editor-status">
            {targetFile?.extension?.toUpperCase() || 'TEXT'}
          </span>
        </div>
      </div>
    </div>
  )
}

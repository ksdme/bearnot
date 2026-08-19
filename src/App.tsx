import { useEffect, useRef, useState } from 'react'
import { EditorPane } from './components/EditorPane'
import { SettingsModal } from './components/SettingsModal'
import { Sidebar } from './components/Sidebar'
import { cx } from './lib/cx'
import { useMediaQuery } from './lib/useMediaQuery'
import { useNotes } from './state/NotesProvider'

export default function App() {
  const { ready, createNote, selectedPath } = useNotes()
  const compact = useMediaQuery('(width < 48rem)')
  const [pane, setPane] = useState<'list' | 'editor'>('list')
  const previousCompact = useRef<boolean | null>(null)

  useEffect(() => {
    const previous = previousCompact.current
    previousCompact.current = compact
    if (previous === null || previous === compact) return
    if (compact) setPane(selectedPath ? 'editor' : 'list')
  }, [compact, selectedPath])

  useEffect(() => {
    if (compact && !selectedPath) setPane('list')
  }, [compact, selectedPath])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        void createNote()
        setPane('editor')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [createNote])

  if (!ready) {
    return (
      <div className="grid h-dvh place-items-center bg-surface text-[15px] text-fg-muted">
        <span>Opening notes…</span>
      </div>
    )
  }

  const listHidden = compact && pane === 'editor'
  const editorHidden = compact && pane === 'list'

  return (
    <>
      <div
        className={cx(
          'grid h-dvh overflow-hidden bg-chrome',
          'grid-cols-1 grid-rows-1',
          'md:grid-cols-[minmax(13rem,var(--spacing-sidebar))_minmax(0,1fr)] md:gap-2',
          'lg:gap-2.5',
          'md:pt-[max(0.5rem,env(safe-area-inset-top))] md:pr-[max(0.5rem,env(safe-area-inset-right))] md:pb-[max(0.5rem,env(safe-area-inset-bottom))] md:pl-[max(0.5rem,env(safe-area-inset-left))]',
          'lg:pt-[max(0.625rem,env(safe-area-inset-top))] lg:pr-[max(0.625rem,env(safe-area-inset-right))] lg:pb-[max(0.625rem,env(safe-area-inset-bottom))] lg:pl-[max(0.625rem,env(safe-area-inset-left))]',
        )}
      >
        <Sidebar hiddenOnCompact={listHidden} onNoteOpen={() => setPane('editor')} />
        <EditorPane hiddenOnCompact={editorHidden} onBack={compact ? () => setPane('list') : undefined} />
      </div>
      <SettingsModal />
    </>
  )
}

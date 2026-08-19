import { useEffect } from 'react'
import { EditorPane } from './components/EditorPane'
import { SettingsModal } from './components/SettingsModal'
import { Sidebar } from './components/Sidebar'
import { useNotes } from './state/NotesProvider'

export default function App() {
  const { ready, createNote } = useNotes()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        void createNote()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [createNote])

  if (!ready) {
    return (
      <div className="grid h-full place-items-center bg-surface text-[15px] text-fg-muted">
        <span>Opening notes…</span>
      </div>
    )
  }

  return (
    <div className="grid h-full min-h-dvh grid-cols-[var(--spacing-sidebar)_minmax(0,1fr)] gap-2.5 overflow-hidden bg-chrome p-2.5 max-[900px]:grid-cols-[minmax(12.5rem,15rem)_minmax(0,1fr)] max-[900px]:gap-2 max-[900px]:p-2">
      <Sidebar />
      <EditorPane />
      <SettingsModal />
    </div>
  )
}

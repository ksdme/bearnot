import { useEffect } from 'react'
import { EditorPane } from './components/EditorPane'
import { NoteList } from './components/NoteList'
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
      <div className="boot">
        <span>Opening notes…</span>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <NoteList />
      <EditorPane />
      <SettingsModal />
    </div>
  )
}

import { noteTreePath } from '../notes/paths'
import { useNotes } from '../state/NotesProvider'
import { Dialog } from './Popover'

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen, notes, storage } = useNotes()
  if (!settingsOpen) return null

  const files = [...notes].sort((a, b) => noteTreePath(a.path).localeCompare(noteTreePath(b.path)))

  return (
    <Dialog title="Settings" onClose={() => setSettingsOpen(false)}>
      <div className="settings-body">
        <p>
          Notes are plain Markdown files with YAML frontmatter. This session uses an in-memory
          file storage adapter — nothing is written to disk yet, and there is no account layer.
        </p>
        <dl className="settings-meta">
          <div>
            <dt>Adapter</dt>
            <dd>{storage.constructor.name}</dd>
          </div>
          <div>
            <dt>Folder</dt>
            <dd>/notes</dd>
          </div>
          <div>
            <dt>Files</dt>
            <dd>{files.length}</dd>
          </div>
        </dl>
        <ul className="file-list">
          {files.map((note) => (
            <li key={note.path}>
              <code>{noteTreePath(note.path)}</code>
              <span>{note.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  )
}

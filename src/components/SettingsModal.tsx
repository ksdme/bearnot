import { noteTreePath } from '../notes/paths'
import { useNotes } from '../state/NotesProvider'
import { Dialog } from './Popover'

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen, notes, storage } = useNotes()
  if (!settingsOpen) return null

  const files = [...notes].sort((a, b) => noteTreePath(a.path).localeCompare(noteTreePath(b.path)))

  return (
    <Dialog title="Settings" onClose={() => setSettingsOpen(false)}>
      <div>
        <p className="mb-4 w-full text-[14.5px] leading-[1.55] text-fg-dim">
          Notes are plain Markdown files with YAML frontmatter. This session uses an in-memory
          file storage adapter — nothing is written to disk yet, and there is no account layer.
        </p>
        <dl className="mb-4 grid grid-cols-3 gap-2.5">
          <div className="rounded-[10px] bg-surface px-3 py-2.5">
            <dt className="mb-1 text-[11px] text-fg-muted">Adapter</dt>
            <dd className="m-0 text-[13px] font-bold">{storage.constructor.name}</dd>
          </div>
          <div className="rounded-[10px] bg-surface px-3 py-2.5">
            <dt className="mb-1 text-[11px] text-fg-muted">Folder</dt>
            <dd className="m-0 text-[13px] font-bold">/notes</dd>
          </div>
          <div className="rounded-[10px] bg-surface px-3 py-2.5">
            <dt className="mb-1 text-[11px] text-fg-muted">Files</dt>
            <dd className="m-0 text-[13px] font-bold">{files.length}</dd>
          </div>
        </dl>
        <ul className="m-0 max-h-60 list-none overflow-auto rounded-[10px] border border-border-subtle p-0">
          {files.map((note) => (
            <li
              key={note.path}
              className="flex justify-between gap-3 border-b border-surface-muted px-3 py-2 text-[13px] last:border-b-0"
            >
              <code className="font-mono text-xs text-fg-menu">{noteTreePath(note.path)}</code>
              <span className="overflow-hidden text-fg-muted text-ellipsis whitespace-nowrap">
                {note.title}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  )
}

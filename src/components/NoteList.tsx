import { ChevronDown, Pin, Search, SquarePen, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cx } from '../lib/cx'
import { formatRelativeTime } from '../notes/time'
import type { SortMode } from '../notes/types'
import { useNotes } from '../state/NotesProvider'
import { Popover } from './Popover'

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'modified', label: 'Date edited' },
  { id: 'created', label: 'Date created' },
  { id: 'title', label: 'Title' },
]

export function NoteList() {
  const {
    filteredNotes,
    selectedPath,
    selectNote,
    headerTitle,
    search,
    setSearch,
    sort,
    setSort,
    createNote,
    selection,
  } = useNotes()

  const [searchOpen, setSearchOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectedPath && filteredNotes.some((note) => note.path === selectedPath)) return
    selectNote(filteredNotes[0]?.path ?? null)
  }, [selection])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <section className="note-list">
      <header className="note-list-header">
        {searchOpen ? (
          <div className="search-field">
            <Search size={15} />
            <input
              ref={searchRef}
              value={search}
              placeholder="Search notes"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSearch('')
                  setSearchOpen(false)
                }
              }}
            />
            <button
              type="button"
              className="icon-btn icon-btn-ghost"
              aria-label="Close search"
              onClick={() => {
                setSearch('')
                setSearchOpen(false)
              }}
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <>
            <div className="note-list-title-wrap">
              <button
                type="button"
                className="note-list-title"
                onClick={() => setSortOpen((open) => !open)}
              >
                <span>{headerTitle}</span>
                <ChevronDown size={14} />
              </button>
              {sortOpen && (
                <Popover className="sort-popover" onClose={() => setSortOpen(false)}>
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={cx('menu-item', sort === option.id && 'is-active')}
                      onClick={() => {
                        setSort(option.id)
                        setSortOpen(false)
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </Popover>
              )}
            </div>
            <div className="note-list-actions">
              <button
                type="button"
                className="icon-btn"
                aria-label="New note"
                title="New note"
                onClick={() => void createNote()}
              >
                <SquarePen size={16} />
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Search"
                title="Search"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={16} />
              </button>
            </div>
          </>
        )}
      </header>

      <div className="note-list-body">
        {filteredNotes.length === 0 ? (
          <div className="empty-list">No notes here yet.</div>
        ) : (
          filteredNotes.map((note) => {
            const active = note.path === selectedPath
            return (
              <button
                key={note.path}
                type="button"
                className={cx('note-card', active && 'is-selected')}
                onClick={() => selectNote(note.path)}
              >
                <div className="note-card-main">
                  <div className="note-card-title">{note.title}</div>
                  {note.snippet && <div className="note-card-snippet">{note.snippet}</div>}
                  <div className="note-card-meta">
                    <span>{formatRelativeTime(note.modified)}</span>
                    {note.pinned && (
                      <Pin size={12} className="pin-icon" fill="currentColor" />
                    )}
                  </div>
                </div>
                {note.imageUrl && (
                  <img className="note-card-thumb" src={note.imageUrl} alt="" />
                )}
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}

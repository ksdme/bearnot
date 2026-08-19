import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { MemoryFileStorage } from '../storage/memory'
import type { FileStorageAdapter } from '../storage/types'
import { createNote as createNoteFile, destroyNote, duplicateNote, listNotes, writeNote } from '../notes/service'
import { seedIfEmpty } from '../notes/seed'
import type { Note } from '../notes/types'

type FlagPatch = Partial<Pick<Note, 'pinned' | 'archived' | 'trashed' | 'locked'>>

type NotesContextValue = {
  ready: boolean
  notes: Note[]
  selectedPath: string | null
  selectedNote: Note | null
  unlocked: ReadonlySet<string>
  settingsOpen: boolean
  storage: FileStorageAdapter
  selectNote: (path: string | null) => void
  createNote: () => Promise<Note | null>
  saveBody: (path: string, body: string) => Promise<void>
  updateFlags: (path: string, flags: FlagPatch) => Promise<void>
  duplicate: (path: string) => Promise<void>
  destroy: (path: string) => Promise<void>
  unlock: (path: string) => void
  setSettingsOpen: (open: boolean) => void
}

const NotesContext = createContext<NotesContextValue | null>(null)

function pickNeighbor(path: string, pool: Note[]): string | null {
  const index = pool.findIndex((note) => note.path === path)
  return pool[index + 1]?.path ?? pool[index - 1]?.path ?? null
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const storageRef = useRef<FileStorageAdapter>(new MemoryFileStorage())
  const storage = storageRef.current
  const notesRef = useRef<Note[]>([])

  const [ready, setReady] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState<Set<string>>(() => new Set())
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await seedIfEmpty(storage)
      const loaded = await listNotes(storage)
      if (cancelled) return
      setNotes(loaded)
      const preferred = loaded.filter((note) => !note.trashed)
      setSelectedPath((preferred[0] ?? loaded[0])?.path ?? null)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [storage])

  const selectedNote = useMemo(
    () => notes.find((note) => note.path === selectedPath) ?? null,
    [notes, selectedPath],
  )

  const selectNote = useCallback((path: string | null) => {
    setSelectedPath(path)
  }, [])

  const createNote = useCallback(async () => {
    const note = await createNoteFile(storage, { title: 'Untitled' })
    setNotes((prev) => [note, ...prev])
    setSelectedPath(note.path)
    return note
  }, [storage])

  const saveBody = useCallback(
    async (path: string, body: string) => {
      const current = notesRef.current.find((note) => note.path === path)
      if (!current || current.body === body) return
      const updated = await writeNote(storage, {
        path,
        body,
        pinned: current.pinned,
        archived: current.archived,
        trashed: current.trashed,
        locked: current.locked,
        created: current.created,
      })
      setNotes((prev) => prev.map((note) => (note.path === path ? updated : note)))
    },
    [storage],
  )

  const updateFlags = useCallback(
    async (path: string, flags: FlagPatch) => {
      const current = notesRef.current.find((note) => note.path === path)
      if (!current) return
      const updated = await writeNote(storage, {
        path,
        body: current.body,
        pinned: flags.pinned ?? current.pinned,
        archived: flags.archived ?? current.archived,
        trashed: flags.trashed ?? current.trashed,
        locked: flags.locked ?? current.locked,
        created: current.created,
        modified: current.modified,
        tags: current.tags,
      })
      setNotes((prev) => prev.map((note) => (note.path === path ? updated : note)))
    },
    [storage],
  )

  const duplicate = useCallback(
    async (path: string) => {
      const current = notesRef.current.find((note) => note.path === path)
      if (!current) return
      const copy = await duplicateNote(storage, current)
      setNotes((prev) => [copy, ...prev])
      setSelectedPath(copy.path)
    },
    [storage],
  )

  const destroy = useCallback(
    async (path: string) => {
      await destroyNote(storage, path)
      const remaining = notesRef.current.filter((note) => note.path !== path)
      setNotes(remaining)
      setSelectedPath((prev) => (prev === path ? pickNeighbor(path, remaining) : prev))
    },
    [storage],
  )

  const unlock = useCallback((path: string) => {
    setUnlocked((prev) => {
      const next = new Set(prev)
      next.add(path)
      return next
    })
  }, [])

  const value = useMemo<NotesContextValue>(
    () => ({
      ready,
      notes,
      selectedPath,
      selectedNote,
      unlocked,
      settingsOpen,
      storage,
      selectNote,
      createNote,
      saveBody,
      updateFlags,
      duplicate,
      destroy,
      unlock,
      setSettingsOpen,
    }),
    [
      ready,
      notes,
      selectedPath,
      selectedNote,
      unlocked,
      settingsOpen,
      storage,
      selectNote,
      createNote,
      saveBody,
      updateFlags,
      duplicate,
      destroy,
      unlock,
    ],
  )

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}

export function useNotes(): NotesContextValue {
  const value = useContext(NotesContext)
  if (!value) throw new Error('useNotes must be used within NotesProvider')
  return value
}

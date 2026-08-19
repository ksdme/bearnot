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
import { buildTagTree, noteHasTag } from '../notes/tags'
import { isSameLocalDay } from '../notes/time'
import type { Note, Selection, SmartFolder, SortMode, TagNode } from '../notes/types'

type FlagPatch = Partial<Pick<Note, 'pinned' | 'archived' | 'trashed' | 'locked'>>

type NotesContextValue = {
  ready: boolean
  notes: Note[]
  filteredNotes: Note[]
  selectedPath: string | null
  selectedNote: Note | null
  selection: Selection
  search: string
  sort: SortMode
  unlocked: ReadonlySet<string>
  settingsOpen: boolean
  tagTree: TagNode[]
  headerTitle: string
  storage: FileStorageAdapter
  setSelection: (selection: Selection) => void
  setSearch: (value: string) => void
  setSort: (sort: SortMode) => void
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

const FOLDER_TITLES: Record<SmartFolder, string> = {
  notes: 'Notes',
  untagged: 'Untagged',
  todo: 'Todo',
  today: 'Today',
  locked: 'Locked',
  archive: 'Archive',
  trash: 'Trash',
}

function matchesSelection(note: Note, selection: Selection): boolean {
  if (selection.type === 'folder') {
    switch (selection.id) {
      case 'notes':
        return !note.archived && !note.trashed
      case 'untagged':
        return !note.archived && !note.trashed && note.tags.length === 0
      case 'todo':
        return !note.archived && !note.trashed && note.hasTodo
      case 'today':
        return (
          !note.archived &&
          !note.trashed &&
          (isSameLocalDay(note.modified) || isSameLocalDay(note.created))
        )
      case 'locked':
        return note.locked && !note.trashed
      case 'archive':
        return note.archived && !note.trashed
      case 'trash':
        return note.trashed
    }
  }
  return !note.archived && !note.trashed && noteHasTag(note, selection.id)
}

function sortNotes(notes: Note[], sort: SortMode): Note[] {
  const copy = [...notes]
  copy.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (sort === 'title') return a.title.localeCompare(b.title)
    const left = sort === 'created' ? a.created : a.modified
    const right = sort === 'created' ? b.created : b.modified
    return right.localeCompare(left)
  })
  return copy
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const storageRef = useRef<FileStorageAdapter>(new MemoryFileStorage())
  const storage = storageRef.current
  const notesRef = useRef<Note[]>([])

  const [ready, setReady] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [selection, setSelectionState] = useState<Selection>({ type: 'folder', id: 'notes' })
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('modified')
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
      const initial = sortNotes(
        loaded.filter((note) => matchesSelection(note, { type: 'folder', id: 'notes' })),
        'modified',
      )
      setSelectedPath(initial[0]?.path ?? null)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [storage])

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase()
    const visible = notes.filter((note) => {
      if (!matchesSelection(note, selection)) return false
      if (!query) return true
      return (
        note.title.toLowerCase().includes(query) ||
        note.body.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.includes(query))
      )
    })
    return sortNotes(visible, sort)
  }, [notes, search, selection, sort])

  const selectedNote = useMemo(
    () => notes.find((note) => note.path === selectedPath) ?? null,
    [notes, selectedPath],
  )

  const tagTree = useMemo(() => buildTagTree(notes), [notes])

  const headerTitle = useMemo(() => {
    if (selection.type === 'folder') return FOLDER_TITLES[selection.id]
    return `#${selection.id}`
  }, [selection])

  const pickNeighbor = useCallback(
    (path: string, pool: Note[]) => {
      const index = pool.findIndex((note) => note.path === path)
      return pool[index + 1]?.path ?? pool[index - 1]?.path ?? null
    },
    [],
  )

  const setSelection = useCallback((next: Selection) => {
    setSelectionState(next)
    setSearch('')
  }, [])

  const selectNote = useCallback((path: string | null) => {
    setSelectedPath(path)
  }, [])

  const createNote = useCallback(async () => {
    const note = await createNoteFile(storage, { title: 'Untitled' })
    setNotes((prev) => [note, ...prev])
    setSelectionState({ type: 'folder', id: 'notes' })
    setSearch('')
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
      if (flags.trashed || flags.archived) {
        setSelectedPath((prev) => {
          if (prev !== path) return prev
          const remaining = notesRef.current.filter((note) => note.path !== path)
          const stillVisible = remaining.filter((note) => matchesSelection(note, selection))
          return pickNeighbor(path, stillVisible.length ? stillVisible : remaining)
        })
      }
    },
    [pickNeighbor, selection, storage],
  )

  const duplicate = useCallback(
    async (path: string) => {
      const current = notesRef.current.find((note) => note.path === path)
      if (!current) return
      const copy = await duplicateNote(storage, current)
      setNotes((prev) => [copy, ...prev])
      setSelectionState({ type: 'folder', id: 'notes' })
      setSelectedPath(copy.path)
    },
    [storage],
  )

  const destroy = useCallback(
    async (path: string) => {
      await destroyNote(storage, path)
      const remaining = notesRef.current.filter((note) => note.path !== path)
      setNotes(remaining)
      setSelectedPath((prev) => {
        if (prev !== path) return prev
        const stillVisible = remaining.filter((note) => matchesSelection(note, selection))
        return stillVisible[0]?.path ?? remaining[0]?.path ?? null
      })
    },
    [selection, storage],
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
      filteredNotes,
      selectedPath,
      selectedNote,
      selection,
      search,
      sort,
      unlocked,
      settingsOpen,
      tagTree,
      headerTitle,
      storage,
      setSelection,
      setSearch,
      setSort,
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
      filteredNotes,
      selectedPath,
      selectedNote,
      selection,
      search,
      sort,
      unlocked,
      settingsOpen,
      tagTree,
      headerTitle,
      storage,
      setSelection,
      createNote,
      saveBody,
      updateFlags,
      duplicate,
      destroy,
      unlock,
      selectNote,
    ],
  )

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}

export function useNotes(): NotesContextValue {
  const value = useContext(NotesContext)
  if (!value) throw new Error('useNotes must be used within NotesProvider')
  return value
}

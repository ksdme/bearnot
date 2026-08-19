import { FileTree, useFileTree } from '@pierre/trees/react'
import { Search, SlidersHorizontal, SquarePen } from 'lucide-react'
import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { noteTreePath, treePathToNotePath } from '../notes/paths'
import { useNotes } from '../state/NotesProvider'

const TREE_STYLE = {
  height: '100%',
  minHeight: 0,
  border: 'none',
  colorScheme: 'dark',
  backgroundColor: 'var(--color-sidebar)',
  color: 'var(--color-sidebar-fg)',
  '--trees-font-family-override': 'var(--font-sans)',
  '--trees-accent-override': 'var(--color-bear)',
  '--trees-padding-inline-override': '10px',
  '--trees-theme-sidebar-bg': 'var(--color-sidebar)',
  '--trees-theme-sidebar-fg': 'var(--color-sidebar-fg)',
  '--trees-theme-sidebar-header-fg': 'var(--color-sidebar-muted)',
  '--trees-theme-sidebar-border': 'transparent',
  '--trees-theme-list-active-selection-fg': 'var(--color-sidebar-selected-fg)',
  '--trees-theme-list-hover-bg': 'var(--color-sidebar-hover)',
  '--trees-theme-list-active-selection-bg': 'var(--color-sidebar-selected)',
  '--trees-theme-focus-ring': 'var(--color-bear)',
  '--trees-theme-input-bg': 'var(--color-sidebar-input)',
  '--trees-theme-input-border': 'var(--color-sidebar-border)',
  '--trees-theme-scrollbar-thumb': 'var(--color-sidebar-scroll)',
} as CSSProperties

export function Sidebar() {
  const { notes, selectedPath, selectNote, createNote, setSettingsOpen } = useNotes()

  const paths = useMemo(
    () => notes.map((note) => noteTreePath(note.path)).sort((a, b) => a.localeCompare(b)),
    [notes],
  )

  const selectNoteRef = useRef(selectNote)
  selectNoteRef.current = selectNote

  const { model } = useFileTree({
    paths,
    search: true,
    icons: 'standard',
    density: 'compact',
    initialExpansion: 'open',
    initialSelectedPaths: selectedPath ? [noteTreePath(selectedPath)] : [],
    onSelectionChange: (selected) => {
      const file = selected.find((path) => path.endsWith('.md'))
      if (!file) return
      selectNoteRef.current(treePathToNotePath(file))
    },
  })

  const prevPathsRef = useRef(paths)
  useEffect(() => {
    const prev = new Set(prevPathsRef.current)
    const next = new Set(paths)
    for (const path of next) {
      if (!prev.has(path)) model.add(path)
    }
    for (const path of prev) {
      if (!next.has(path)) model.remove(path)
    }
    prevPathsRef.current = paths
  }, [model, paths])

  useEffect(() => {
    if (!selectedPath) return
    const treePath = noteTreePath(selectedPath)
    const current = model.getSelectedPaths()
    if (current.length === 1 && current[0] === treePath) return
    const item = model.getItem(treePath)
    if (!item) return
    for (const path of current) {
      if (path !== treePath) model.getItem(path)?.deselect()
    }
    if (!item.isSelected()) item.select()
    model.scrollToPath(treePath, { focus: false })
  }, [model, selectedPath])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        model.openSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [model])

  return (
    <aside className="flex min-h-0 min-w-0 select-none flex-col overflow-hidden rounded-xl bg-sidebar text-sidebar-fg">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <div className="flex gap-[7px]" aria-hidden="true">
          <span className="block size-3 rounded-full bg-traffic-red" />
          <span className="block size-3 rounded-full bg-traffic-yellow" />
          <span className="block size-3 rounded-full bg-traffic-green" />
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="icon-btn icon-btn-ghost"
            aria-label="New note"
            title="New note"
            onClick={() => void createNote()}
          >
            <SquarePen size={15} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn-ghost"
            aria-label="Search files"
            title="Search files"
            onClick={() => model.openSearch()}
          >
            <Search size={15} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn-ghost"
            aria-label="Settings"
            title="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>

      <FileTree model={model} className="flex min-h-0 w-full flex-1" style={TREE_STYLE} />
    </aside>
  )
}

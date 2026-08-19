import { themeToTreeStyles } from '@pierre/trees'
import { FileTree, useFileTree } from '@pierre/trees/react'
import { Search, SlidersHorizontal, SquarePen } from 'lucide-react'
import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { noteTreePath, treePathToNotePath } from '../notes/paths'
import { useNotes } from '../state/NotesProvider'

const TREE_THEME = themeToTreeStyles({
  type: 'dark',
  bg: '#2a2a2a',
  fg: '#c8c8c8',
  colors: {
    'sideBar.background': '#2a2a2a',
    'sideBar.foreground': '#c8c8c8',
    'sideBar.border': 'transparent',
    'sideBarSectionHeader.foreground': '#8d8d8d',
    'list.activeSelectionBackground': '#3d3d3d',
    'list.activeSelectionForeground': '#ffffff',
    'list.hoverBackground': '#333333',
    'list.focusBackground': '#3d3d3d',
    'list.focusOutline': '#e24b3e',
    'input.background': '#1f1f1f',
    'input.border': '#3d3d3d',
    'scrollbarSlider.background': '#444444',
  },
})

const TREE_STYLE = {
  ...TREE_THEME,
  height: '100%',
  minHeight: 0,
  border: 'none',
  '--trees-font-family-override': 'var(--font)',
  '--trees-accent-override': 'var(--bear-red)',
  '--trees-padding-inline-override': '10px',
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
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="traffic" aria-hidden="true">
          <span className="tl tl-red" />
          <span className="tl tl-yellow" />
          <span className="tl tl-green" />
        </div>
        <div className="sidebar-actions">
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

      <FileTree model={model} className="notes-tree" style={TREE_STYLE} />
    </aside>
  )
}

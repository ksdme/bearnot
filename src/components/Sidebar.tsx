import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  BookOpen,
  Briefcase,
  ChevronRight,
  Clock,
  Code2,
  FlaskConical,
  Hash,
  Heart,
  Home,
  Lightbulb,
  ListTodo,
  Lock,
  Notebook,
  PawPrint,
  Plane,
  SlidersHorizontal,
  Trash2,
  User,
  Utensils,
} from 'lucide-react'
import { useState } from 'react'
import { cx } from '../lib/cx'
import { iconForTag } from '../notes/tags'
import type { SmartFolder, TagNode } from '../notes/types'
import { useNotes } from '../state/NotesProvider'

const FOLDERS: { id: SmartFolder; label: string; icon: LucideIcon }[] = [
  { id: 'notes', label: 'Notes', icon: Notebook },
  { id: 'untagged', label: 'Untagged', icon: Hash },
  { id: 'todo', label: 'Todo', icon: ListTodo },
  { id: 'today', label: 'Today', icon: Clock },
  { id: 'locked', label: 'Locked', icon: Lock },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'trash', label: 'Trash', icon: Trash2 },
]

const TAG_LUCIDE: Record<string, LucideIcon> = {
  paw: PawPrint,
  heart: Heart,
  plane: Plane,
  code: Code2,
  flask: FlaskConical,
  briefcase: Briefcase,
  user: User,
  home: Home,
  utensils: Utensils,
  book: BookOpen,
  lightbulb: Lightbulb,
  hash: Hash,
}

function TagIcon({ path }: { path: string }) {
  const Icon = TAG_LUCIDE[iconForTag(path)] ?? Hash
  return <Icon size={15} strokeWidth={1.75} />
}

function TagRow({
  node,
  depth,
  collapsed,
  toggle,
}: {
  node: TagNode
  depth: number
  collapsed: Set<string>
  toggle: (path: string) => void
}) {
  const { selection, setSelection } = useNotes()
  const active = selection.type === 'tag' && selection.id === node.path
  const hasChildren = node.children.length > 0
  const open = hasChildren && !collapsed.has(node.path)

  return (
    <div>
      <button
        type="button"
        className={cx('nav-item', active && 'is-active')}
        style={{ paddingLeft: 14 + depth * 16 }}
        onClick={() => setSelection({ type: 'tag', id: node.path })}
      >
        {hasChildren ? (
          <span
            className={cx('nav-chevron', open && 'is-open')}
            onClick={(event) => {
              event.stopPropagation()
              toggle(node.path)
            }}
          >
            <ChevronRight size={12} />
          </span>
        ) : (
          <span className="nav-chevron-spacer" />
        )}
        <span className="nav-icon">
          <TagIcon path={node.path} />
        </span>
        <span className="nav-label">{node.name.replace(/-/g, ' ')}</span>
      </button>
      {open &&
        node.children.map((child) => (
          <TagRow
            key={child.path}
            node={child}
            depth={depth + 1}
            collapsed={collapsed}
            toggle={toggle}
          />
        ))}
    </div>
  )
}

export function Sidebar() {
  const { selection, setSelection, tagTree, setSettingsOpen } = useNotes()
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())

  const toggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="traffic" aria-hidden="true">
          <span className="tl tl-red" />
          <span className="tl tl-yellow" />
          <span className="tl tl-green" />
        </div>
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

      <nav className="sidebar-nav">
        {FOLDERS.map((folder) => {
          const Icon = folder.icon
          const active = selection.type === 'folder' && selection.id === folder.id
          return (
            <button
              key={folder.id}
              type="button"
              className={cx('nav-item', active && 'is-active')}
              onClick={() => setSelection({ type: 'folder', id: folder.id })}
            >
              <span className="nav-icon">
                <Icon size={16} strokeWidth={1.75} />
              </span>
              <span className="nav-label">{folder.label}</span>
            </button>
          )
        })}

        {tagTree.length > 0 && (
          <div className="sidebar-tags">
            {tagTree.map((node) => (
              <TagRow
                key={node.path}
                node={node}
                depth={0}
                collapsed={collapsed}
                toggle={toggle}
              />
            ))}
          </div>
        )}
      </nav>
    </aside>
  )
}

import { EditorContent, useEditor } from '@tiptap/react'
import {
  Archive,
  Bold,
  CheckSquare,
  Copy,
  Heading,
  Highlighter,
  ImageIcon,
  Info,
  Italic,
  Link as LinkIcon,
  List,
  Lock,
  MoreHorizontal,
  Pin,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Type,
  Underline as UnderlineIcon,
  Unlock,
  Undo2,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { editorExtensions } from '../editor/extensions'
import { cx } from '../lib/cx'
import { formatAbsolute } from '../notes/time'
import { useNotes } from '../state/NotesProvider'
import { Dialog, Popover } from './Popover'

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={cx('icon-btn text-fg-dim', active && 'is-active')}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function wordStats(body: string) {
  const text = body.replace(/[#*_`>~\[\]()!|]/g, ' ').replace(/\s+/g, ' ').trim()
  return {
    words: text ? text.split(' ').length : 0,
    chars: body.length,
    paragraphs: body.split(/\n\s*\n/).filter((part) => part.trim()).length,
  }
}

export function EditorPane() {
  const {
    selectedNote,
    saveBody,
    updateFlags,
    duplicate,
    destroy,
    unlocked,
    unlock,
  } = useNotes()

  const [menu, setMenu] = useState<'none' | 'format' | 'info' | 'more' | 'heading' | 'insert'>('none')
  const [prompt, setPrompt] = useState<'none' | 'link' | 'image'>('none')
  const [promptValue, setPromptValue] = useState('')

  const applyingRef = useRef(false)
  const pathRef = useRef<string | null>(null)
  const pendingRef = useRef<{ path: string; body: string } | null>(null)
  const timerRef = useRef<number | null>(null)

  const flush = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const pending = pendingRef.current
    pendingRef.current = null
    if (pending) void saveBody(pending.path, pending.body)
  }, [saveBody])

  const editor = useEditor({
    extensions: editorExtensions,
    content: '',
    contentType: 'markdown',
    immediatelyRender: true,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: 'bear-editor',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: instance }) => {
      if (applyingRef.current) return
      const path = pathRef.current
      if (!path) return
      const body = instance.getMarkdown()
      pendingRef.current = { path, body }
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        const next = pendingRef.current
        pendingRef.current = null
        if (next) void saveBody(next.path, next.body)
      }, 400)
    },
  })

  useEffect(() => {
    return () => flush()
  }, [flush])

  useEffect(() => {
    flush()
    pathRef.current = selectedNote?.path ?? null
    if (!editor || editor.isDestroyed || !selectedNote) return
    applyingRef.current = true
    editor.commands.setContent(selectedNote.body, {
      contentType: 'markdown',
      emitUpdate: false,
    })
    requestAnimationFrame(() => {
      applyingRef.current = false
    })
  }, [editor, selectedNote?.path])

  const isLocked = Boolean(selectedNote?.locked && selectedNote && !unlocked.has(selectedNote.path))

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.setEditable(Boolean(selectedNote) && !isLocked)
  }, [editor, isLocked, selectedNote])

  const closeMenus = () => setMenu('none')

  const run = (fn: () => void) => {
    fn()
    closeMenus()
  }

  const submitPrompt = (event: FormEvent) => {
    event.preventDefault()
    const value = promptValue.trim()
    if (!editor || !value) {
      setPrompt('none')
      return
    }
    if (prompt === 'link') {
      editor.chain().focus().setLink({ href: value }).run()
    }
    if (prompt === 'image') {
      editor.chain().focus().setImage({ src: value }).run()
    }
    setPrompt('none')
    setPromptValue('')
  }

  if (!selectedNote) {
    return (
      <section className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-panel">
        <div className="grid h-full place-items-center p-12 text-center text-fg-muted">
          Select a note, or write a new one.
        </div>
      </section>
    )
  }

  const stats = wordStats(selectedNote.body)
  const inTrash = selectedNote.trashed

  return (
    <section className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-panel">
      <header className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-0.5 text-fg-dim">
          {editor && (
            <>
              <IconButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
                <Undo2 size={15} />
              </IconButton>
              <IconButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
                <Redo2 size={15} />
              </IconButton>
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5 text-fg-dim">
          <div className="relative">
            <IconButton
              label="Text style"
              active={menu === 'format'}
              onClick={() => setMenu((current) => (current === 'format' ? 'none' : 'format'))}
            >
              <span className="text-[10px] font-extrabold tracking-wide">B I U</span>
            </IconButton>
            {menu === 'format' && editor && (
              <Popover onClose={closeMenus}>
                <button
                  type="button"
                  className={cx('menu-item', editor.isActive('bold') && 'is-active')}
                  onClick={() => run(() => editor.chain().focus().toggleBold().run())}
                >
                  <Bold size={14} /> Bold
                </button>
                <button
                  type="button"
                  className={cx('menu-item', editor.isActive('italic') && 'is-active')}
                  onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
                >
                  <Italic size={14} /> Italic
                </button>
                <button
                  type="button"
                  className={cx('menu-item', editor.isActive('underline') && 'is-active')}
                  onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
                >
                  <UnderlineIcon size={14} /> Underline
                </button>
                <button
                  type="button"
                  className={cx('menu-item', editor.isActive('strike') && 'is-active')}
                  onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
                >
                  <Strikethrough size={14} /> Strikethrough
                </button>
              </Popover>
            )}
          </div>

          <div className="relative">
            <IconButton
              label="Note info"
              active={menu === 'info'}
              onClick={() => setMenu((current) => (current === 'info' ? 'none' : 'info'))}
            >
              <Info size={16} />
            </IconButton>
            {menu === 'info' && (
              <Popover onClose={closeMenus} className="w-[260px] p-3">
                <div className="flex justify-between gap-3 py-1.5 text-[13px] text-fg-muted">
                  <span>Created</span>
                  <strong className="font-bold text-fg">{formatAbsolute(selectedNote.created)}</strong>
                </div>
                <div className="flex justify-between gap-3 py-1.5 text-[13px] text-fg-muted">
                  <span>Modified</span>
                  <strong className="font-bold text-fg">{formatAbsolute(selectedNote.modified)}</strong>
                </div>
                <div className="flex justify-between gap-3 py-1.5 text-[13px] text-fg-muted">
                  <span>Words</span>
                  <strong className="font-bold text-fg">{stats.words}</strong>
                </div>
                <div className="flex justify-between gap-3 py-1.5 text-[13px] text-fg-muted">
                  <span>Characters</span>
                  <strong className="font-bold text-fg">{stats.chars}</strong>
                </div>
                <div className="flex justify-between gap-3 py-1.5 text-[13px] text-fg-muted">
                  <span>Paragraphs</span>
                  <strong className="font-bold text-fg">{stats.paragraphs}</strong>
                </div>
                {selectedNote.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedNote.tags.map((tag) => (
                      <span key={tag} className="hashtag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2.5 text-xs text-fg-muted">{selectedNote.filename}</div>
              </Popover>
            )}
          </div>

          <div className="relative">
            <IconButton
              label="More"
              active={menu === 'more'}
              onClick={() => setMenu((current) => (current === 'more' ? 'none' : 'more'))}
            >
              <MoreHorizontal size={16} />
            </IconButton>
            {menu === 'more' && (
              <Popover onClose={closeMenus}>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() =>
                    run(() => void updateFlags(selectedNote.path, { pinned: !selectedNote.pinned }))
                  }
                >
                  <Pin size={14} /> {selectedNote.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() =>
                    run(() => void updateFlags(selectedNote.path, { locked: !selectedNote.locked }))
                  }
                >
                  {selectedNote.locked ? <Unlock size={14} /> : <Lock size={14} />}
                  {selectedNote.locked ? 'Unlock' : 'Lock'}
                </button>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() =>
                    run(() =>
                      void updateFlags(selectedNote.path, { archived: !selectedNote.archived }),
                    )
                  }
                >
                  <Archive size={14} /> {selectedNote.archived ? 'Unarchive' : 'Archive'}
                </button>
                <button type="button" className="menu-item" onClick={() => run(() => void duplicate(selectedNote.path))}>
                  <Copy size={14} /> Duplicate
                </button>
                <div className="mx-1.5 my-1 h-px bg-border-subtle" />
                {inTrash ? (
                  <>
                    <button
                      type="button"
                      className="menu-item"
                      onClick={() => run(() => void updateFlags(selectedNote.path, { trashed: false }))}
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      className="menu-item is-danger"
                      onClick={() => run(() => void destroy(selectedNote.path))}
                    >
                      <Trash2 size={14} /> Delete forever
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="menu-item is-danger"
                    onClick={() => run(() => void updateFlags(selectedNote.path, { trashed: true }))}
                  >
                    <Trash2 size={14} /> Move to Trash
                  </button>
                )}
              </Popover>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-0 pt-2 pb-24 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-panel [&::-webkit-scrollbar-thumb]:bg-border">
        {isLocked ? (
          <div className="grid h-full place-items-center content-center justify-items-center gap-2.5 p-12 text-center text-fg-subtle">
            <Lock size={36} strokeWidth={1.4} />
            <h2 className="mt-2 mb-0 text-[22px] text-fg">This note is locked</h2>
            <p className="mb-2 max-w-[360px] leading-normal">
              Password protection will arrive with accounts. Unlock it for this session to keep writing.
            </p>
            <button type="button" className="primary-btn" onClick={() => unlock(selectedNote.path)}>
              Unlock
            </button>
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>

      {!isLocked && editor && (
        <div className="absolute bottom-[22px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-[14px] bg-toolbar px-2 py-1.5 text-fg-menu shadow-float">
          <div className="relative">
            <IconButton
              label="Headings"
              active={menu === 'heading' || editor.isActive('heading')}
              onClick={() => setMenu((current) => (current === 'heading' ? 'none' : 'heading'))}
            >
              <Heading size={16} />
            </IconButton>
            {menu === 'heading' && (
              <Popover onClose={closeMenus} className="top-auto right-auto bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2">
                <button
                  type="button"
                  className={cx('menu-item', editor.isActive('heading', { level: 1 }) && 'is-active')}
                  onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
                >
                  Title
                </button>
                <button
                  type="button"
                  className={cx('menu-item', editor.isActive('heading', { level: 2 }) && 'is-active')}
                  onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
                >
                  Heading
                </button>
                <button
                  type="button"
                  className={cx('menu-item', editor.isActive('heading', { level: 3 }) && 'is-active')}
                  onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
                >
                  Subheading
                </button>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => run(() => editor.chain().focus().setParagraph().run())}
                >
                  <Type size={14} /> Body
                </button>
              </Popover>
            )}
          </div>
          <IconButton
            label="Checklist"
            active={editor.isActive('taskList')}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <CheckSquare size={16} />
          </IconButton>
          <IconButton
            label="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={16} />
          </IconButton>
          <span className="mx-1 h-4 w-px bg-border" />
          <IconButton
            label="Bold"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={16} />
          </IconButton>
          <IconButton
            label="Italic"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={16} />
          </IconButton>
          <IconButton
            label="Highlight"
            active={editor.isActive('highlight')}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <Highlighter size={16} />
          </IconButton>
          <span className="mx-1 h-4 w-px bg-border" />
          <IconButton
            label="Link"
            active={editor.isActive('link')}
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run()
                return
              }
              setPromptValue('https://')
              setPrompt('link')
            }}
          >
            <LinkIcon size={16} />
          </IconButton>
          <IconButton
            label="Table"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <TableIcon size={16} />
          </IconButton>
          <IconButton
            label="Image"
            onClick={() => {
              setPromptValue('https://')
              setPrompt('image')
            }}
          >
            <ImageIcon size={16} />
          </IconButton>
          <div className="relative">
            <IconButton
              label="More formatting"
              active={menu === 'insert'}
              onClick={() => setMenu((current) => (current === 'insert' ? 'none' : 'insert'))}
            >
              <MoreHorizontal size={16} />
            </IconButton>
            {menu === 'insert' && (
              <Popover onClose={closeMenus} className="top-auto right-auto bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2">
                <button
                  type="button"
                  className={cx('menu-item', editor.isActive('blockquote') && 'is-active')}
                  onClick={() => run(() => editor.chain().focus().toggleBlockquote().run())}
                >
                  <Quote size={14} /> Quote
                </button>
                <button
                  type="button"
                  className={cx('menu-item', editor.isActive('codeBlock') && 'is-active')}
                  onClick={() => run(() => editor.chain().focus().toggleCodeBlock().run())}
                >
                  Code block
                </button>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => run(() => editor.chain().focus().setHorizontalRule().run())}
                >
                  Divider
                </button>
              </Popover>
            )}
          </div>
        </div>
      )}

      {prompt !== 'none' && (
        <Dialog title={prompt === 'link' ? 'Add link' : 'Add image'} onClose={() => setPrompt('none')}>
          <form onSubmit={submitPrompt}>
            <input
              autoFocus
              value={promptValue}
              onChange={(event) => setPromptValue(event.target.value)}
              placeholder={prompt === 'link' ? 'https://' : 'Image URL'}
              className="w-full rounded-[10px] border border-border-subtle px-3 py-2.5 text-sm outline-none focus:border-fg-placeholder"
            />
            <div className="mt-3.5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-[10px] border-0 bg-surface-muted px-3.5 py-2 font-bold"
                onClick={() => setPrompt('none')}
              >
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Insert
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  )
}

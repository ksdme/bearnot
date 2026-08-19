import { parseNote, serializeNote, slugify, extractInlineTags, extractTitle } from './parse'
import { NOTES_DIR, type Note, type NoteMeta } from './types'
import type { FileStorageAdapter } from '../storage/types'

async function uniquePath(storage: FileStorageAdapter, title: string): Promise<string> {
  const base = slugify(title)
  let candidate = `${NOTES_DIR}/${base}.md`
  let i = 2
  while (await storage.exists(candidate)) {
    candidate = `${NOTES_DIR}/${base}-${i}.md`
    i += 1
  }
  return candidate
}

async function collectNotes(storage: FileStorageAdapter, dir: string): Promise<Note[]> {
  const entries = await storage.readdir(dir)
  const notes: Note[] = []
  for (const entry of entries) {
    if (entry.kind === 'directory') {
      notes.push(...(await collectNotes(storage, entry.path)))
      continue
    }
    if (!entry.name.endsWith('.md')) continue
    const raw = await storage.readFile(entry.path)
    notes.push(parseNote(entry.path, raw, { ctime: entry.ctime, mtime: entry.mtime }))
  }
  return notes
}

export async function listNotes(storage: FileStorageAdapter): Promise<Note[]> {
  if (!(await storage.exists(NOTES_DIR))) {
    await storage.mkdir(NOTES_DIR)
  }
  return collectNotes(storage, NOTES_DIR)
}

export async function readNote(storage: FileStorageAdapter, path: string): Promise<Note> {
  const raw = await storage.readFile(path)
  const stat = await storage.stat(path)
  return parseNote(path, raw, { ctime: stat.ctime, mtime: stat.mtime })
}

export async function writeNote(
  storage: FileStorageAdapter,
  note: Pick<Note, 'path' | 'body' | 'pinned' | 'archived' | 'trashed' | 'locked' | 'created'> & {
    modified?: string
    tags?: string[]
  },
): Promise<Note> {
  const now = new Date().toISOString()
  const tags = [...new Set([...(note.tags ?? []), ...extractInlineTags(note.body)])]
  const meta: NoteMeta = {
    tags,
    pinned: note.pinned,
    archived: note.archived,
    trashed: note.trashed,
    locked: note.locked,
    created: note.created,
    modified: note.modified ?? now,
  }
  const raw = serializeNote(meta, note.body)
  await storage.writeFile(note.path, raw)
  const stat = await storage.stat(note.path)
  return parseNote(note.path, raw, { ctime: stat.ctime, mtime: stat.mtime })
}

export async function createNote(
  storage: FileStorageAdapter,
  input: { title?: string; body?: string } = {},
): Promise<Note> {
  const title = input.title?.trim() || 'Untitled'
  const path = await uniquePath(storage, title)
  const now = new Date().toISOString()
  const body = input.body?.trim() ? input.body : '# \n\n'
  return writeNote(storage, {
    path,
    body,
    pinned: false,
    archived: false,
    trashed: false,
    locked: false,
    created: now,
    modified: now,
    tags: extractInlineTags(body),
  })
}

export async function duplicateNote(storage: FileStorageAdapter, note: Note): Promise<Note> {
  const title = `${extractTitle(note.body)} copy`
  const body = note.body.replace(/^(#[ \t]+).+$/m, `# ${title}`)
  return createNote(storage, { title, body })
}

export async function destroyNote(storage: FileStorageAdapter, path: string): Promise<void> {
  await storage.deleteFile(path)
}

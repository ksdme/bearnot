import type { FileStat, FileStorageAdapter } from './types'

type MemoryNode =
  | { kind: 'directory'; ctime: number; mtime: number }
  | { kind: 'file'; content: string; ctime: number; mtime: number }

function normalize(path: string): string {
  const trimmed = path.trim() || '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const collapsed = withSlash.replace(/\/+/g, '/')
  if (collapsed === '/') return '/'
  return collapsed.replace(/\/$/, '')
}

function parentOf(path: string): string {
  const normalized = normalize(path)
  const idx = normalized.lastIndexOf('/')
  if (idx <= 0) return '/'
  return normalized.slice(0, idx)
}

function baseName(path: string): string {
  const normalized = normalize(path)
  const idx = normalized.lastIndexOf('/')
  return idx === -1 ? normalized : normalized.slice(idx + 1)
}

export class MemoryFileStorage implements FileStorageAdapter {
  private nodes = new Map<string, MemoryNode>()

  constructor() {
    const now = Date.now()
    this.nodes.set('/', { kind: 'directory', ctime: now, mtime: now })
  }

  async exists(path: string): Promise<boolean> {
    return this.nodes.has(normalize(path))
  }

  async stat(path: string): Promise<FileStat> {
    const normalized = normalize(path)
    const node = this.nodes.get(normalized)
    if (!node) {
      throw new Error(`ENOENT: ${normalized}`)
    }
    return this.toStat(normalized, node)
  }

  async readFile(path: string): Promise<string> {
    const normalized = normalize(path)
    const node = this.nodes.get(normalized)
    if (!node) throw new Error(`ENOENT: ${normalized}`)
    if (node.kind !== 'file') throw new Error(`EISDIR: ${normalized}`)
    return node.content
  }

  async writeFile(path: string, content: string): Promise<void> {
    const normalized = normalize(path)
    const parent = parentOf(normalized)
    await this.ensureDir(parent)
    const now = Date.now()
    const existing = this.nodes.get(normalized)
    if (existing?.kind === 'directory') {
      throw new Error(`EISDIR: ${normalized}`)
    }
    this.nodes.set(normalized, {
      kind: 'file',
      content,
      ctime: existing?.ctime ?? now,
      mtime: now,
    })
    this.touch(parent, now)
  }

  async deleteFile(path: string): Promise<void> {
    const normalized = normalize(path)
    const node = this.nodes.get(normalized)
    if (!node) throw new Error(`ENOENT: ${normalized}`)
    if (node.kind === 'directory') {
      const prefix = normalized === '/' ? '/' : `${normalized}/`
      for (const key of [...this.nodes.keys()]) {
        if (key !== normalized && (normalized === '/' || key.startsWith(prefix))) {
          this.nodes.delete(key)
        }
      }
    }
    this.nodes.delete(normalized)
    this.touch(parentOf(normalized), Date.now())
  }

  async readdir(path: string): Promise<FileStat[]> {
    const normalized = normalize(path)
    const node = this.nodes.get(normalized)
    if (!node) throw new Error(`ENOENT: ${normalized}`)
    if (node.kind !== 'directory') throw new Error(`ENOTDIR: ${normalized}`)

    const prefix = normalized === '/' ? '/' : `${normalized}/`
    const children: FileStat[] = []
    for (const [key, child] of this.nodes) {
      if (key === normalized) continue
      if (!key.startsWith(prefix)) continue
      const rest = key.slice(prefix.length)
      if (!rest || rest.includes('/')) continue
      children.push(this.toStat(key, child))
    }
    children.sort((a, b) => a.name.localeCompare(b.name))
    return children
  }

  async mkdir(path: string): Promise<void> {
    await this.ensureDir(normalize(path))
  }

  async rename(from: string, to: string): Promise<void> {
    const source = normalize(from)
    const dest = normalize(to)
    const node = this.nodes.get(source)
    if (!node) throw new Error(`ENOENT: ${source}`)
    if (this.nodes.has(dest)) throw new Error(`EEXIST: ${dest}`)
    await this.ensureDir(parentOf(dest))
    this.nodes.set(dest, { ...node, mtime: Date.now() })
    this.nodes.delete(source)
  }

  /** Test helper: snapshot of every file path → contents. */
  dump(): Record<string, string> {
    const files: Record<string, string> = {}
    for (const [path, node] of this.nodes) {
      if (node.kind === 'file') files[path] = node.content
    }
    return files
  }

  private async ensureDir(path: string): Promise<void> {
    const normalized = normalize(path)
    const parts = normalized.split('/').filter(Boolean)
    let cursor = '/'
    const now = Date.now()
    if (!this.nodes.has('/')) {
      this.nodes.set('/', { kind: 'directory', ctime: now, mtime: now })
    }
    for (const part of parts) {
      cursor = cursor === '/' ? `/${part}` : `${cursor}/${part}`
      const existing = this.nodes.get(cursor)
      if (!existing) {
        this.nodes.set(cursor, { kind: 'directory', ctime: now, mtime: now })
      } else if (existing.kind !== 'directory') {
        throw new Error(`ENOTDIR: ${cursor}`)
      }
    }
  }

  private touch(path: string, now: number) {
    const node = this.nodes.get(normalize(path))
    if (node) node.mtime = now
  }

  private toStat(path: string, node: MemoryNode): FileStat {
    return {
      path,
      name: path === '/' ? '/' : baseName(path),
      kind: node.kind,
      size: node.kind === 'file' ? new TextEncoder().encode(node.content).length : 0,
      ctime: node.ctime,
      mtime: node.mtime,
    }
  }
}

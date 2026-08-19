import type { Note, TagNode } from './types'

export function parentTags(tag: string): string[] {
  const parts = tag.split('/').filter(Boolean)
  const acc: string[] = []
  const paths: string[] = []
  for (const part of parts) {
    acc.push(part)
    paths.push(acc.join('/'))
  }
  return paths
}

export function buildTagTree(notes: Note[]): TagNode[] {
  const counts = new Map<string, number>()
  for (const note of notes) {
    if (note.archived || note.trashed) continue
    const expanded = new Set<string>()
    for (const tag of note.tags) {
      for (const path of parentTags(tag)) expanded.add(path)
    }
    for (const path of expanded) {
      counts.set(path, (counts.get(path) ?? 0) + 1)
    }
  }

  type Mutable = TagNode & { map: Map<string, Mutable> }
  const root: Mutable[] = []
  const index = new Map<string, Mutable>()

  const sorted = [...counts.keys()].sort((a, b) => a.localeCompare(b))
  for (const path of sorted) {
    const parts = path.split('/')
    const name = parts[parts.length - 1]
    const node: Mutable = {
      name,
      path,
      count: counts.get(path) ?? 0,
      children: [],
      map: new Map(),
    }
    index.set(path, node)
    if (parts.length === 1) {
      root.push(node)
      continue
    }
    const parentPath = parts.slice(0, -1).join('/')
    const parent = index.get(parentPath)
    if (parent) {
      parent.children.push(node)
      parent.map.set(name, node)
    } else {
      root.push(node)
    }
  }

  const strip = (nodes: Mutable[]): TagNode[] =>
    nodes.map((node) => ({
      name: node.name,
      path: node.path,
      count: node.count,
      children: strip(node.children as Mutable[]),
    }))

  return strip(root)
}

export function noteHasTag(note: Note, tagPath: string): boolean {
  return note.tags.some((tag) => tag === tagPath || tag.startsWith(`${tagPath}/`))
}

export const TAG_ICONS: Record<string, string> = {
  bear: 'paw',
  animals: 'paw',
  health: 'heart',
  travel: 'plane',
  code: 'code',
  science: 'flask',
  work: 'briefcase',
  personal: 'user',
  family: 'home',
  food: 'utensils',
  recipe: 'utensils',
  books: 'book',
  journal: 'book',
  ideas: 'lightbulb',
}

export function iconForTag(path: string): string {
  const leaf = path.split('/').at(-1) ?? path
  return TAG_ICONS[leaf] ?? 'hash'
}

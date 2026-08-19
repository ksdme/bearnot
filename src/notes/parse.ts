import type { Note, NoteMeta } from './types'

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
export const HASHTAG_RE =
  /(?<![\p{L}\p{N}_/])#(?:[\p{L}][\p{L}\p{N}_-]*)(?:\/[\p{L}][\p{L}\p{N}_-]*)*/gu
const TODO_RE = /^\s*[-*]\s+\[[ xX]\]/m
const IMAGE_RE = /!\[[^\]]*]\(([^)]+)\)/

export function splitFrontmatter(raw: string): { yaml: string | null; body: string } {
  const match = FRONTMATTER_RE.exec(raw)
  if (!match) return { yaml: null, body: raw }
  return { yaml: match[1], body: raw.slice(match[0].length) }
}

function unquote(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseScalar(value: string): string | boolean | string[] {
  const trimmed = value.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((part) => unquote(part))
      .filter(Boolean)
  }
  return unquote(trimmed)
}

function parseSimpleYaml(yaml: string): Record<string, string | boolean | string[]> {
  const data: Record<string, string | boolean | string[]> = {}
  const lines = yaml.split(/\r?\n/)
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith('#')) {
      i += 1
      continue
    }
    const kv = /^([\w-]+):\s*(.*)$/.exec(line)
    if (!kv) {
      i += 1
      continue
    }
    const key = kv[1]
    const rest = kv[2]
    if (rest === '' || rest === '|' || rest === '>') {
      const items: string[] = []
      i += 1
      while (i < lines.length) {
        const item = /^\s+-\s+(.*)$/.exec(lines[i])
        if (!item) break
        items.push(unquote(item[1]))
        i += 1
      }
      data[key] = items
      continue
    }
    data[key] = parseScalar(rest)
    i += 1
  }
  return data
}

export function extractInlineTags(body: string): string[] {
  const withoutCode = body.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ')
  const tags = new Set<string>()
  const regex = new RegExp(HASHTAG_RE.source, HASHTAG_RE.flags)
  for (const match of withoutCode.matchAll(regex)) {
    tags.add(match[0].slice(1).toLowerCase())
  }
  return [...tags]
}

export function extractTitle(body: string): string {
  const heading = /^(?:#[ \t]+)(.+)$/m.exec(body)
  if (heading) {
    return heading[1].replace(/[*_`]/g, '').trim() || 'Untitled'
  }
  const first = body
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)
  if (!first) return 'Untitled'
  return first.replace(/^#+\s*/, '').trim() || 'Untitled'
}

export function extractSnippet(body: string): string {
  const withoutTitle = body.replace(/^(?:#[ \t]+).+(?:\n+)?/m, '')
  const text = withoutTitle
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/[*_~`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, 180)
}

export function extractImageUrl(body: string): string | null {
  const match = IMAGE_RE.exec(body)
  return match?.[1] ?? null
}

function asStringArray(value: string | boolean | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item))
  if (typeof value === 'string' && value) return [value]
  return []
}

function asBool(value: string | boolean | string[] | undefined, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function asString(value: string | boolean | string[] | undefined, fallback: string): string {
  if (typeof value === 'string' && value) return value
  return fallback
}

export function parseMeta(yaml: string | null, fallback: { created: string; modified: string }): NoteMeta {
  const data = yaml ? parseSimpleYaml(yaml) : {}
  return {
    tags: asStringArray(data.tags).map((tag) => tag.replace(/^#/, '').toLowerCase()),
    pinned: asBool(data.pinned),
    archived: asBool(data.archived),
    trashed: asBool(data.trashed),
    locked: asBool(data.locked),
    created: asString(data.created, fallback.created),
    modified: asString(data.modified, fallback.modified),
  }
}

export function serializeNote(meta: NoteMeta, body: string): string {
  const tags = [...new Set(meta.tags.map((tag) => tag.replace(/^#/, '').toLowerCase()))]
  const yamlLines = [
    '---',
    ...(tags.length ? ['tags:', ...tags.map((tag) => `  - ${tag}`)] : ['tags: []']),
    `pinned: ${meta.pinned}`,
    `archived: ${meta.archived}`,
    `trashed: ${meta.trashed}`,
    `locked: ${meta.locked}`,
    `created: ${meta.created}`,
    `modified: ${meta.modified}`,
    '---',
    '',
  ]
  const normalizedBody = body.replace(/^\n+/, '')
  return `${yamlLines.join('\n')}${normalizedBody.endsWith('\n') ? normalizedBody : `${normalizedBody}\n`}`
}

export function parseNote(
  path: string,
  raw: string,
  timestamps: { ctime: number; mtime: number },
): Note {
  const { yaml, body } = splitFrontmatter(raw)
  const meta = parseMeta(yaml, {
    created: new Date(timestamps.ctime).toISOString(),
    modified: new Date(timestamps.mtime).toISOString(),
  })
  const inlineTags = extractInlineTags(body)
  const tags = [...new Set([...meta.tags, ...inlineTags])]
  const filename = path.slice(path.lastIndexOf('/') + 1)

  return {
    path,
    filename,
    title: extractTitle(body),
    body,
    raw,
    tags,
    pinned: meta.pinned,
    archived: meta.archived,
    trashed: meta.trashed,
    locked: meta.locked,
    created: meta.created,
    modified: meta.modified,
    snippet: extractSnippet(body),
    imageUrl: extractImageUrl(body),
    hasTodo: TODO_RE.test(body),
  }
}

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'note'
}

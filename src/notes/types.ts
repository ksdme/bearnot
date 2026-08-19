export const NOTES_DIR = '/notes'

export type Note = {
  path: string
  filename: string
  title: string
  body: string
  raw: string
  tags: string[]
  pinned: boolean
  archived: boolean
  trashed: boolean
  locked: boolean
  created: string
  modified: string
  snippet: string
  imageUrl: string | null
  hasTodo: boolean
}

export type NoteMeta = {
  tags: string[]
  pinned: boolean
  archived: boolean
  trashed: boolean
  locked: boolean
  created: string
  modified: string
}

export type TagNode = {
  name: string
  path: string
  count: number
  children: TagNode[]
}

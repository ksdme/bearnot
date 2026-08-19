import { NOTES_DIR } from './types'

export function noteTreePath(notePath: string): string {
  const prefix = `${NOTES_DIR}/`
  if (notePath.startsWith(prefix)) return notePath.slice(prefix.length)
  return notePath.replace(/^\//, '')
}

export function treePathToNotePath(treePath: string): string {
  return `${NOTES_DIR}/${treePath}`
}

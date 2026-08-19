/**
 * Filesystem-shaped storage used by the notes layer.
 *
 * The client only talks to this interface. Swap `MemoryFileStorage`
 * for a disk or remote adapter later without changing the editor.
 */
export type FileKind = 'file' | 'directory'

export type FileStat = {
  path: string
  name: string
  kind: FileKind
  size: number
  ctime: number
  mtime: number
}

export interface FileStorageAdapter {
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  deleteFile(path: string): Promise<void>
  exists(path: string): Promise<boolean>
  stat(path: string): Promise<FileStat>
  readdir(path: string): Promise<FileStat[]>
  mkdir(path: string): Promise<void>
  rename(from: string, to: string): Promise<void>
}

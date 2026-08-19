import { Extension } from '@tiptap/core'
import type { Node } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { HASHTAG_RE } from '../notes/parse'

function hashtagDecorations(doc: Node): DecorationSet {
  const decorations: Decoration[] = []
  doc.descendants((node, pos) => {
    if (node.type.name === 'codeBlock') return false
    if (!node.isText || !node.text) return
    if (node.marks.some((mark) => mark.type.name === 'code')) return
    const regex = new RegExp(HASHTAG_RE.source, HASHTAG_RE.flags)
    for (const match of node.text.matchAll(regex)) {
      const from = pos + (match.index ?? 0)
      const to = from + match[0].length
      decorations.push(Decoration.inline(from, to, { class: 'hashtag' }))
    }
  })
  return DecorationSet.create(doc, decorations)
}

export const HashtagHighlight = Extension.create({
  name: 'hashtagHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('hashtagHighlight'),
        state: {
          init: (_, state) => hashtagDecorations(state.doc),
          apply: (tr, old) => (tr.docChanged ? hashtagDecorations(tr.doc) : old),
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})

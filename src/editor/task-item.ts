import { InputRule } from '@tiptap/core'
import TaskItem from '@tiptap/extension-task-item'
import type { Node as PMNode, Schema } from '@tiptap/pm/model'
import { Fragment } from '@tiptap/pm/model'
import { TextSelection, type Transaction } from '@tiptap/pm/state'
import { findWrapping } from '@tiptap/pm/transform'

/**
 * Matches `[ ]` / `[x]`, optionally after a markdown list marker.
 * `- ` is consumed by the bullet-list rule first, so the remaining `[ ]`
 * has to convert a list item — wrapping a paragraph cannot do that.
 */
const taskItemInputRegex = /^\s*(?:[-+*]\s+)?(\[([( |x])?\])\s*$/

function convertListItemToTaskItem(tr: Transaction, pos: number, checked: boolean, schema: Schema): boolean {
  const $pos = tr.doc.resolve(pos)
  const taskItemType = schema.nodes.taskItem
  const taskListType = schema.nodes.taskList
  const parent = $pos.node(-1)

  if (parent.type === taskItemType) {
    if (checked && !parent.attrs.checked) {
      tr.setNodeMarkup($pos.before(-1), undefined, { ...parent.attrs, checked: true })
    }
    return true
  }

  if (parent.type.name === 'listItem') {
    const list = $pos.node(-2)
    if (list.type.name !== 'bulletList' && list.type.name !== 'orderedList') return false

    const itemIndex = $pos.index(-2)
    const listPos = $pos.before(-2)
    const beforeItems: PMNode[] = []
    const afterItems: PMNode[] = []
    list.forEach((child, _offset, index) => {
      if (index < itemIndex) beforeItems.push(child)
      if (index > itemIndex) afterItems.push(child)
    })

    const replacement: PMNode[] = []
    if (beforeItems.length) replacement.push(list.copy(Fragment.from(beforeItems)))
    replacement.push(taskListType.create(null, taskItemType.create({ checked }, parent.content)))
    if (afterItems.length) replacement.push(list.copy(Fragment.from(afterItems)))

    tr.replaceWith(listPos, listPos + list.nodeSize, Fragment.from(replacement))
    const cursorPos = listPos + (beforeItems.length ? list.copy(Fragment.from(beforeItems)).nodeSize : 0) + 3
    tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(cursorPos, tr.doc.content.size))))
    return true
  }

  const range = $pos.blockRange()
  if (!range) return false
  const wrapping = findWrapping(range, taskItemType, { checked })
  if (!wrapping) return false
  tr.wrap(range, wrapping)
  return true
}

export function convertListToTaskList(tr: Transaction, listPos: number, schema: Schema): boolean {
  const list = tr.doc.nodeAt(listPos)
  if (!list || (list.type.name !== 'bulletList' && list.type.name !== 'orderedList')) return false

  const items: PMNode[] = []
  list.forEach((item) => {
    items.push(schema.nodes.taskItem.create({ checked: false }, item.content, item.marks))
  })
  tr.replaceWith(listPos, listPos + list.nodeSize, schema.nodes.taskList.create(null, items, list.marks))
  return true
}

export const EditorTaskItem = TaskItem.extend({
  addInputRules() {
    return [
      new InputRule({
        find: taskItemInputRegex,
        handler: ({ state, range, match }) => {
          const checked = match[match.length - 1] === 'x'
          const tr = state.tr.delete(range.from, range.to)
          const pos = tr.mapping.map(range.from)
          if (!convertListItemToTaskItem(tr, pos, checked, state.schema)) return null
        },
      }),
    ]
  },
})

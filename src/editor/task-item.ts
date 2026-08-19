import { InputRule } from '@tiptap/core'
import TaskItem from '@tiptap/extension-task-item'

/**
 * Matches `[ ]` / `[x]` at the start of a textblock.
 * The default TaskItem rule only wraps a paragraph, so typing `- [ ]`
 * first becomes a bullet list and then fails to turn into a checkbox.
 */
const taskItemInputRegex = /^\s*(\[([( |x])?\])\s*$/

export const EditorTaskItem = TaskItem.extend({
  addInputRules() {
    return [
      new InputRule({
        find: taskItemInputRegex,
        handler: ({ state, range, match, chain }) => {
          const checked = match[match.length - 1] === 'x'
          const inListItem = state.doc.resolve(range.from).node(-1)?.type.name === 'listItem'

          const applied = chain()
            .deleteRange(range)
            .command(({ commands }) => (inListItem ? commands.liftListItem('listItem') : true))
            .toggleTaskList()
            .command(({ commands }) =>
              checked ? commands.updateAttributes(this.name, { checked: true }) : true,
            )
            .run()

          if (!applied) return null
        },
      }),
    ]
  },
})

import TaskList from '@tiptap/extension-task-list'
import { convertListToTaskList } from './task-item'

export const EditorTaskList = TaskList.extend({
  addCommands() {
    return {
      toggleTaskList:
        () =>
        ({ state, dispatch, commands, tr }) => {
          const { $from } = state.selection

          for (let depth = $from.depth; depth > 0; depth -= 1) {
            const node = $from.node(depth)
            if (node.type.name === this.name) {
              return commands.liftListItem(this.options.itemTypeName)
            }
            if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
              if (!dispatch) return true
              convertListToTaskList(tr, $from.before(depth), state.schema)
              dispatch(tr)
              return true
            }
          }

          return commands.toggleList(this.name, this.options.itemTypeName)
        },
    }
  },
})

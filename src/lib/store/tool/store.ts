import { GridStack } from 'gridstack'
import { createStore } from 'zustand/vanilla'

export type ToolState = {
  tool?:{
    icon?: string,
    name?: string,
    linkTo?: string,
  },
  note?: {
    noteContent?: string,
    isNote?: boolean,
 }
 pack?: {
   packName?: string,
   packList?: string[],
 }
 gridStack?: React.RefObject<GridStack | null>,
}

export type ToolActions = {
  updateTool: (tool : ToolState['tool'], callback?: () => void) => void
  updatePack: (pack: ToolState['pack']) => void
  updateNote: (note: ToolState['note']) => void
  updateGridRef: (gridRef: ToolState['gridStack']) => void
}

export type ToolStore = ToolState & ToolActions

export const defaultInitState: ToolState = {

}

export const createToolStore = (initState: ToolState = defaultInitState) => {
  return createStore<ToolStore>()((set) => ({
    ...initState,
    updateTool: (tool, callback) => {set(() => ({ tool })); if (callback) callback();},
    updatePack: (pack) => set(() => ({ pack })),
    updateNote: (note) => set(() => ({ note })),
    updateGridRef: (gridStack) => set(() => ({ gridStack })),
  }))
}
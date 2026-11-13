import { GridStack } from 'gridstack'
import { createStore } from 'zustand/vanilla'

export type Tool = {
  id: string,
    icon_tool?: string,
    name_tool: string,
    link_tool?: string,
    position: {
      x: number,
      y: number,
    }
  }

export type ToolState = {
  tools?:Tool[],
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
  addTools: (tools : ToolState['tools'], callback?: () => void) => void
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
    addTools: (tools, callback) => {set((state) => ({ tools: [...(state.tools ? state.tools : []), ...(tools ? tools : [])] })); if (callback) callback();},
    updatePack: (pack) => set(() => ({ pack })),
    updateNote: (note) => set(() => ({ note })),
    updateGridRef: (gridStack) => set(() => ({ gridStack })),
  }))
}
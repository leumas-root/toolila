// src/providers/counter-store-provider.tsx
'use client'

import { type ReactNode, createContext, useState, useContext } from 'react'
import { useStore } from 'zustand'

import { type ToolStore, createToolStore } from './store'

export type ToolStoreApi = ReturnType<typeof createToolStore>

export const ToolStoreContext = createContext<ToolStoreApi | undefined>(undefined)

export interface ToolStoreProviderProps {
  children: ReactNode
}

export const ToolStoreProvider = ({ children }: ToolStoreProviderProps) => {
  const [store] = useState(() => createToolStore())
  return <ToolStoreContext.Provider value={store}>{children}</ToolStoreContext.Provider>
}

export const useToolStore = <T,>(selector: (store: ToolStore) => T): T => {
  const toolStoreContext = useContext(ToolStoreContext)
  if (!toolStoreContext) {
    throw new Error(`useToolStore must be used within ToolStoreProvider`)
  }

  return useStore(toolStoreContext, selector)
}
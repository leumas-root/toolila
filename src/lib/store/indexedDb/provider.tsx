// src/providers/ClientDb-store-provider.tsx
'use client'

import { type ReactNode, createContext, useState, useContext } from 'react'
import { useStore } from 'zustand'

import { type ClientDbStore, createClientDbStore } from './store'

export type ClientDbStoreApi = ReturnType<typeof createClientDbStore>

export const ClientDbStoreContext = createContext<ClientDbStoreApi | undefined>(undefined)

export interface ClientDbStoreProviderProps {
  children: ReactNode
}

export const ClientDbStoreProvider = ({ children }: ClientDbStoreProviderProps) => {
  const [store] = useState(() => createClientDbStore())
  return <ClientDbStoreContext.Provider value={store}>{children}</ClientDbStoreContext.Provider>
}

export const useClientDbStore = <T,>(selector: (store: ClientDbStore<unknown>) => T): T => {
  const clientDbStoreContext = useContext(ClientDbStoreContext)
  if (!clientDbStoreContext) {
    throw new Error(`useClientDbStore must be used within ClientDbStoreProvider`)
  }

  return useStore(clientDbStoreContext, selector)
}
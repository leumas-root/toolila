// src/providers/counter-store-provider.tsx
'use client'

import { type ReactNode, createContext, useState, useContext } from 'react'
import { useStore } from 'zustand'

import { type CounterStore, createCounterStore } from './store'

export type CounterStoreApi = ReturnType<typeof createCounterStore>

export const CounterStoreContext = createContext<CounterStoreApi | undefined>(undefined)

export interface CounterStoreProviderProps {
  children: ReactNode
}

export const CounterStoreProvider = ({ children }: CounterStoreProviderProps) => {
  const [store] = useState(() => createCounterStore())
  return <CounterStoreContext.Provider value={store}>{children}</CounterStoreContext.Provider>
}

export const useCounterStore = <T,>(selector: (store: CounterStore) => T): T => {
  const counterStoreContext = useContext(CounterStoreContext)
  if (!counterStoreContext) {
    throw new Error(`useCounterStore must be used within CounterStoreProvider`)
  }

  return useStore(counterStoreContext, selector)
}
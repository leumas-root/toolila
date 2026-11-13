import { createStore } from 'zustand/vanilla'

export type ClientDbState<T = unknown> = {
  db: IDBDatabase | null;
  tools? : (T&{location : 'local' | null})[],
  toolsKeys? : string[],
  value?: T[]
}

export type ClientDbActions<T = unknown> = {
  setDb: (db: IDBDatabase | null) => void
  setValue: (value: T[]) => void,
  setKeysList : (value?: string[]) => void
}

export type ClientDbStore<T = unknown> = ClientDbState<T> & ClientDbActions<T>

export const defaultInitState: ClientDbState<never> = {
  db: null
}

export const createClientDbStore = <T = unknown>(
  initState: ClientDbState<T> = defaultInitState,
) => {
  return createStore<ClientDbStore<T>>()((set) => ({
    ...initState,
    setDb: (db) => set({ db }),
    setValue: (value) => set({ value }),
    setKeysList : (value)=>{
      if (!value) return
      set((state)=>({...state, toolsKeys : value}))
    }
  }))  
}
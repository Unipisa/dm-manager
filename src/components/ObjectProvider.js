import { createContext, useContext } from 'react'

import { useEngine } from '../Engine'
import Loading from './Loading'

export const ObjectContext = createContext('object')

export function ObjectProvider({ path, id, children }) {
  const engine = useEngine()
  const query = engine.useGet(path, id)

  if (query.isError) return <div>errore caricamento</div>
  if (!query.isSuccess) return <Loading />

  return (
    <ObjectContext.Provider value={ query.data }>
      {children}
    </ObjectContext.Provider>
  )
}

export function useObject() {
  return useContext(ObjectContext)
}
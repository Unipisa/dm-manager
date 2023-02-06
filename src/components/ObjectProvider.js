import { createContext, useContext } from 'react'

import { useEngine } from '../Engine'
import Loading from './Loading'

export const ObjectContext = createContext('object')

export function ObjectProvider({ Model, path, id, children }) {
  const engine = useEngine()
  const query = engine.useGet(path || Model.code, id)

  if (query.isError) return <div>errore caricamento</div>
  if (!query.isSuccess) return <Loading />

  return (
    <ObjectContext.Provider value={ { obj: query.data, Model: Model } }>
      {children}
    </ObjectContext.Provider>
  )
}

export function useObject() {
  return useContext(ObjectContext).obj
}

export function useModel() {
  return useContext(ObjectContext).Model
}
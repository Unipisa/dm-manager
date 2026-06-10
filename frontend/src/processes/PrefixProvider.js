import { createContext, useContext } from 'react'

const PrefixContext = createContext('')

export function usePrefix() {
    return useContext(PrefixContext)
}

export const PrefixProvider = PrefixContext.Provider

import { createContext, useContext } from 'react'

const PrefixContext = createContext("/api/v0")

export function usePrefix() {
    return useContext(PrefixContext)
}

export const PrefixProvider = PrefixContext.Provider

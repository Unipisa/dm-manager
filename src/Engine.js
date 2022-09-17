import { useState } from 'react'

let common_state = {
    counter: 0,
    messages: []
}

class Engine {
    constructor(state, setState) {
        this.state = state
        this.setState = setState
    }

    click() { 
        this.setState( s => { 
            console.log(`click ${s.counter} -> ${s.counter+1}`)
            return {
                ...s, counter: s.counter+1
            }})
    }

    addMessage(message, type='error') {
        this.setState( s => ({
            ...s,
            messages: [...s.messages, [type, message]]
        }))
    }

    addErrorMessage(message) { this.addMessage(message, 'error')}
    addInfoMessage(message) { this.addMessage(message, 'info' )}
    addWarningMessage(message) { this.addMessage(message, 'warning' )}

    messages() {
        return this.state.messages
    }

    clearMessages() {
        this.setState( s => ({
            ...s,
            messages: []
        }))
    }
}

export default function useEngine(initial_state) {
    return new Engine(...useState(initial_state || common_state))
}
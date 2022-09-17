import { useState } from 'react'
import { Container } from 'react-bootstrap'
import Card from 'react-bootstrap/Card'

import Click from './Click'

function LoginPage({ engine }) {
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ waiting, setWaiting ] = useState(false)
    const [ error, setError ] = useState(null)

    async function login(email, password) {
        setError(null)
        setWaiting(true)
        try {
            await engine.login(email, password)
        } catch(error) {
          console.error(error)
          setError(`Login error: ${error.message}`)
          setWaiting(false)
        }
      }
        
    return (
        <Container>
            <div className="d-flex justify-content-center h-100">
                <Card>
                    <Card.Header>
                        <h3>Sign In</h3>
                    </Card.Header>
                    <Card.Body>
                    <form onSubmit={ (event) => {
                        login(email,password)
                        event.preventDefault()
                        }}
                    >
                        <div className={`alert alert-danger${error?"":" collapse"}`} role="alert">
                          { error }
                        </div>
                        <div>
                            <input value={ email } onChange={ evt => setEmail(evt.target.value) } id="email" className="form-control" />
                            <label className="form-label" htmlFor="email">Email address</label>
                        </div>

                        <div className="form-outline mb-4">
                            <input 
                                value={ password } 
                                onChange={ evt => setPassword(evt.target.value) } 
                                type="password" 
                                id="password" 
                                className="form-control" 
                                onKeyPress={ (event) => {
                                    if (event.key === "Enter") {                     
                                        login(email, password)
                                    }
                                }}
                                />
                            <label className="form-label" htmlFor="password">Password</label>
                        </div>

                        <button 
                            onClick={() => login(email, password)} 
                            disabled={waiting} 
                            type="button" 
                            className="btn btn-primary btn-block mb-4">Login
                        </button>
                        </form>
                        <div className="mb-4" />
                        <button onClick={ engine.start_oauth2 }
                        className="btn btn-primary btn-block mb-4">
                            UNIPI login
                        </button>
                    </Card.Body>
                </Card>
            </div>
            <Click engine={engine} />
        </Container>
    )
}

export default LoginPage
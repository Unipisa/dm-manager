import { useState } from 'react'
import { Card, Button } from 'react-bootstrap'

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
        <>
            <div className="d-flex justify-content-center h-100">
                <Card>
                    <Card.Header>
                        <h3>Sign In</h3>
                    </Card.Header>
                    <Card.Body>
                        {
                            engine.config.OAUTH2_ENABLED &&
                            <Button 
                                onClick={ () => engine.start_oauth2() }
                                className="btn-primary btn-lg btn-block">
                                Usa credenziali UNIPI
                            </Button>
                        }
                        <hr />
                    <div className="mb-4" />
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

                        <Button 
                            onClick={() => login(email, password)} 
                            disabled={waiting} 
                            type="button" 
                            className="btn btn-primary btn-block mb-4">Login
                        </Button>
                        </form>
                    </Card.Body>
                </Card>
            </div>
        </>
    )
}

export default LoginPage
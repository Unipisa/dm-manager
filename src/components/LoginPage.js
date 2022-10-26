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
            <div className="d-flex justify-content-center h-100 mt-5">
                <Card className="col-9 col-md-6 col-lg-3">
                    <Card.Header>
                        <h3>Sign In</h3>
                    </Card.Header>
                    <Card.Body>
                        {
                            engine.config.OAUTH2_ENABLED &&
                            <Button 
                                onClick={ () => engine.start_oauth2() }
                                className="btn-primary btn-lg btn-block w-100">
                                Credenziali UniPI
                            </Button>
                        }
                        <hr />
                    <div className="mb-4" />
                    <form onSubmit={ (event) => {
                        login(email,password)
                        event.preventDefault()
                        }}
                    >
                        <h4>Credenziali locali</h4>
                        <div className={`alert alert-danger${error?"":" collapse"}`} role="alert">
                          { error }
                        </div>
                        <div>
                            <input placeholder="Email address" value={ email } onChange={ evt => setEmail(evt.target.value) } id="email" className="form-control mb-2" ></input>
                        </div>

                        <div className="form-outline mb-4">
                            <input 
                                placeholder="Password"
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
                        </div>

                        <Button 
                            onClick={() => login(email, password)} 
                            disabled={waiting} 
                            type="button" 
                            className="btn btn-primary btn-block mb-2">Login
                        </Button>
                        </form>
                    </Card.Body>
                </Card>
            </div>
        </>
    )
}

export default LoginPage
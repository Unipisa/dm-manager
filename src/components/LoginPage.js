import { useState } from 'react'
import { Container } from 'react-bootstrap'
import Card from 'react-bootstrap/Card'

function LoginPage({ api, setUser }) {
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ waiting, setWaiting ] = useState(false)
    const [ error, setError ] = useState(null)

    async function login(email, password) {
        setError(null)
        try {
            const { user } = await api.login(email, password)
            setUser(user)
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
                    <form>
                        <div className={`alert alert-danger${error?"":" collapse"}`} role="alert">
                          { error }
                        </div>
                        <div>
                            <input value={ email } onChange={ evt => setEmail(evt.target.value) } type="email" id="email" className="form-control" />
                            <label className="form-label" htmlFor="email">Email address</label>
                        </div>

                        <div className="form-outline mb-4">
                            <input value={ password } onChange={ evt => setPassword(evt.target.value) } type="password" id="password" className="form-control" />
                            <label className="form-label" htmlFor="password">Password</label>
                        </div>

                        <button 
                            onClick={() => login(email, password)} 
                            disabled={waiting} 
                            type="button" 
                            className="btn btn-primary btn-block mb-4">Login
                        </button>

                        </form>                        
                    </Card.Body>
                </Card>
            </div>
        </Container>
    )
}

export default LoginPage
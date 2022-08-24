import { useState } from 'react'
import { Container } from 'react-bootstrap'
import Card from 'react-bootstrap/Card'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
//import CardHeader from 'react-bootstrap/CardHeader'

const prepend_style = {
    width: "50px",
    backgroundColor: "#FFC312",
    color: "black",
    border: "0 !important"
}

function LoginPage({ callback }) {
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    return (
        <Container>
            <div className="d-flex justify-content-center h-100">
                <Card>
                    <Card.Header>
                        <h3>Sign In</h3>
                    </Card.Header>
                    <Card.Body>
                    <form>
                        <div>
                            <input value={ email } onChange={ evt => setEmail(evt.target.value) } type="email" id="email" className="form-control" />
                            <label className="form-label" htmlFor="email">Email address</label>
                        </div>

                        <div className="form-outline mb-4">
                            <input value={ password } onChange={ evt => setPassword(evt.target.value) } type="password" id="password" className="form-control" />
                            <label className="form-label" htmlFor="password">Password</label>
                        </div>

                        <button onClick={ () => callback(email, password) } type="button" className="btn btn-primary btn-block mb-4">Login</button>

                        </form>                        
                    </Card.Body>
                </Card>
            </div>
        </Container>
    )
}

export default LoginPage
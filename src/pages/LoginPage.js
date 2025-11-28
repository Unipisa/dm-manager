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
        
    return  <div 
  className="min-vh-100 d-flex justify-content-center align-items-center"
  style={{
    background: "linear-gradient(135deg, #eef2f7 0%, #d7e6f7 100%)"
  }}
>
  <Card className="shadow rounded-lg-4 border-0 px-3 py-3"
        style={{ width: "100%", maxWidth: "440px" }}>

    <Card.Header className="bg-white border-0 text-center pb-3">
      <h3 className="fw-semibold mb-1">Sign In</h3>
      <div className="text-muted small">&mdash; manage.dm.unipi.it &mdash;</div>
    </Card.Header>


    <Card.Body className="px-2 px-sm-3">

      {engine.config.OAUTH2_ENABLED && (
        <>
          <Button
            onClick={engine.start_oauth2}
            className="btn-primary btn-lg w-100 mb-3 rounded-3"
          >
            Credenziali UniPI
          </Button>

          <div className="d-flex align-items-center my-3">
            <div className="flex-grow-1 border-bottom"></div>
            <span className="mx-2 text-muted small">or</span>
            <div className="flex-grow-1 border-bottom"></div>
          </div>
        </>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          login(email, password);
        }}
      >
        <h5 className="fw-semibold mb-3 text-center">Credenziali locali</h5>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        <div className="mb-3">
          <input
            id="email"
            type="email"
            placeholder="Email address"
            className="form-control form-control-lg rounded-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <input
            id="password"
            type="password"
            placeholder="Password"
            className="form-control form-control-lg rounded-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") login(email, password);
            }}
          />
        </div>

        <Button
          disabled={waiting}
          type="submit"
          className="btn btn-primary w-100 btn-lg rounded-3"
        >
          {waiting ? "Loading…" : "Login"}
        </Button>
      </form>
    </Card.Body>
  </Card>
</div>

}

export default LoginPage
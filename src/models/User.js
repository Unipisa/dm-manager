import Model from './Model'
import { useEngine } from '../Engine'
import { useState } from 'react'
import { Button, Form, Alert } from 'react-bootstrap'

const SetLocalPasswordForm = ({ userId }) => {
    const engine = useEngine()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [error, setError] = useState(null)

    const isAdmin = engine.user?.roles?.includes('admin')

    if (!isAdmin) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setMessage(null)
        if (newPassword !== confirmPassword) {
            setError('Le password non coincidono')
            return
        }
        if (newPassword.length < 8) {
            setError('La password deve essere di almeno 8 caratteri')
            return
        }
        setLoading(true)
        try {
            const res = await engine.api.post(`/api/v0/user/${userId}/setLocalPassword`, { newPassword })
            setMessage(res.message || 'Password locale impostata con successo')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            setError(err.message || 'Errore')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form onSubmit={handleSubmit} className="mt-2">
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            {message && <Alert variant="success" onClose={() => setMessage(null)} dismissible>{message}</Alert>}
            <Form.Group className="mb-2">
                <Form.Label>Nuova password</Form.Label>
                <Form.Control type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} required />
            </Form.Group>
            <Form.Group className="mb-2">
                <Form.Label>Conferma password</Form.Label>
                <Form.Control type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Salvataggio...' : 'Imposta o cambia password locale'}
            </Button>
        </Form>
    )
}

const UserAdditionalInfo = ({ obj }) => {
    const engine = useEngine()
    const { data, isLoading, isError } = engine.useGet(`user/${obj._id}/hasLocalPassword`)
    const [showForm, setShowForm] = useState(false)

    if (isLoading) return <div>Caricamento...</div>
    if (isError) return null

    const isAdmin = engine.user?.roles?.includes('admin')
    let label = data?.hasLocalPassword ? 'Cambia password' : 'Imposta password'

    return (
        <div>
            <strong>Password locale: </strong>
            {data?.hasLocalPassword 
                ? <span className="text-success">presente</span>
                : <span className="text-muted">non impostata</span>
            }
            {isAdmin && (
                <Button
                    size="sm"
                    variant="warning"
                    className="ms-2 mt-1"
                    onClick={() => setShowForm(v => !v)}
                >
                    {showForm ? 'Annulla' : label}
                </Button>
            )}
            {isAdmin && showForm && <SetLocalPasswordForm userId={obj._id} />}
        </div>
    )
}

export default class User extends Model {
    constructor() {
        super()
        this.code = 'user'
        this.ModelName = 'User'
        this.name = "utente"
        this.oa = "o"
        this.articulation = {
            'oggetto': "utente", 
            'oggetti': "utenti",
            'l\'oggetto': "l'utente",
            'gli oggetti': "gli utenti", 
            'un oggetto': "un utente", 
        }
        this.managerRoles = ['admin']
        this.indexDefaultFilter = { _sort: 'createdAt', _limit: 10 }
        this.columns = {
            'lastName': "cognome",
            'firstName': "nome",
            'username': "username",
            'email': "email",
            'roles': "ruoli",
            'updatedAt': "modificato",
        }
    }

    describe(obj) { return obj?.username }

    additionalInfo(obj) {
        return <UserAdditionalInfo obj={obj} />
    }
}


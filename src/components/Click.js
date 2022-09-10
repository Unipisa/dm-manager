import { Button } from 'react-bootstrap'

export default function Click({ api }) {
    return <Button onClick={api.click}>click {api._state.counter}</Button>
}
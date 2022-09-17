import { Button } from 'react-bootstrap'

export default function Click({ engine }) {
    return <Button onClick={engine.click}>click {engine.state.counter}</Button>
}
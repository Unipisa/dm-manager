import { Button } from 'react-bootstrap'

export default function Click({ counter, click }) {
    return <Button onClick={ click }>click { counter }</Button>
}
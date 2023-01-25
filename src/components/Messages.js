import { Button, Card, Container } from 'react-bootstrap'

export default function Messages({ messages, acknowledge }) {
    if (messages.length > 2) {
        messages = messages.slice(-2)
    }

    if (messages.length === 0) {
        return <></>;
    }

    const style = {
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: '100',
        minWidth: '300px',
        width: '40%'
    }

    return <Container className="my-4" style={style}>
                <Card className="border border-2 shadow bg-light">
                    <Card.Body>
                    <div className="d-flex justify-right">
                        <Button type="button" className="ms-auto btn-close" onClick={acknowledge} aria-label="Close"></Button>
                    </div>
                    { messages.map(([type, msg], i) =>
                        <div key={ i } className={'border-start border-3 ps-2 border-' + {
                                    'error': 'success',
                                    'warning': 'warning',
                                    'info': 'info',
                                }[type]}>
                            <p>{ msg }</p>
                        </div>
                    )}
                    
                    </Card.Body>
                </Card>
        </Container>
}
import { Button, ButtonGroup, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import { ModelOutputs } from './ModelInput'
import { useObject } from './ObjectProvider'
import Timestamps from './Timestamps'


export default function ModelView({Model, buttons, key}) {
    const obj = useObject()
    const navigate = useNavigate()
    if (!buttons) buttons = ['edit', 'clone', 'index']

    buttons = buttons.map(button => {
        switch(button) {
            case 'edit': return <Button 
                    key='edit'
                    onClick={ () => navigate('edit') }
                    className="btn-warning">
                    modifica
                </Button>
            case 'clone': return <Button
                    key='clone'
                    onClick={ () => navigate(`${Model.editUrl('new')}?clone=${obj._id}`) }
                    className="btn-primary">
                    duplica
                </Button>
            case 'index': return <Button 
                    key='index'
                    onClick={ () => navigate(Model.indexUrl()) }
                    className="btn btn-secondary">
                        torna all'elenco
                </Button>
            default: return button
        }
    })

    return <Card key={key}>
            <Card.Header>
                <h3>{ `${Model.name} ${Model.describe(obj)}` }</h3>
            </Card.Header>
            <Card.Body>
        <ModelOutputs 
                Model={Model} 
                obj={obj} 
            />
        <ButtonGroup>{buttons}</ButtonGroup>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={obj} />
            </Card.Footer>
    </Card>
}

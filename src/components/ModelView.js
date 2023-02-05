import { Button, ButtonGroup, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import { ModelOutputs } from './ModelInput'
import { useObject } from './ObjectProvider'
import Timestamps from './Timestamps'


export default function ModelView({Model}) {
    const obj = useObject()
    const navigate = useNavigate()

    return <>
        <Card>
            <Card.Header>
                <h3>{ `${Model.name} ${Model.describe(obj)}` }</h3>
            </Card.Header>
            <Card.Body>
        <ModelOutputs 
                schema={Model.schema.fields} 
                obj={obj} 
            />
        <ButtonGroup>
            <Button 
                onClick={ () => navigate('edit') }
                className="btn-warning">
                modifica
            </Button>
            <Button
                onClick={ () => navigate(`${Model.editUrl('new')}?clone=${obj._id}`) }
                className="btn-primary">
                duplica
            </Button>
            <Button 
                onClick={ () => navigate(Model.indexUrl()) }
                className="btn btn-secondary">
                    torna all'elenco
            </Button>
        </ButtonGroup>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={obj} />
            </Card.Footer>
        </Card>
    </>
}

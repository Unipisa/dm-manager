import { Button, ButtonGroup, Card } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'

import { ModelOutputs } from './ModelOutput'
import { useObject } from './ObjectProvider'
import Timestamps from './Timestamps'

export default function ModelView({ Model, buttons, key }) {
    buttons ??= ['edit', 'clone', 'index']
    const location = useLocation()

    const buttonComponents = {
        edit: () => (
            <Button key='edit' className="btn-warning" onClick={() => navigate('edit', { 
                state: { fromApp: location.state?.fromApp }
            })}>
                modifica
            </Button>
        ),
        clone: () => (
            <Button key='clone' className="btn-primary" onClick={() => navigate(`${Model.editUrl('__new__')}?clone=${obj._id}`)}>
                duplica
            </Button>
        ),
        index: () => (
            <Button key='index' className="btn btn-secondary" onClick={() => 
                location.state?.fromApp ? navigate(-1) : navigate(Model.indexUrl())
            }>
                torna all'elenco
            </Button>
        ),
    }
    
    const obj = useObject()
    const navigate = useNavigate()

    return (
        <Card key={key}>
            <Card.Header>
                <h3>{ `${Model.name} ${Model.describe(obj)}` }</h3>
            </Card.Header>
            <Card.Body>
                <ModelOutputs Model={Model} obj={obj} />
                <ButtonGroup>
                    {buttons.map(buttonNameOrCustom => {
                        if (buttonComponents[buttonNameOrCustom]) {
                            // render button component
                            return buttonComponents[buttonNameOrCustom]()
                        } else {
                            // fallback
                            return buttonNameOrCustom
                        }
                    })}
                </ButtonGroup>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={obj} />
            </Card.Footer>
        </Card>
    )
}

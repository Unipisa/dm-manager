import { Button, ButtonGroup } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import { ModelInputs } from './ModelInput'


export default function ModelView({Model, obj}) {
    const navigate = useNavigate()

    return <>
        <ModelInputs 
                schema={Model.schema.fields} 
                obj={obj} 
                edit={false}
            />
        <ButtonGroup>
            <Button 
                onClick={ () => navigate('edit') }
                className="btn-warning">
                modifica
            </Button>
            <Button 
                onClick={ () => navigate(Model.indexUrl()) }
                className="btn btn-secondary">
                    torna all'elenco
            </Button>
        </ButtonGroup>
    </>
}

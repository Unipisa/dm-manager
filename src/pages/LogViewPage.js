import { useParams } from 'react-router-dom'
import { Button, ButtonGroup, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import { useObject } from '../components/ObjectProvider'
import { ObjectProvider } from '../components/ObjectProvider'
import { myDateFormat } from '../Engine'

export default function LogViewPage({ Model }) {
    const params = useParams()
    const id = params.id

    return <>
        <ObjectProvider path={Model.code} id={id}>
        <LogModelView Model={Model}/>
        </ObjectProvider>
    </>
}

function LogModelView({Model, key}) {
    const obj = useObject()
    const navigate = useNavigate()
    
    return <Card key={key}>
            <Card.Header>
                <h3>{ `${Model.name} ${Model.describe(obj)}` }</h3>
            </Card.Header>
            <Card.Body>
            <p>
                <strong className="align-top">who: </strong>
                { obj.who }
            </p>
            <p>
                <strong className="align-top">when: </strong>
                { myDateFormat(obj.when) }
            </p>
            <p>
                <strong className="align-top">what: </strong>
                { obj.what }
            </p>
            <p>
                <strong className="align-top">where: </strong>
                <a href={obj.where}>{ obj.where }</a>
            </p>
            <p>
                <strong className="align-top">was: </strong>
                { JSON.stringify(obj.was) }
            </p>
            <p>
                <strong className="align-top">will: </strong>
                { JSON.stringify(obj.will) }
            </p>
        <ButtonGroup>
            <Button 
                    key='index'
                    onClick={ () => navigate(Model.indexUrl()) }
                    className="btn btn-secondary">
                        torna all'elenco
            </Button>
        </ButtonGroup>
            </Card.Body>
    </Card>
}



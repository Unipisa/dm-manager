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
    
    return <>
        <Card key={key}>
            <Card.Header>
                <h3>Log {obj.who} {myDateFormat(obj.when)}</h3>
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
            <div>
                <strong className="align-top">was: </strong>
                { renderObject(obj.was) }
            </div>
            <div>                
                <strong className="align-top">will: </strong>
                { renderObject(obj.will) }
            </div>
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
        <Card className="my-2">
            <Card.Header>
                <h3>Raw</h3>
            </Card.Header>
            <Card.Body>
                <pre>{ JSON.stringify(obj, null, 2) }</pre>
            </Card.Body>
        </Card>
    </>
}

function renderObject(obj) {
    if (obj === null) return 'null'
    if (Array.isArray(obj)) {
        return <>
            {"["}
            {obj.map((value, i) => {
                if (i>0) return <>
                    {", "}
                    { renderField(i, value) }
                </>
                else return renderField(i, value)
            })}
            {"]"}
        </>
    }
    if (typeof(obj) === 'object') {
        const entries = Object.entries(obj).map(([key, value]) => {
            return <>
                <i className="align-top">{key}: </i>
                <div className="mx-2">
                    { renderField(key, value) },
                </div>
            </>
        })
        return <>
        {"{"}
        <div>
            {entries}
        </div>
        {"}"}
        </>
    }
    return JSON.stringify(obj)
}


function renderField(field, value) {
    if (['person','room'].includes(field) && typeof(value) === 'string') {
        return <a href={`/${field}/${value}`}>{value}</a>
    }
    if (['createdBy','updatedBy'].includes(field) && typeof(value) === 'string') {
        return <a href={`/user/${value}`}>{value}</a>
    }
    return renderObject(value)
}   
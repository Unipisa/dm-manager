import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Card } from 'react-bootstrap'

import { useEngine } from '../Engine'
import ModelView from '../components/ModelView'
import ModelEdit from '../components/ModelEdit'
import Timestamps from '../components/Timestamps'
import Loading from '../components/Loading'

export default function ModelPage({ Model }) {
    const params = useParams()
    const id = params.id
    const create = (id === 'new')
    const [ edit, setEdit ] = useState(create)
    const engine = useEngine()
    const query = engine.useGet(Model.code, id)

    if (query.isError) return <div>errore caricamento</div>
    if (!query.isSuccess) return <Loading />

    const original = query.data
    const Details = Model.ObjectDetails
    const objName = Model.name
    const oa = Model.oa 
    const describe = Model.describe.bind(Model)

    console.log(`ModelPage obj: ${JSON.stringify(query.data)}`)

    if (edit) return <>
        <Card>
            <Card.Header>
                <h3>{ create 
                    ? `nuov${oa} ${objName}` 
                    : `modifica ${objName} ${describe(original)}`
                }</h3>
            </Card.Header>
            <Card.Body>
                <ModelEdit Model={Model} obj={original} setEdit={setEdit}/>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={original} />
            </Card.Footer>
        </Card>
    </>
    
    if (!edit) return <>
        <Card>
            <Card.Header>
                <h3>{ `${objName} ${describe(original)}` }</h3>
            </Card.Header>
            <Card.Body>
                <ModelView Model={Model} create={create} edit={edit} obj={original} setEdit={setEdit}/>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={original} />
            </Card.Footer>
        </Card>
        { Details && <Details obj={original} /> }
    </>
}


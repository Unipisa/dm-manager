import { useParams } from 'react-router-dom'
import { Card } from 'react-bootstrap'

import { useEngine } from '../Engine'
import ModelView from '../components/ModelView'
import Timestamps from '../components/Timestamps'
import Loading from '../components/Loading'

export default function ModelViewPage({ Model }) {
    const params = useParams()
    const id = params.id
    const engine = useEngine()
    const query = engine.useGet(Model.code, id)

    if (query.isError) return <div>errore caricamento</div>
    if (!query.isSuccess) return <Loading />

    const obj = query.data
    const Details = Model.ObjectDetails

    return <>
        <Card>
            <Card.Header>
                <h3>{ `${Model.name} ${Model.describe(obj)}` }</h3>
            </Card.Header>
            <Card.Body>
                <ModelView Model={Model} obj={obj}/>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={obj} />
            </Card.Footer>
        </Card>
        { Details && <Details obj={obj} /> }
    </>
}


import { useParams, useSearchParams } from 'react-router-dom'
import { Card } from 'react-bootstrap'

import { useEngine } from '../Engine'
import ModelEdit from '../components/ModelEdit'
import Timestamps from '../components/Timestamps'
import Loading from '../components/Loading'

export default function ModelEditPage({ Model }) {
    const params = useParams()
    const [searchParams, setSearchParams] = useSearchParams()
    const id = params.id
    const clone_id = searchParams.get('clone')
    const create = (id === 'new')
    const engine = useEngine()
    const query = engine.useGet(Model.code, clone_id ? clone_id : id)

    if (query.isError) return <div>errore caricamento</div>
    if (!query.isSuccess) return <Loading />

    const obj = query.data

    return <>
        <Card>
            <Card.Header>
                <h3>{ create 
                    ? `nuov${Model.oa} ${Model.name}` 
                    : `modifica ${Model.name} ${Model.describe(obj)}`
                }</h3>
            </Card.Header>
            <Card.Body>
                <ModelEdit Model={Model} obj={obj}/>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={obj} />
            </Card.Footer>
        </Card>
    </>
}


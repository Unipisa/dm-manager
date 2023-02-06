import { useParams } from 'react-router-dom'

import ModelView from '../components/ModelView'
import { ObjectProvider } from '../components/ObjectProvider'
import RelatedDetails from '../components/RelatedDetails'

export default function ModelViewPage({ Model }) {
    const params = useParams()
    const id = params.id

    return <>
        <ObjectProvider path={Model.code} id={id}>
            <ModelView Model={Model}/>
            <RelatedDetails Model={Model} />
        </ObjectProvider>
    </>
}


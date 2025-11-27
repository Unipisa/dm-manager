import { useParams } from 'react-router-dom'
import { ModelHeading } from '../components/ModelHeading'

import ModelView from '../components/ModelView'
import ModelAdditionalInfo from '../components/ModelAdditionalInfo'
import { ObjectProvider } from '../components/ObjectProvider'
import RelatedDetails from '../components/RelatedDetails'

export default function ModelViewPage({ Model }) {
    const params = useParams()
    const id = params.id

    return <>
        <ObjectProvider path={Model.code} id={id}>
            <ModelHeading model={Model} />
            <ModelView Model={Model}/>
            <ModelAdditionalInfo Model={Model} />
            <RelatedDetails Model={Model} />
        </ObjectProvider>
    </>
}


import { useParams } from 'react-router-dom'

import { useEngine } from '../Engine'
import ModelView from '../components/ModelView'
import { ObjectProvider } from '../components/ObjectProvider'

export default function UrlViewPage() {
    const params = useParams()
    const id = params.id
    const engine = useEngine()
    const Url = engine.Models.Url

    return <ObjectProvider path={Url.code} id={id} >
        <ModelView Model={Url} />
    </ObjectProvider>
}


import { useParams } from 'react-router-dom'

import { useEngine } from '../Engine'
import ModelForm from '../components/ModelForm'

export default function ModelPage({ Model }) {
    const id = useParams().id
    const engine = useEngine()
    const query = engine.useGet(Model.code, id)
    if (query.isError) return <div>errore caricamento</div>
    if (!query.isSuccess) return <div>caricamento...</div>
    console.log(`ModelPage obj: ${JSON.stringify(query.data)}`)
    return <ModelForm Model={Model} original={query.data} />
}


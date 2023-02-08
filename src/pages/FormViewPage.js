import { useParams, Link } from 'react-router-dom'

import { useEngine } from '../Engine'
import ModelView from '../components/ModelView'
import { ObjectProvider } from '../components/ObjectProvider'

export default function FormViewPage() {
    const params = useParams()
    const id = params.id
    const engine = useEngine()
    const Form = engine.Models.Form

    return <ObjectProvider path={Form.code} id={id}>
        <ModelView Model={Form}/>
        <p>Anteprima: <Link to="fill">fill</Link></p>
    </ObjectProvider>
}


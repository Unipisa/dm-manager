import { useParams } from 'react-router-dom'

import ModelForm from '../components/ModelForm'

export default function ModelPage({ Model }) {
    const id = useParams().id
    return <ModelForm Model={Model} id={id} />
}
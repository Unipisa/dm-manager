import { useParams, useSearchParams, Navigate } from 'react-router-dom'
import { useState } from 'react'

import ModelEdit from '../components/ModelEdit'

export default function ModelEditPage({ Model }) {
    const params = useParams()
    const [searchParams] = useSearchParams()
    const id = params.id
    const clone_id = searchParams.get('clone')
    const [ redirect, setRedirect ] = useState(null)

    if (redirect !== null) return <Navigate to={redirect} />

    return <ModelEdit 
        Model={Model} 
        id={id} 
        clone_id={clone_id}
        onSave={obj => setRedirect(Model.viewUrl(obj._id))}
        onCancel={obj => setRedirect(obj._id ? Model.viewUrl(obj._id) : Model.indexUrl())}
        onDelete={obj => setRedirect(Model.indexUrl())}
    />
}


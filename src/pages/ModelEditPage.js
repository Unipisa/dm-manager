import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom'

import ModelEdit from '../components/ModelEdit'

export default function ModelEditPage({ Model }) {
    const params = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const id = params.id
    const clone_id = searchParams.get('clone')
    const isNew = id === '__new__'
    const location = useLocation()
    const fromApp = location.state?.fromApp

    return <ModelEdit 
        Model={Model} 
        id={id} 
        clone_id={clone_id}
        onSave={obj => {
            if (isNew && clone_id) {
                // For duplica: go back 2 steps (to ModelsPage), then navigate to new view
                navigate(-2)
                setTimeout(() => navigate(Model.viewUrl(obj._id)), 0)
            } else if (isNew) {
                // For new from ModelsPage: replace edit with view
                navigate(Model.viewUrl(obj._id), { replace: true })
            } else {
                // For editing: just go back
                navigate(-1)
            }
        }}
        onCancel={() => navigate(-1)}
        onDelete={() => fromApp ? navigate(-2) : navigate(Model.indexUrl())}
    />
}


import { Link } from 'react-router-dom'

import { useEngine } from '../Engine'
import LoadTable from '../components/LoadTable'
import { ModelHeading } from '../components/ModelHeading'

export default function ModelsPage({ Model, columns }) {
    const engine = useEngine()
    const showAddButton = engine.user.hasSomeRole(...Model.schema.managerRoles)
    const addButton = showAddButton
        ? <Link className="mx-1 btn btn-primary text-nowrap" to={Model.editUrl('__new__')}>aggiungi {Model.name}</Link>
        : null
    return <>
        <ModelHeading model={Model} />
        <LoadTable 
            path={Model.code}
            defaultFilter={Model.indexDefaultFilter || {}}
            viewUrl={(obj) => Model.viewUrl(obj._id)}
            fieldsInfo={Model.schema.fields}
            addButton={addButton}
            columns={columns || Model.columns}
            Filters={Model.Filters}
            />
    </>
}

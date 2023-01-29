import { Link } from 'react-router-dom'

export default function ModelHomeElement({ Model, user }) {
    if (user.hasSomeRole(...Model.schema.managerRoles)) {
        return <Link to={Model.indexUrl()}>gestire {Model.articulation['gli oggetti']}</Link>
    } else if (user.hasSomeRole(...Model.schema.supervisorRoles)) {
        return <Link to={Model.indexUrl()}>visualizzare {Model.articulation['gli oggetti']}</Link>
    } else {
        return null
    }
}

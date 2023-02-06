import { NavLink } from 'react-router-dom'

export default function ModelMenuElement({ Model, user }) {
    if (user && user.hasSomeRole(...Model.schema.supervisorRoles)) {
        return <NavLink key={Model.code} to={Model.indexUrl()} className="nav-link">
            {Model.articulation['oggetti']}
        </NavLink>
    } else {
        return null
    }
}

import { NavLink } from 'react-router-dom'

function capitalize(x) {
    if (x) {
        return x.charAt(0).toUpperCase() + x.slice(1);
    } else {
        return x
    }
}

export default function ModelMenuElement({ Model, user }) {
    if (user && user.hasSomeRole(...Model.schema.supervisorRoles)) {
        return <NavLink key={Model.code} to={Model.indexUrl()} className="nav-link">
            {capitalize(Model.articulation['oggetti'])}
        </NavLink>
    } else {
        return null
    }
}
import { NavDropdown } from "react-bootstrap"
import { NavLink } from "react-router-dom"

function capitalize(x) {
    if (x) {
        return x.charAt(0).toUpperCase() + x.slice(1);
    } else {
        return x
    }
}

export default function ModelNavDropdownElement({ Model, user }) {
    if (user && user.hasSomeRole(...Model.schema.supervisorRoles)) {
        return <NavDropdown.Item as={NavLink} key={Model.code} to={Model.indexUrl()}>
            {capitalize(Model.articulation['oggetti'])}
        </NavDropdown.Item>
    } else {
        return null
    }
}
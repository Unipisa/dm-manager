import { Link } from "react-router-dom"

/**
 * @type {(x: string) => string}
 */
const capitalize = (x) => x.charAt(0).toUpperCase() + x.slice(1)

export const ModelHeading = ({ model }) => (
    <h1 className="pb-4">
        <Link to={model.indexUrl()}>
            {capitalize(model.articulation['oggetti'])}
        </Link>
    </h1>
)
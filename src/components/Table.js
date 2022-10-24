export function Th({ filter, children }) {
    return <th scope="col" onClick={ filter.onClick }>
        {children}{filter.sortIcon}
    </th>
}

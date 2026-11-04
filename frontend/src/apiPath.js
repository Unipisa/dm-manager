// Join path segments only: keep URL origins and query strings separate.
export function joinPath(...segments) {
    return segments
        .filter(segment => segment !== undefined && segment !== null)
        .flatMap(segment => String(segment).split('/'))
        .filter(segment => segment !== '')
        .join('/')
}

export function apiPath(...segments) {
    return '/' + joinPath('api', 'v0', ...segments)
}

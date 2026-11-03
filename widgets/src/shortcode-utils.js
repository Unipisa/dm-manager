export function getShortcodeQuery(filter, sortField) {
    const params = new URLSearchParams({ _sort: sortField });
    for (const part of filter.split(',')) {
        const entry = part.trim();
        if (!entry) continue;
        const separator = entry.indexOf('=');
        const key = separator < 0 ? entry : entry.slice(0, separator);
        const value = separator < 0 ? '' : entry.slice(separator + 1);
        switch (key) {
            case 'current':
                params.set('startDate__lte_or_null', 'today');
                params.set('endDate__gte_or_null', 'today');
                break;
            case 'past':
                params.set('endDate__lt', 'today');
                break;
            case 'perspective':
                params.set('startDate__gt', 'today');
                break;
            case 'year':
                params.set('startDate__lte_or_null', `${value}-12-31`);
                params.set('endDate__gte_or_null', `${value}-01-01`);
                break;
            case 'dateyear':
                params.set('date__lte', `${value}-12-31`);
                params.set('date__gte', `${value}-01-01`);
                break;
            default:
                params.set(key, value);
        }
    }
    return params.toString();
}

export function getDottedField(row, field, dateFormat) {
    const value = field.split('.').reduce((object, key) => object?.[key], row);
    if (!['startDate', 'endDate', 'date'].includes(field)) return value;

    // PHP date_create() uses the current date for an empty value.
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    const pad = number => String(number).padStart(2, '0');
    const tokens = {
        Y: date.getFullYear(), y: String(date.getFullYear()).slice(-2),
        m: pad(date.getMonth() + 1), n: date.getMonth() + 1,
        d: pad(date.getDate()), j: date.getDate(),
        M: date.toLocaleDateString('en-US', { month: 'short' }),
        F: date.toLocaleDateString('en-US', { month: 'long' }),
        D: date.toLocaleDateString('en-US', { weekday: 'short' }),
        l: date.toLocaleDateString('en-US', { weekday: 'long' }),
        H: pad(date.getHours()), G: date.getHours(),
        i: pad(date.getMinutes()), s: pad(date.getSeconds()),
    };
    return dateFormat.replace(/\\(.)|[YymndjMFDlHGis]/g, (token, escaped) => escaped ?? tokens[token]);
}

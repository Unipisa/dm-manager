import { hasPeopleValue, peopleDate, peopleBoolean, setPeopleText } from './people-query';

const options = new Set([
    'year', 'from', 'to', 'ssd', 'institution', 'qualification', 'exclude_qualification',
    'limit', 'columns', 'headers', 'headers_en', 'en', 'date_style', 'group_by_year',
]);

export function getThesisQuery(props = {}) {
    for (const option of Object.keys(props)) {
        if (!options.has(option)) throw new Error(`Unknown ThesisList option "${option}". Use named filters and columns/headers.`);
    }
    const params = new URLSearchParams({ _format: 'shortcode', _sort: 'person' });
    let from = hasPeopleValue(props.from) ? peopleDate(props.from, 'from') : undefined;
    let to = hasPeopleValue(props.to) ? peopleDate(props.to, 'to') : undefined;
    if (hasPeopleValue(props.year)) {
        if (from || to) throw new Error('Choose year or from/to, not both.');
        if (!/^\d{4}$/.test(String(props.year)) || Number(props.year) < 1000) throw new Error('year must be a four-digit year.');
        from = `${props.year}-01-01`;
        to = `${props.year}-12-31`;
    }
    if (from && to && from > to) throw new Error('from must be on or before to.');
    if (from) params.set('date__gte', from);
    // Include the entire final day, even when a thesis date contains a time.
    if (to) {
        const nextDay = new Date(`${to}T00:00:00Z`);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        params.set('date__lt', nextDay.toISOString());
    }
    setPeopleText(params, 'SSD', props.ssd, 'ssd');
    setPeopleText(params, 'institutions', props.institution, 'institution');
    for (const option of ['qualification', 'exclude_qualification']) {
        if (!hasPeopleValue(props[option])) continue;
        const values = typeof props[option] === 'string' ? props[option].split(',') : props[option];
        if (!Array.isArray(values) || !values.length || values.some(value => typeof value !== 'string' || !value.trim())) {
            throw new Error(`${option} must be a qualification or a comma-separated list/array of qualifications.`);
        }
        params.set(option, [...new Set(values.map(value => value.trim()))].join(','));
    }
    if (hasPeopleValue(props.limit)) {
        if (!/^\d+$/.test(String(props.limit)) || !Number.isSafeInteger(Number(props.limit)) || Number(props.limit) < 1) {
            throw new Error('limit must be a positive integer. Omit it to include all results.');
        }
        params.set('_limit', String(Number(props.limit)));
    }
    if (hasPeopleValue(props.group_by_year)) peopleBoolean(props.group_by_year, 'group_by_year');
    return params.toString();
}

// Shared date and display options for StaffList and VisitList.
const commonOptions = [
    'status', 'active_on', 'year', 'from', 'to', 'start_from', 'start_to',
    'limit', 'columns', 'headers', 'headers_en', 'en', 'date_style',
];

export function validatePeopleOptions(props, extraOptions, widgetName) {
    const allowed = new Set([...commonOptions, ...extraOptions]);
    for (const option of Object.keys(props)) {
        if (!allowed.has(option)) throw new Error(`Unknown ${widgetName} option "${option}". Use named filters and columns/headers.`);
    }
}

export const hasPeopleValue = value => value !== undefined && value !== null && value !== '';

export function peopleDate(value, option) {
    if (value === 'today') {
        const now = new Date();
        value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    const text = String(value);
    const parsed = new Date(text);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
        throw new Error(`${option} must be a valid YYYY-MM-DD date or "today".`);
    }
    return text;
}

export function peopleBoolean(value, option) {
    if ([true, 1, '1', 'true'].includes(value)) return 'true';
    if ([false, 0, '0', 'false'].includes(value)) return 'false';
    throw new Error(`${option} must be true or false (1 and 0 are also accepted).`);
}

export function setPeopleText(params, key, value, option) {
    if (!hasPeopleValue(value)) return;
    if (typeof value !== 'string') throw new Error(`${option} must be a string.`);
    params.set(key, value);
}

export function getPeopleQueryParams(props = {}) {
    const {
        status = 'all', active_on, year, from, to, start_from, start_to,
        limit,
    } = props;

    if (!['all', 'current', 'past', 'future'].includes(status)) throw new Error('status must be all, current, past or future.');

    // These are alternative ways to select a period, rather than overlapping rules.
    const periods = [status !== 'all', hasPeopleValue(active_on), hasPeopleValue(year), hasPeopleValue(from) || hasPeopleValue(to)];
    if (periods.filter(Boolean).length > 1) throw new Error('Choose one date filter: status, active_on, year, or from/to.');

    // Fetch in surname/first-name order. Header clicks sort the loaded rows locally.
    const params = new URLSearchParams({ _sort: 'person' });
    if (status === 'current') {
        params.set('startDate__lte_or_null', 'today');
        params.set('endDate__gte_or_null', 'today');
    } else if (status === 'past') {
        params.set('endDate__lt', 'today');
    } else if (status === 'future') {
        params.set('startDate__gt', 'today');
    }

    let start = hasPeopleValue(from) ? peopleDate(from, 'from') : undefined;
    let end = hasPeopleValue(to) ? peopleDate(to, 'to') : undefined;
    if (hasPeopleValue(active_on)) start = end = peopleDate(active_on, 'active_on');
    if (hasPeopleValue(year)) {
        if (!/^\d{4}$/.test(String(year)) || Number(year) < 1000) throw new Error('year must be a four-digit year.');
        start = `${year}-01-01`;
        end = `${year}-12-31`;
    }
    if (start && end && start > end) throw new Error('from must be on or before to.');
    // Overlap the requested period, including staff records with open date boundaries.
    if (start) params.set('endDate__gte_or_null', start);
    if (end) params.set('startDate__lte_or_null', end);

    const startFrom = hasPeopleValue(start_from) ? peopleDate(start_from, 'start_from') : undefined;
    const startTo = hasPeopleValue(start_to) ? peopleDate(start_to, 'start_to') : undefined;
    if (startFrom && startTo && startFrom > startTo) throw new Error('start_from must be on or before start_to.');
    if (startFrom) params.set('startDate__gte', startFrom);
    if (startTo) params.set('startDate__lte', startTo);

    if (hasPeopleValue(limit)) {
        if (!/^\d+$/.test(String(limit)) || !Number.isSafeInteger(Number(limit)) || Number(limit) < 1) {
            throw new Error('limit must be a positive integer. Omit it to include all results.');
        }
        params.set('_limit', String(Number(limit)));
    }
    return params;
}

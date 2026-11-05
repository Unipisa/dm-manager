// StaffList's public options. Database field names and modifiers stay in this file.
const options = new Set([
    'status', 'active_on', 'year', 'from', 'to', 'start_from', 'start_to',
    'qualification', 'ssd', 'is_internal',
    'limit', 'columns', 'headers', 'headers_en', 'en', 'date_style',
]);

const supplied = value => value !== undefined && value !== null && value !== '';

function date(value, option) {
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

function boolean(value) {
    if ([true, 1, '1', 'true'].includes(value)) return 'true';
    if ([false, 0, '0', 'false'].includes(value)) return 'false';
    throw new Error('is_internal must be true or false (1 and 0 are also accepted).');
}

export function getStaffQuery(props = {}) {
    for (const option of Object.keys(props)) {
        if (!options.has(option)) throw new Error(`Unknown StaffList option "${option}". Use named filters and columns/headers.`);
    }
    const {
        status = 'all', active_on, year, from, to, start_from, start_to,
        qualification, ssd, is_internal, limit,
    } = props;

    if (!['all', 'current', 'past', 'future'].includes(status)) throw new Error('status must be all, current, past or future.');

    // These are alternative ways to select a period, rather than overlapping rules.
    const periods = [status !== 'all', supplied(active_on), supplied(year), supplied(from) || supplied(to)];
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

    let start = supplied(from) ? date(from, 'from') : undefined;
    let end = supplied(to) ? date(to, 'to') : undefined;
    if (supplied(active_on)) start = end = date(active_on, 'active_on');
    if (supplied(year)) {
        if (!/^\d{4}$/.test(String(year)) || Number(year) < 1000) throw new Error('year must be a four-digit year.');
        start = `${year}-01-01`;
        end = `${year}-12-31`;
    }
    if (start && end && start > end) throw new Error('from must be on or before to.');
    // Overlap the requested period, including staff records with open date boundaries.
    if (start) params.set('endDate__gte_or_null', start);
    if (end) params.set('startDate__lte_or_null', end);

    const startFrom = supplied(start_from) ? date(start_from, 'start_from') : undefined;
    const startTo = supplied(start_to) ? date(start_to, 'start_to') : undefined;
    if (startFrom && startTo && startFrom > startTo) throw new Error('start_from must be on or before start_to.');
    if (startFrom) params.set('startDate__gte', startFrom);
    if (startTo) params.set('startDate__lte', startTo);

    if (supplied(qualification)) {
        const values = typeof qualification === 'string' ? qualification.split(',') : qualification;
        if (!Array.isArray(values) || !values.length || values.some(value => typeof value !== 'string' || !value.trim() || value.includes('|'))) {
            throw new Error('qualification must be a qualification or a comma-separated list/array of qualifications.');
        }
        const qualifications = [...new Set(values.map(value => value.trim()))];
        params.set(qualifications.length === 1 ? 'qualification' : 'qualification__in', qualifications.join('|'));
    }
    if (supplied(ssd)) {
        if (typeof ssd !== 'string') throw new Error('ssd must be a research area code.');
        params.set('SSD', ssd);
    }
    if (supplied(is_internal)) params.set('isInternal', boolean(is_internal));
    if (supplied(limit)) {
        if (!/^\d+$/.test(String(limit)) || !Number.isSafeInteger(Number(limit)) || Number(limit) < 1) {
            throw new Error('limit must be a positive integer. Omit it to include all results.');
        }
        params.set('_limit', String(Number(limit)));
    }
    return params.toString();
}

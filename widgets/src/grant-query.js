import { getPeopleQueryParams, setPeopleText, hasPeopleValue, peopleBoolean } from './people-query';

const sortFields = {
    start_date: 'startDate', end_date: 'endDate', name: 'name',
};
const options = new Set([
    'status', 'active_on', 'year', 'from', 'to', 'start_from', 'start_to', 'limit',
    'ssd',
    'sort_by', 'order', 'en', 'date_style', 'group_by_year',
]);

export function getGrantQuery(props = {}) {
    for (const option of Object.keys(props)) {
        if (!options.has(option)) throw new Error(`Unknown GrantList option "${option}". Use named filters and display options.`);
    }
    const { sort_by = 'start_date', order = 'asc', date_style = 'short' } = props;
    if (!Object.hasOwn(sortFields, sort_by)) throw new Error(`sort_by must be one of: ${Object.keys(sortFields).join(', ')}.`);
    if (!['asc', 'desc'].includes(order)) throw new Error('order must be asc or desc.');
    if (!['short', 'medium', 'long', 'full'].includes(date_style)) throw new Error('date_style must be short, medium, long or full.');
    if (hasPeopleValue(props.group_by_year)) peopleBoolean(props.group_by_year, 'group_by_year');

    // Reuse the same period, open-date and limit semantics as StaffList/VisitList.
    const params = getPeopleQueryParams(props);
    params.set('_format', 'shortcode');
    params.set('_sort', `${order === 'desc' ? '-' : ''}${sortFields[sort_by]}`);
    setPeopleText(params, 'SSD', props.ssd, 'ssd');
    return params.toString();
}

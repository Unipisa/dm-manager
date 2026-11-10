import { getPeopleQueryParams, validatePeopleOptions, setPeopleText, hasPeopleValue, peopleBoolean } from './people-query';

export function getVisitQuery(props = {}) {
    validatePeopleOptions(props, ['ssd', 'grants', 'group_by_year', 'sort_by', 'order'], 'VisitList');
    const { sort_by = 'name', order = 'asc' } = props;
    const sortFields = { name: 'person', start_date: 'startDate', end_date: 'endDate' };
    if (!Object.hasOwn(sortFields, sort_by)) throw new Error('sort_by must be name, start_date or end_date.');
    if (!['asc', 'desc'].includes(order)) throw new Error('order must be asc or desc.');
    if (hasPeopleValue(props.group_by_year)) peopleBoolean(props.group_by_year, 'group_by_year');
    const params = getPeopleQueryParams(props);
    params.set('_sort', `${order === 'desc' ? '-' : ''}${sortFields[sort_by]}`);
    setPeopleText(params, 'SSD', props.ssd, 'ssd');
    if (hasPeopleValue(props.grants)) {
        const ids = typeof props.grants === 'string' ? props.grants.split(',') : props.grants;
        if (!Array.isArray(ids) || !ids.length || ids.some(id => typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id.trim()))) {
            throw new Error('grants must be a grant ID or a comma-separated list/array of grant IDs.');
        }
        params.set('grants', [...new Set(ids.map(id => id.trim().toLowerCase()))].join(','));
    }
    return params.toString();
}

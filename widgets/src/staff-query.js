import { getPeopleQueryParams, validatePeopleOptions, hasPeopleValue, peopleBoolean, setPeopleText } from './people-query';

export function getStaffQuery(props = {}) {
    validatePeopleOptions(props, ['qualification', 'ssd', 'is_internal'], 'StaffList');
    const params = getPeopleQueryParams(props);
    const { qualification, ssd, is_internal } = props;
    if (hasPeopleValue(qualification)) {
        const values = typeof qualification === 'string' ? qualification.split(',') : qualification;
        if (!Array.isArray(values) || !values.length || values.some(value => typeof value !== 'string' || !value.trim() || value.includes('|'))) {
            throw new Error('qualification must be a qualification or a comma-separated list/array of qualifications.');
        }
        const qualifications = [...new Set(values.map(value => value.trim()))];
        params.set(qualifications.length === 1 ? 'qualification' : 'qualification__in', qualifications.join('|'));
    }
    setPeopleText(params, 'SSD', ssd, 'ssd');
    if (hasPeopleValue(is_internal)) params.set('isInternal', peopleBoolean(is_internal, 'is_internal'));
    return params.toString();
}

import { getPeopleQueryParams, validatePeopleOptions, setPeopleText, hasPeopleValue, peopleBoolean } from './people-query';

export function getVisitQuery(props = {}) {
    validatePeopleOptions(props, ['ssd', 'grant_id', 'group_by_year'], 'VisitList');
    if (hasPeopleValue(props.group_by_year)) peopleBoolean(props.group_by_year, 'group_by_year');
    const params = getPeopleQueryParams(props);
    setPeopleText(params, 'SSD', props.ssd, 'ssd');
    if (hasPeopleValue(props.grant_id)) {
        if (typeof props.grant_id !== 'string' || !/^[a-f\d]{24}$/i.test(props.grant_id)) throw new Error('grant_id must be a valid grant ID.');
        params.set('grants', props.grant_id);
    }
    return params.toString();
}

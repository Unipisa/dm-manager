import { getPeopleQueryParams, validatePeopleOptions, setPeopleText, hasPeopleValue, peopleBoolean } from './people-query';

export function getVisitQuery(props = {}) {
    validatePeopleOptions(props, ['ssd', 'group_by_year'], 'VisitList');
    if (hasPeopleValue(props.group_by_year)) peopleBoolean(props.group_by_year, 'group_by_year');
    const params = getPeopleQueryParams(props);
    setPeopleText(params, 'SSD', props.ssd, 'ssd');
    return params.toString();
}

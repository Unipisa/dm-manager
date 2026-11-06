import { getPeopleQueryParams, validatePeopleOptions, setPeopleText } from './people-query';

export function getVisitQuery(props = {}) {
    validatePeopleOptions(props, ['ssd'], 'VisitList');
    const params = getPeopleQueryParams(props);
    setPeopleText(params, 'SSD', props.ssd, 'ssd');
    return params.toString();
}

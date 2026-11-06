import { isEnglish } from './utils';

export function hasPersonProfile(person, extraStaff = []) {
    if (typeof person?.hasPersonProfile === 'boolean') return person.hasPersonProfile;
    // Also support person objects already containing staff data, regardless of order.
    const entries = [person?.staffs, person?.staff, extraStaff]
        .flatMap(value => Array.isArray(value) ? value : value ? [value] : []);
    return entries.some(staff => staff?.isInternal === true || staff?.qualification === 'ex Docente');
}

export function getPersonProfileURL(person, en = isEnglish(), extraStaff = []) {
    if (!person?._id || !hasPersonProfile(person, extraStaff)) return null;
    return `${en ? '/en' : ''}/scheda-personale/?person_id=${person._id}`;
}

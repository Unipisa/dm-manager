import { getResearchGroupLabel, getRoomDetails } from './utils';

export function getPeopleOffice(row, en) {
    const room = row.roomAssignment?.room;
    if (!room) return null;
    const details = getRoomDetails({ ...room, floor: room.floor == null ? undefined : String(room.floor) }, room._id, en);
    const location = [details.buildingName, details.floorName].filter(value => value !== undefined && value !== null && value !== '').join(', ');
    const label = room.number == null || room.number === '' ? '' : details.roomLink.text;
    if (!location && !label) return null;
    return { location, label, url: room._id && label ? details.roomLink.url : null };
}

// Plain values are shared by cell rendering and sorting, keeping both consistent.
export function getPeopleValue(row, column, en, kind = 'staff') {
    const person = row.person || {};
    switch (column) {
        case 'name': return [person.firstName, person.lastName].filter(Boolean).join(' ');
        case 'first_name': return person.firstName || '';
        case 'last_name': return person.lastName || '';
        case 'qualification': return row.qualification || '';
        case 'ssd': return (Array.isArray(row.SSD) ? row.SSD : [row.SSD]).filter(Boolean).map(code => getResearchGroupLabel(code, en)).join(', ');
        case 'office': {
            const office = getPeopleOffice(row, en);
            return office ? [office.location, office.label].filter(Boolean).join(', ') : '';
        }
        case 'email': return person.email || '';
        case 'phone': return person.phone || '';
        case 'affiliations': return ((kind === 'visit' ? row.affiliations : person.affiliations) || []).map(affiliation => affiliation.name).filter(Boolean).join(', ');
        case 'current_affiliations': return (person.affiliations || []).map(affiliation => affiliation.name).filter(Boolean).join(', ');
        case 'tags': return (row.tags || []).join(', ');
        case 'collaboration_theme': return row.collaborationTheme || '';
        case 'publish': return row.publish;
        case 'is_internal': return row.isInternal;
        case 'start_date': return row.startDate;
        case 'end_date': return row.endDate;
        default: return '';
    }
}

export function nextPeopleSort(current, column) {
    return { column, order: current.column === column && current.order === 'asc' ? 'desc' : 'asc' };
}

export function sortPeopleRows(rows, { column = 'last_name', order = 'asc' } = {}, en = false, kind = 'staff') {
    const collator = new Intl.Collator(en ? 'en' : 'it', { numeric: true, sensitivity: 'base' });
    const direction = order === 'desc' ? -1 : 1;
    const empty = value => value === undefined || value === null || value === '';
    function compare(a, b, direction = 1) {
        // Missing values stay at the bottom in either direction.
        if (empty(a) || empty(b)) return Number(empty(a)) - Number(empty(b));
        const result = typeof a === 'number' && typeof b === 'number' ? a - b : collator.compare(String(a), String(b));
        return result * direction;
    }
    const byName = (a, b, direction = 1) => compare(a.person?.lastName, b.person?.lastName, direction)
        || compare(a.person?.firstName, b.person?.firstName, direction);

    function value(row) {
        const result = getPeopleValue(row, column, en, kind);
        if (column === 'start_date' || column === 'end_date') {
            const timestamp = result ? new Date(result).getTime() : NaN;
            return Number.isNaN(timestamp) ? null : timestamp;
        }
        return typeof result === 'boolean' ? Number(result) : result;
    }
    return [...rows].sort((a, b) => {
        if (column === 'name' || column === 'last_name') return byName(a, b, direction);
        if (column === 'office') {
            // Sort the combined location in physical order, then by room number.
            const first = a.roomAssignment?.room || {};
            const second = b.roomAssignment?.room || {};
            return compare(first.building, second.building, direction)
                || compare(first.floor, second.floor, direction)
                || compare(first.number, second.number, direction) || byName(a, b);
        }
        return compare(value(a), value(b), direction) || byName(a, b);
    });
}

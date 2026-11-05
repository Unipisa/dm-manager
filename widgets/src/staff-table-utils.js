import { getResearchGroupLabel } from './utils';

// Plain values are shared by cell rendering and sorting, keeping both consistent.
export function getStaffValue(row, column, en) {
    const person = row.person || {};
    const room = row.roomAssignment?.room || {};
    switch (column) {
        case 'name': return [person.firstName, person.lastName].filter(Boolean).join(' ');
        case 'first_name': return person.firstName || '';
        case 'last_name': return person.lastName || '';
        case 'qualification': return row.qualification || '';
        case 'ssd': return (Array.isArray(row.SSD) ? row.SSD : [row.SSD]).filter(Boolean).map(code => getResearchGroupLabel(code, en)).join(', ');
        case 'building': return { A: en ? 'Building A' : 'Edificio A', B: en ? 'Building B' : 'Edificio B', X: 'ex DMA' }[room.building] || room.building || '';
        case 'floor': {
            const floors = en ? ['Ground floor', 'First floor', 'Second floor'] : ['Piano terra', 'Primo piano', 'Secondo piano'];
            return floors[room.floor] ?? room.floor ?? '';
        }
        case 'office': return room.number ?? '';
        case 'email': return person.email || '';
        case 'phone': return person.phone || '';
        case 'affiliations': return (person.affiliations || []).map(affiliation => affiliation.name).filter(Boolean).join(', ');
        case 'is_internal': return row.isInternal;
        case 'start_date': return row.startDate;
        case 'end_date': return row.endDate;
        default: return '';
    }
}

export function nextStaffSort(current, column) {
    return { column, order: current.column === column && current.order === 'asc' ? 'desc' : 'asc' };
}

export function sortStaffRows(rows, { column = 'last_name', order = 'asc' } = {}, en = false) {
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
        if (column === 'floor') return row.roomAssignment?.room?.floor;
        const result = getStaffValue(row, column, en);
        if (column === 'start_date' || column === 'end_date') {
            const timestamp = result ? new Date(result).getTime() : NaN;
            return Number.isNaN(timestamp) ? null : timestamp;
        }
        return typeof result === 'boolean' ? Number(result) : result;
    }
    return [...rows].sort((a, b) => column === 'name' || column === 'last_name'
        ? byName(a, b, direction)
        : compare(value(a), value(b), direction) || byName(a, b));
}

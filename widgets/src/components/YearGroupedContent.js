import React from 'react';
import Accordion from './Accordion';
import { hasPeopleValue, peopleBoolean } from '../people-query';

function groupByYear(rows, dateField) {
    const groups = new Map();
    for (const row of rows) {
        const date = row[dateField] ? new Date(row[dateField]) : null;
        const year = date && !Number.isNaN(date.getTime()) ? date.getUTCFullYear() : null;
        if (!groups.has(year)) groups.set(year, []);
        groups.get(year).push(row);
    }
    // Keep missing/invalid dates visible in a final group.
    return [...groups].sort(([a], [b]) => a === null ? 1 : b === null ? -1 : b - a);
}

export function YearGroupedContent({ data, grouped = false, dateField, en, children }) {
    let enabled;
    try {
        enabled = hasPeopleValue(grouped) && peopleBoolean(grouped, 'group_by_year') === 'true';
    } catch (error) {
        return <p className="alert alert-danger" role="alert">{error.message}</p>;
    }
    if (!enabled || !data?.length) return children(data || []);
    return <div className="dm-year-groups">{groupByYear(data, dateField).map(([year, rows]) =>
        <Accordion key={year ?? 'undated'} title={year === null ? (en ? 'Undated' : 'Senza data') : String(year)} markdown={false}>
            {children(rows)}
        </Accordion>
    )}</div>;
}

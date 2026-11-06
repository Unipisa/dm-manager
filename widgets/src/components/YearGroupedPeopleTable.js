import React from 'react';
import Accordion from './Accordion';
import { PeopleTable } from './PeopleTable';

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

export function YearGroupedPeopleTable({ data, grouped, dateField, ...tableOptions }) {
    if (!grouped || !data?.length) return <PeopleTable data={data} {...tableOptions} />;
    return <div>{groupByYear(data, dateField).map(([year, rows]) =>
        <Accordion key={year ?? 'undated'} title={year === null ? (tableOptions.en ? 'Undated' : 'Senza data') : String(year)} markdown={false}>
            <PeopleTable data={rows} {...tableOptions} />
        </Accordion>
    )}</div>;
}

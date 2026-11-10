import React from 'react';
import { YearGroupedContent } from './YearGroupedContent';
import { PeopleTable } from './PeopleTable';

export function YearGroupedPeopleTable({ data, grouped, dateField, ...tableOptions }) {
    return <YearGroupedContent data={data} grouped={grouped} dateField={dateField} en={tableOptions.en}>
        {rows => <PeopleTable data={rows} {...tableOptions} />}
    </YearGroupedContent>;
}

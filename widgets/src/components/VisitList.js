import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { getPeopleTableOptions } from './PeopleTable';
import { YearGroupedPeopleTable } from './YearGroupedPeopleTable';
import { getManageURL, isEnglish } from '../utils';
import { getVisitQuery } from '../visit-query';
import { hasPeopleValue, peopleBoolean } from '../people-query';

export function VisitList(props) {
    let query, tableOptions;
    try {
        query = getVisitQuery(props);
        tableOptions = getPeopleTableOptions(props, 'visit');
    } catch (error) {
        return <p className="alert alert-danger" role="alert">VisitList: {error.message}</p>;
    }
    const grouped = hasPeopleValue(props.group_by_year) && peopleBoolean(props.group_by_year, 'group_by_year') === 'true';
    const initialSort = { column: !props.sort_by || props.sort_by === 'name' ? 'last_name' : props.sort_by, order: props.order || 'asc' };
    return <VisitListData query={query} tableOptions={tableOptions} en={isEnglish(props.en)} grouped={grouped} initialSort={initialSort} />;
}

function VisitListData({ query, tableOptions, en, grouped, initialSort }) {
    const { isLoading, error, data } = useQuery(['visitlist', query], async () => {
        const response = await axios.get(getManageURL('public/visit-list', query));
        return response.data.data || [];
    });
    if (isLoading || error) return <Loading widget="Lista delle visite" error={error} />;
    return <YearGroupedPeopleTable key={`${initialSort.column}:${initialSort.order}`} data={data} {...tableOptions} en={en} grouped={grouped} dateField="startDate" initialSort={initialSort} />;
}

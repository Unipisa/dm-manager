import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { getPeopleTableOptions } from './PeopleTable';
import { YearGroupedPeopleTable } from './YearGroupedPeopleTable';
import { getManageURL, isEnglish } from '../utils';
import { getThesisQuery } from '../thesis-query';
import { hasPeopleValue, peopleBoolean } from '../people-query';

export function ThesisList(props) {
    let query, tableOptions;
    try {
        query = getThesisQuery(props);
        tableOptions = getPeopleTableOptions(props, 'thesis');
    } catch (error) {
        return <p className="alert alert-danger" role="alert">ThesisList: {error.message}</p>;
    }
    const grouped = hasPeopleValue(props.group_by_year) && peopleBoolean(props.group_by_year, 'group_by_year') === 'true';
    return <ThesisListData query={query} tableOptions={tableOptions} en={isEnglish(props.en)} grouped={grouped} />;
}

function ThesisListData({ query, tableOptions, en, grouped }) {
    const { isLoading, error, data } = useQuery(['thesislist', query], async () => {
        const response = await axios.get(getManageURL('public/theses', query));
        return response.data.data || [];
    });
    if (isLoading || error) return <Loading widget="Lista delle tesi" error={error} />;
    return <YearGroupedPeopleTable data={data} {...tableOptions} en={en} grouped={grouped} dateField="date" />;
}

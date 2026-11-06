import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { PeopleTable, getPeopleTableOptions } from './PeopleTable';
import { getManageURL, isEnglish } from '../utils';
import { getVisitQuery } from '../visit-query';

export function VisitList(props) {
    let query, tableOptions;
    try {
        query = getVisitQuery(props);
        tableOptions = getPeopleTableOptions(props, 'visit');
    } catch (error) {
        return <p className="alert alert-danger" role="alert">VisitList: {error.message}</p>;
    }
    return <VisitListData query={query} tableOptions={tableOptions} en={isEnglish(props.en)} />;
}

function VisitListData({ query, tableOptions, en }) {
    const { isLoading, error, data } = useQuery(['visitlist', query], async () => {
        const response = await axios.get(getManageURL('public/visit-list', query));
        return response.data.data || [];
    });
    if (isLoading || error) return <Loading widget="Lista delle visite" error={error} />;
    return <PeopleTable data={data} {...tableOptions} en={en} />;
}

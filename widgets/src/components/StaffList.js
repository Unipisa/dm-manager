import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { PeopleTable, getPeopleTableOptions } from './PeopleTable';
import { getManageURL, isEnglish } from '../utils';
import { getStaffQuery } from '../staff-query';

export function StaffList(props) {
    let query, tableOptions;
    try {
        query = getStaffQuery(props);
        tableOptions = getPeopleTableOptions(props);
    } catch (error) {
        return <p className="alert alert-danger" role="alert">StaffList: {error.message}</p>;
    }
    return <StaffListData query={query} tableOptions={tableOptions} en={isEnglish(props.en)} />;
}

// Keep hooks in the loading component: invalid options never trigger a request.
function StaffListData({ query, tableOptions, ...displayOptions }) {
    const { isLoading, error, data } = useQuery(['stafflist', query], async () => {
        const res = await axios.get(getManageURL('public/staff-list', query));
        return res.data.data || [];
    });

    if (isLoading || error) return <Loading widget="Lista del personale" error={error} />;
    return <PeopleTable data={data} {...tableOptions} {...displayOptions} />;
}

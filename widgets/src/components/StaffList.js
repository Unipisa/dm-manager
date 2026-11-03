import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { PeopleTable } from './PeopleTable';
import { getManageURL } from '../utils';
import { getShortcodeQuery } from '../shortcode-utils';

export function StaffList({ sort_field = 'person', filter = '', ...props }) {
    const query = getShortcodeQuery(filter, sort_field);
    const { isLoading, error, data } = useQuery(['stafflist', query], async () => {
        const res = await axios.get(getManageURL('public/staff-list', query));
        return res.data.data || [];
    });

    if (isLoading || error) return <Loading widget="Lista del personale" error={error} />;
    return <PeopleTable {...props} data={data} />;
}

import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { PeopleTable } from './PeopleTable';
import { getManageURL } from '../utils';
import { getShortcodeQuery as getVisitQuery, getDottedField as getVisitField } from '../shortcode-utils';

export { getVisitQuery, getVisitField };

export function VisitList({ sort_field = 'person', filter = '', ...props }) {
    const query = getVisitQuery(filter, sort_field);
    const { isLoading, error, data } = useQuery(['visitlist', query], async () => {
        const res = await axios.get(getManageURL('public/visit-list', query));
        return res.data.data || [];
    });

    if (isLoading || error) return <Loading widget="Lista delle visite" error={error} />;
    return <PeopleTable {...props} data={data} />;
}

import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { PersonCardContent } from './PersonCard';
import { getManageURL, isEnglish } from '../utils';

export function GroupCards({ group_id, isinternal }) {
    const { isLoading, error, data } = useQuery(['group', group_id], async () => {
        if (!group_id) {
            throw new Error('Id non può essere vuota');
        }
        const res = await axios.get(getManageURL(`public/group/${group_id}`));
        const group = res.data.data;
        if (!group) {
            throw new Error('Impossibile trovare il gruppo richiesto');
        }
        return group;
    });

    if (isLoading || error) {
        return <Loading widget="Schede del gruppo" error={error} />;
    }

    if (!data) {
        return <div>Nessun dato</div>;
    }

    const memberFilter = person => {
        const internal = !!person.staffs?.[0]?.isInternal;
        if (isinternal === '1' || isinternal === 1) return internal;
        if (isinternal === '0' || isinternal === 0) return !internal;
        return true;
    };
    const en = isEnglish();
    const translations = {
        presidente: en ? 'President' : 'Presidente',
        vicepresidente: en ? 'Vice President' : 'Vicepresidente',
    };
    const roleTitle = title => translations[title?.toLowerCase()] || title;
    const members = [...(data.members || [])].sort((a, b) => {
        const first = a.lastName || '';
        const second = b.lastName || '';
        return first < second ? -1 : first > second ? 1 : 0;
    }).filter(memberFilter);

    return (
        <div className="d-flex row justify-content-between px-2 pb-4">
            {data.chair && memberFilter(data.chair) && (
                <PersonCardContent person={data.chair} badge={roleTitle(data.chair_title)} />
            )}
            {data.vice && memberFilter(data.vice) && (
                <PersonCardContent person={data.vice} badge={roleTitle(data.vice_title)} />
            )}
            {members.map(member => <PersonCardContent key={member._id} person={member} />)}
        </div>
    );
}

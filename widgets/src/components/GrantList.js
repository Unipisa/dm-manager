import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { getManageURL, isEnglish } from '../utils';
import { getShortcodeQuery, getDottedField } from '../shortcode-utils';

function GrantPerson({ person, title }) {
    if (!person) return null;
    const internal = Array.isArray(person.staffs) && person.staffs[0]?.isInternal;
    const name = `${person.firstName} ${person.lastName}`;
    return <p className="mb-0">
        {title}: {internal
            ? <a href={`/en/scheda-personale/?person_id=${person._id}`}>{name}</a>
            : <em>{name}</em>}
    </p>;
}

export function GrantList({
    sort_field = 'startDate', filter = '',
    no_data_message = 'nessuna informazione', no_data_message_en = 'there is no data',
    date_format = 'd.m.Y',
}) {
    const query = getShortcodeQuery(filter, sort_field);
    const { isLoading, error, data } = useQuery(['grantlist', query], async () => {
        const res = await axios.get(getManageURL('public/grants', `_format=shortcode&${query}`));
        return res.data.data || [];
    });

    if (isLoading || error) return <Loading widget="Lista dei grant" error={error} />;

    const en = isEnglish();
    if (!data?.length) return <p>{en ? no_data_message_en : no_data_message}</p>;
    const dateFormat = en ? 'M d, Y' : date_format;

    return <ul>{data.map((grant, index) => (
        <li key={grant._id || index} className={`mb-2 current${(grant.SSD || []).join(', ').toLowerCase()} ${grant.funds || ''}`}>
            <h5 className="mb-0 font-weight-bold">
                <a href={`/research/grant-details/?grant_id=${grant._id}`}>
                    {grant.name}
                    {grant.projectType && <> <small className="text-muted">({grant.projectType})</small></>}
                </a>
            </h5>
            <GrantPerson person={grant.pi} title="Principal Investigator" />
            {grant.localCoordinator && grant.localCoordinator._id !== grant.pi?._id && (
                <GrantPerson person={grant.localCoordinator} title="Coordinator of the Research Unit" />
            )}
            <p>Project period: <em>{getDottedField(grant, 'startDate', dateFormat)} &ndash; {getDottedField(grant, 'endDate', dateFormat)}</em></p>
        </li>
    ))}</ul>;
}

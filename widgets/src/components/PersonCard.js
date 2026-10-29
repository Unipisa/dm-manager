import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { getManageURL, isEnglish } from '../utils';

export function PersonCard({ person_id, badge }) {
    const { isLoading, error, data } = useQuery(['person', person_id], async () => {
        if (!person_id) {
            throw new Error('Id non può essere vuota');
        }
        const res = await axios.get(getManageURL(`public/person/${person_id}`));
        const person = res.data.data;
        if (!person) {
            throw new Error("Impossibile trovare la persona richiesta");
        }
        return person;
    });

    if (isLoading || error) {
        return <Loading widget="Scheda persona" error={error} />;
    }

    if (!data) {
        return <div>Nessun dato</div>;
    }

    const internal = data.staffs?.[0]?.isInternal;
    const prefix = isEnglish() ? 'en/' : '';
    const name = internal
        ? `${data.firstName} ${data.lastName}`
        : `${data.firstName} ${data.lastName} (${(data.affiliations || []).map(affiliation => affiliation.name).join(', ')})`;
    const icon = <i className="fas fa-id-card fa-fw"></i>;

    return (
        <div className="col-lg-6 col-12 py-2">
            <div className="card h-100 m-2 shadow-sm">
                <div className="card-body">
                    {internal ? (
                        <a href={`/${prefix}scheda-personale/?person_id=${data._id}`}>{icon}</a>
                    ) : data.personalPage ? (
                        <a href={data.personalPage} target="_blank" rel="noopener noreferrer">{icon}</a>
                    ) : icon}
                    <span className="card-title ml-2 h5">
                        {name}
                        {badge && <span className="badge badge-sm badge-primary ml-2">{badge}</span>}
                    </span>
                    <br />
                    {data.email && (
                        <>
                            <i className="fas fa-at mr-3"></i>
                            <a href={`mailto:${data.email}`}>{data.email}</a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

import { getPersonProfileURL } from '../person-profile';
import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { getManageURL } from '../utils';
import './styles.css';

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

    return <div className="dm-people-cards"><PersonCardContent person={data} badge={badge} /></div>;
}

export function PersonCardContent({ person: data, badge }) {
    const profile = getPersonProfileURL(data);
    const name = [data.firstName, data.lastName].filter(Boolean).join(' ');
    const affiliations = (data.affiliations || []).map(affiliation => affiliation.name).filter(Boolean).join(', ');
    const href = profile || data.personalPage;

    return (
        <article className="dm-person-card">
            <div className="dm-person-card-heading">
                <i className="fas fa-id-card fa-fw" aria-hidden="true"></i>
                <h3 className="dm-person-card-name">
                    {href ? <a href={href} target={profile ? undefined : '_blank'} rel={profile ? undefined : 'noopener noreferrer'}>{name}</a> : name}
                    {badge && <> <span className="dm-person-card-role">{badge}</span></>}
                </h3>
            </div>
            {affiliations && <p className="dm-person-card-affiliations">
                <i className="fas fa-university fa-fw" aria-hidden="true"></i>
                <span>{affiliations}</span>
            </p>}
            {data.email && <div className="dm-person-card-contact">
                <i className="fas fa-at fa-fw" aria-hidden="true"></i>
                <a href={`mailto:${data.email}`}>{data.email}</a>
            </div>}
        </article>
    );
}

import { getPersonProfileURL, hasPersonProfile } from '../person-profile';
import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { getManageURL, isEnglish } from '../utils';
import { getGrantQuery } from '../grant-query';
import { YearGroupedContent } from './YearGroupedContent';
import './styles.css';

function GrantPerson({ person, title, en }) {
    if (!person) return null;
    const profile = getPersonProfileURL(person, en);
    const name = [person.firstName, person.lastName].filter(Boolean).join(' ');
    const affiliations = !hasPersonProfile(person)
        ? [...new Set((person.affiliations || []).map(affiliation => affiliation.name).filter(Boolean))].join(', ')
        : '';
    return <p className="dm-grant-person">
        <i className="fas fa-user fa-fw" aria-hidden="true"></i>
        <span><span className="dm-grant-label">{title}:</span>{' '}{profile
            ? <a href={profile}>{name}</a>
            : <em>{name}</em>}
            {affiliations && <span className="dm-grant-affiliations"> ({affiliations})</span>}
        </span>
    </p>;
}

export function GrantList(props) {
    let query;
    try {
        query = getGrantQuery(props);
    } catch (error) {
        return <p className="alert alert-danger" role="alert">GrantList: {error.message}</p>;
    }
    return <GrantListData query={query} en={isEnglish(props.en)} dateStyle={props.date_style || 'short'} grouped={props.group_by_year} />;
}

function GrantListData({ query, en, dateStyle, grouped }) {
    const { isLoading, error, data } = useQuery(['grantlist', query], async () => {
        const res = await axios.get(getManageURL('public/grants', query));
        return res.data.data || [];
    });
    if (isLoading || error) return <Loading widget="Lista dei grant" error={error} />;
    if (!data?.length) return <p>{en ? 'No grants match these filters.' : 'Nessun finanziamento corrisponde a questi filtri.'}</p>;

    const dateFormat = new Intl.DateTimeFormat(en ? 'en-US' : 'it-IT', { dateStyle });
    const formatDate = value => {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
    };

    const renderGrants = grants => <ul className="dm-grant-list" role="list">{grants.map((grant, index) => {
        const start = formatDate(grant.startDate);
        const end = formatDate(grant.endDate);
        const ssds = Array.isArray(grant.SSD) ? grant.SSD : [grant.SSD].filter(Boolean);
        return <li key={grant._id || index} className={`dm-grant-panel current${ssds.join(', ').toLowerCase()} ${grant.funds || ''}`}>
            <h3 className="dm-grant-title">
                <a className="dm-heading-with-badge" href={`/research/grant-details/?grant_id=${grant._id}`}>
                    {grant.projectType && <span className="dm-grant-type dm-widget-badge">{grant.projectType}</span>}
                    <span className="dm-heading-text">{grant.name}</span>
                </a>
            </h3>
            {(start || end) && <p className="dm-grant-period">
                <i className="far fa-calendar-alt fa-fw" aria-hidden="true"></i>
                <span><span className="dm-grant-label">{en ? 'Project period' : 'Periodo del progetto'}:</span>{' '}<em>
                    {start && end ? <>{start} &ndash; {end}</> : start
                        ? <>{en ? 'From' : 'Dal'} {start}</>
                        : <>{en ? 'Until' : 'Fino al'} {end}</>}
                </em></span>
            </p>}
            <GrantPerson person={grant.pi} title="Principal Investigator" en={en} />
            {grant.localCoordinator && grant.localCoordinator._id !== grant.pi?._id && (
                <GrantPerson person={grant.localCoordinator} title={en ? 'Coordinator of the Research Unit' : 'Coordinatore dell’unità di ricerca'} en={en} />
            )}
        </li>;
    })}</ul>;
    return <YearGroupedContent data={data} grouped={grouped} dateField="startDate" en={en}>
        {renderGrants}
    </YearGroupedContent>;
}

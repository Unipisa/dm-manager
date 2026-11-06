import { getPersonProfileURL, hasPersonProfile } from '../person-profile';
import React from 'react';
import axios from 'axios';
import { useQuery } from 'react-query';
import { getManageURL, isEnglish } from '../utils';
import { Loading } from './Loading';
import Accordion from './Accordion';
import Markdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import './styles.css';

export function Grant({ grant_id, en: english }) {
    const { isLoading, error, data } = useQuery(['grant', grant_id], async () => {
        if (!grant_id) throw new Error('Impossibile trovare il grant richiesto');
        const res = await axios.get(getManageURL('public/grant/' + grant_id));
        const grant = res.data.data[0];
        if (!grant) throw new Error('Impossibile trovare il grant richiesto');
        return grant;
    });
    if (isLoading || error) return <Loading widget="Descrizione grant" error={error} />;
    if (!data) return <div>404 Not Found.</div>;

    const en = isEnglish(english);
    const dateFormat = new Intl.DateTimeFormat(en ? 'en-US' : 'it-IT', { dateStyle: 'long' });
    const formatDate = value => {
        const date = value ? new Date(value) : null;
        return date && !Number.isNaN(date.getTime()) ? dateFormat.format(date) : '';
    };
    const start = formatDate(data.startDate);
    const end = formatDate(data.endDate);
    const period = start && end ? `${start} – ${end}` : start
        ? `${en ? 'From' : 'Dal'} ${start}` : end ? `${en ? 'Until' : 'Fino al'} ${end}` : '';
    const pi = data.pi?.firstName || data.pi?.lastName ? data.pi : null;
    const coordinator = (data.localCoordinator?.firstName || data.localCoordinator?.lastName)
        && data.localCoordinator._id !== pi?._id ? data.localCoordinator : null;
    const facts = [
        { icon: 'fas fa-university', label: en ? 'Funded by' : 'Ente finanziatore', value: data.fundingEntity },
        { icon: 'far fa-calendar-alt', label: en ? 'Project period' : 'Periodo del progetto', value: period },
        { icon: 'fas fa-coins', label: 'Budget', value: data.budgetAmount },
        { icon: 'fas fa-external-link-alt', label: en ? 'Website' : 'Sito web', value: data.webSite &&
            <a href={data.webSite} target="_blank" rel="noopener noreferrer">{data.webSite}</a> },
    ].filter(fact => fact.value);

    return <article className="dm-grant-detail">
        <header className="dm-grant-header">
            {data.projectType && <span className="dm-grant-detail-type">{data.projectType}</span>}
            <h2 className="dm-grant-detail-title">{data.name}</h2>
        </header>
        {facts.length > 0 && <dl className="dm-grant-facts">
            {facts.map(fact => <div className="dm-grant-fact" key={fact.label}>
                <dt><i className={`${fact.icon} fa-fw`} aria-hidden="true"></i>{' '}{fact.label}</dt>
                <dd>{fact.value}</dd>
            </div>)}
        </dl>}
        {(pi || coordinator) && <section className="dm-grant-contacts" aria-label={en ? 'Project contacts' : 'Referenti del progetto'}>
            {pi && <KeyPerson person={pi} title="Principal Investigator" en={en} />}
            {coordinator && <KeyPerson person={coordinator} title={en ? 'Local Coordinator' : 'Coordinatore locale'} en={en} />}
        </section>}
        <div className="dm-grant-detail-sections">
            {data.members?.length > 0 && <Accordion title={en ? 'Participants' : 'Partecipanti'} markdown={false}>
                <ul className="dm-grant-participants">{data.members.map((person, index) =>
                    <li key={person._id || index}>{[person.firstName, person.lastName].filter(Boolean).join(' ')}</li>
                )}</ul>
            </Accordion>}
            {data.description && <Accordion title={en ? 'Description' : 'Descrizione'} markdown={false}>
                <div className="dm-grant-description"><Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                    {data.description}
                </Markdown></div>
            </Accordion>}
        </div>
    </article>;
}

export function KeyPerson({ person, title, en = isEnglish() }) {
    if (!person) return null;
    const name = [person.firstName, person.lastName].filter(Boolean).join(' ');
    const profile = getPersonProfileURL(person, en);
    const affiliations = hasPersonProfile(person) ? ''
        : [...new Set((person.affiliations || []).map(affiliation => affiliation.name).filter(Boolean))].join(', ');
    return <div className="dm-grant-contact">
        <p className="dm-grant-contact-role"><i className="fas fa-user fa-fw" aria-hidden="true"></i>{' '}{title}</p>
        <p className="dm-grant-contact-name">{profile
            ? <a href={profile}><i className="fas fa-id-card fa-fw" aria-hidden="true"></i>{' '}{name}</a>
            : name}</p>
        {affiliations && <p className="dm-grant-contact-affiliations">{affiliations}</p>}
    </div>;
}

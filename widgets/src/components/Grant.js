import React from 'react'
import axios from 'axios'
import { useQuery } from 'react-query'

import { getManageURL, isEnglish, formatDateInterval, getDMURL } from '../utils';
import { Loading } from './Loading'
import Accordion from './Accordion'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'

export function Grant({ id }) {
    const { isLoading, error, data } = useQuery([ 'grant', id ], async () => {
        if (id !== null) {
            const res = await axios.get(getManageURL('public/grant/' + id))
            const grant = res.data.data[0]
            if (! grant) {
                throw new Error("Impossibile trovare il grant richiesto")
            }

            return grant
        }
        else {
            throw new Error('Impossibile trovare il grant richiesto')
        }
    })

    if (isLoading || error ) {
        return <Loading widget="Descrizione grant" error={error}></Loading>
    }

    if (! data) {
        return <div>
            404 Not Found.
        </div>
    }

    const en = isEnglish();

    return (
        <div>
            <h3 style={{ marginTop: '8px' }}>{data.name}</h3>
            <p>
                {data.projectType && <>Project Type: {data.projectType} <br /></>}
                {data.fundingEntity && <>Funded by: {data.fundingEntity} <br /></>}
                {data.startDate && data.endDate && <>Period: {formatDateInterval(data.startDate, data.endDate)} <br /></>}
                {data.budgetAmount && <>Budget: {data.budgetAmount} <br /></>}
                {data.webSite && <>Website: <a href={data.webSite}>{data.webSite}</a></>}
            </p>
            <p class='mb-3'>
                {data.pi && <><KeyPerson person={data.pi} title="Principal Investigator"></KeyPerson>  <br /></>}
                {data.localCoordinator && (data.localCoordinator._id !== data.pi._id) && <KeyPerson person={data.localCoordinator} title="Local Coordinator"></KeyPerson>}
            </p>

            {data.members && data.members.length > 0 && (
                <Accordion title={en ? "Participants" : "Partecipanti"}>
                    {data.members?.map(m => `${m.firstName} ${m.lastName}`).join(', ') || ''}
                </Accordion>
            )}
            {data.description && (
                <Accordion title={en ? "Description" : "Descrizione"}>
                    <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                    {data.description}
                    </Markdown>
                </Accordion>
            )}
        </div>
    );      
}

export function KeyPerson({ person, title }) {
    const name = `${person.firstName} ${person.lastName}`;
    const affiliations = person.affiliations?.map(aff => aff.name).join(', ') || '';
    const isInternal = person?.staff[0]?.isInternal;

    return (
        <>
            {title}:
            {isInternal ? (
                <a href={getDMURL("en/person-details/?person_id=" + person._id)}> {name} ({affiliations})</a>
            ) : (
                <> {name} ({affiliations})</>
            )}
        </>
    );
}


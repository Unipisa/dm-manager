import React from 'react'
import axios from 'axios'
import { Loading } from './Loading'
import { EventHeading, EventMetadata, EventDescription, EventFlyer, getEventRoom } from './EventContent'
import { formatDateInterval, getManageURL, getResearchGroupLabel, isEnglish } from '../utils'
import { useQuery } from 'react-query'
import './styles.css'

export function Conference({ id }) {
    const { isLoading, error, data } = useQuery(['conference', id], async () => {
        if (id === null) throw new Error('Impossibile trovare la conferenza richiesta')

        const response = await axios.get(getManageURL('public/conference/' + id))
        const conference = response.data.data[0]
        if (!conference) throw new Error('Impossibile trovare la conferenza richiesta')

        return conference
    })

    if (isLoading || error) return <Loading widget="Descrizione conferenza" error={error} />

    if (! data) {
        return <div>
            404 Not Found.
        </div>
    }

    return <div className="dm-event-detail">
        <ConferenceTitle conference={data} detailed />
        <EventFlyer url={data.flyerUrl} title={data.title} />
        <EventDescription>{data.description}</EventDescription>
    </div>
}

export function ConferenceTitle({ conference, href, en: forceEnglish = false, detailed = false, typeLabel }) {
    const en = isEnglish(forceEnglish)
    const room = getEventRoom({ room: conference.conferenceRoom, institution: conference.institution, en })
    const researchGroups = conference.SSD || []
    // Keep the compact display used by the existing widget for one or two groups.
    const researchGroupNames = researchGroups.length > 0 && researchGroups.length <= 2
        ? researchGroups.map(code => getResearchGroupLabel(code, en)).join(', ')
        : null
    const websiteLabel = detailed
        ? (en ? 'Conference website' : 'Sito della conferenza')
        : (en ? 'Website' : 'Sito web')

    return <>
        <EventHeading title={<span>{conference.title}</span>} href={href} typeLabel={typeLabel} />
        <EventMetadata items={[
            { icon: 'far fa-calendar', content: <span>{formatDateInterval(conference.startDate, conference.endDate, en ? 'en-US' : 'it-IT')}</span> },
            { icon: 'fas fa-map-marker-alt', content: room },
            { icon: 'fas fa-university', content: researchGroupNames && <span>{researchGroupNames}</span> },
            { icon: 'fas fa-link', content: conference.url && <a href={conference.url}>{websiteLabel}</a> },
        ]} />
    </>
}

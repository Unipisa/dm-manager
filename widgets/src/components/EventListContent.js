import React from 'react'
import { SeminarTitle } from './Seminar'
import { ConferenceTitle } from './Conference'
import { EventDescription } from './EventContent'
import { getDMURL, isEnglish } from '../utils'
import './styles.css'

const emptyMessages = {
    events: ['No events match these filters.', 'Nessun evento corrisponde a questi filtri.'],
    seminar: ['No seminars match these filters.', 'Nessun seminario corrisponde a questi filtri.'],
    conference: ['No conferences match these filters.', 'Nessuna conferenza corrisponde a questi filtri.'],
}

function EventListItem({ event, type, en, showType }) {
    const english = isEnglish(en)
    const seminar = type === 'seminar'
    const page = seminar
        ? (english ? 'seminar' : 'seminario')
        : (english ? 'conference' : 'conferenza')
    const label = seminar
        ? (english ? 'Seminar' : 'Seminario')
        : (english ? 'Conference' : 'Conferenza')
    const href = getDMURL(`${page}?id=${event._id}`)
    const typeLabel = showType ? label : undefined

    return <div className="dm-event-list-item">
        {seminar
            ? <SeminarTitle seminar={event} href={href} en={en} typeLabel={typeLabel} />
            : <ConferenceTitle conference={event} href={href} en={en} typeLabel={typeLabel} />}
        <EventDescription excerpt>{seminar ? event.abstract : event.description}</EventDescription>
    </div>
}

// A fixed type identifies a dedicated list. Mixed lists use each event's type.
export function EventListContent({ events = [], type, en = false }) {
    const entries = (events || []).filter(Boolean)
    if (!entries.length) {
        const [english, italian] = emptyMessages[type || 'events']
        return <p className="dm-event-empty">{isEnglish(en) ? english : italian}</p>
    }

    return <div className="dm-event-list">
        {entries.map(event => <EventListItem
            key={`${type || event.type}-${event._id}`}
            event={event}
            type={type || event.type}
            en={en}
            showType={!type}
        />)}
    </div>
}

import React from 'react'
import axios from 'axios'
import { Loading } from './Loading'
import { EventHeading, EventMetadata, EventDescription, EventFlyer, getEventRoom } from './EventContent'
import { formatDate, formatTime, formatPersonName, getDMURL, getManageURL, isEnglish } from '../utils'
import { useQuery } from 'react-query'
import './styles.css'

export function Seminar({ id }) {
    const { isLoading, error, data } = useQuery(['seminar', id], async () => {
        if (id === null) throw new Error('Impossibile trovare il seminario richiesto')

        const response = await axios.get(getManageURL('public/seminar/' + id))
        const seminar = response.data.data[0]
        if (!seminar) throw new Error('Impossibile trovare il seminario')

        return seminar
    })

    if (isLoading || error) return <Loading widget="Descrizione seminario" error={error} />

    return <div className="dm-event-detail">
        <SeminarTitle seminar={data} />
        <EventFlyer url={data.flyerUrl} title={data.title} />
        <EventDescription>{data.abstract}</EventDescription>
    </div>
}

export function SeminarTitle({ seminar, href, en: forceEnglish = false, typeLabel }) {
    const en = isEnglish(forceEnglish)
    const endDatetime = new Date(seminar.startDatetime)
    endDatetime.setMinutes(endDatetime.getMinutes() + seminar.duration)

    const speakers = (seminar.speakers || []).map(formatPersonName).join(', ')
    const thesisDefense = seminar.category?.some(category => category.label === 'phd-thesis-defense')
    const title = thesisDefense ? `Ph.D. Thesis Defense: ${seminar.title}` : seminar.title
    const categories = [
        <a href={getDMURL(en ? 'seminars' : 'prossimi-seminari')} key="seminars-category">Seminars</a>,
        ...(seminar.category || []).map(category => (
            <span key={category._id}>, <a href={getDMURL(`${en ? 'seminars' : 'prossimi-seminari'}/?category=${category._id}`)}>{category.name}</a></span>
        )),
    ]
    const room = getEventRoom({ room: seminar.conferenceRoom, en })

    return <>
        <EventHeading title={title} href={href} typeLabel={typeLabel} />
        {speakers && <p className="dm-event-speakers">{speakers}</p>}
        <EventMetadata items={[
            { icon: 'far fa-calendar', content: <span>{formatDate(seminar.startDatetime, en ? 'en-US' : 'it-IT')}</span> },
            { icon: 'far fa-clock', content: <span>{formatTime(seminar.startDatetime)} &mdash; {formatTime(endDatetime)}</span> },
            { icon: 'fas fa-map-marker-alt', content: room },
            { icon: 'fa fa-tags', content: <span>{categories}</span> },
        ]} />
    </>
}

import React from 'react';
import axios from 'axios'
import { Loading } from './Loading'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'

import { formatDateInterval, getManageURL, getNewSSD, getResearchGroupLabel, getDMURL, isEnglish } from '../utils'
import { useQuery } from 'react-query'

export function Conference({ id }) {
    const { isLoading, error, data } = useQuery([ 'conference', id ], async () => {
        if (id !== null) {
            const res = await axios.get(getManageURL('public/conference/' + id))
            const conference = res.data.data[0]
            if (! conference) {
                throw new Error("Impossibile trovare la conferenza richiesta")
            }

            return conference
        }
        else {
            throw new Error('Impossibile trovare la conferenza richiesta')
        }
    })

    if (isLoading || error ) {
        return <Loading widget="Descrizione conferenza" error={error}></Loading>
    }

    if (! data) {
        return <div>
            404 Not Found.
        </div>
    }

    return <div>
        <ConferenceTitle conference={data}></ConferenceTitle>
        <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
            {data.description}
        </Markdown>
    </div>
}

export function ConferenceTitle({ conference, href }) {
    const en = isEnglish();

    var title_block = <span>{conference.title}</span>
    if (href !== undefined) {
        title_block = <a href={href}>
            {title_block}
        </a>
    }
    title_block = <h3 className="title entry-title">{title_block}</h3>

    let room = null;
    
    if (conference.conferenceRoom?.name) {
        if (conference.conferenceRoom?.room) {
            const roomUrl = en
                ? getDMURL(`/map?sel=${conference.conferenceRoom.room}`)
                : getDMURL(`/mappa?sel=${conference.conferenceRoom.room}`);
            room = <a href={roomUrl}>{conference.conferenceRoom.name}</a>;
        } else {
            room = conference.conferenceRoom.name;
        }
    } else if (conference.institution?.name) {
        room = conference.institution.name;
    }

    const ssdArray = conference.SSD || [];
    let ssdDisplay = null;
    
    if (ssdArray.length === 1) {
        ssdDisplay = <span>{getResearchGroupLabel(ssdArray[0], en)}</span>;
    } else if (ssdArray.length === 2) {
        ssdDisplay = <span>{getResearchGroupLabel(ssdArray[0], en)}, {getResearchGroupLabel(ssdArray[1], en)}</span>;
    }

    return <>
    {title_block}
    <p>
        <small>
            <span className="far fa-calendar"></span> {
                formatDateInterval(conference.startDate, conference.endDate)}
            {room && (
                <>
                    <span className="mx-1"></span>
                    <span className="fas fa-map-marker-alt"></span> {room}
                </>
            )}
            {ssdDisplay && (
                <>
                    <span className="mx-1"></span>
                    <span className="fas fa-university"></span> {ssdDisplay}
                </>
            )}
            { conference.url && <><span className="mx-1"></span>
            <span className="fas fa-link"></span> <a href={conference.url}>Web</a></> }
        </small>
    </p></>
}

import React from 'react';
import { getManageURL } from '../utils';
import axios from 'axios'
import { Loading } from './Loading'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import { formatDate, formatTime, truncateText } from '../utils'
import { useQuery } from 'react-query'

export function Conference({ id }) {
    const { isLoading, error, data } = useQuery([ 'conference', id ], async () => {
        if (id !== null) {
            const res = await axios.get(getManageURL('public/conference/' + id))
            const conference = res.data.data[0]
            return conference
        }
        else {
            throw new Error('Impossibile trovare la conferenza richiesta')
        }
    })

    if (isLoading || error ) {
        return <Loading widget="Descrizione conferenza" error={error}></Loading>
    }

    return <div>
        <ConferenceTitle conference={data}></ConferenceTitle>
        <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {truncateText(data.notes, 300)}
        </Markdown>
    </div>
}

export function ConferenceTitle({ conference, href }) {
    var title_block = <h2>{conference.title}</h2>
    if (href !== undefined) {
        title_block = <a href={href}>
            {title_block}
        </a>
    }

    return <>
    {title_block}
    <p>
        <small>
            <span className="far fa-calendar"></span> {formatDate(conference.startDate)}
            <span className="mx-1"></span>
            <span className="far fa-clock"></span> {formatTime(conference.endDate)}
            <span className="mx-1"></span>
            <span className="fas fa-map-marker-alt"></span> {conference.conferenceRoom.name}
        </small>
    </p></>
}


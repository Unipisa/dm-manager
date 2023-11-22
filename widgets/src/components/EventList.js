import React from 'react'
import axios from 'axios'
import { truncateText, getManageURL, getDMURL } from '../utils'
import { ConferenceTitle } from './Conference'
import { SeminarTitle } from './Seminar'
import { Loading } from './Loading'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { useQuery } from 'react-query'

export function EventList({ from, to, grant }) {
    const filter = { from, to, grant }

    const { isLoading, error, data } = useQuery([ 'events' ], async () => {
        var events = []

        const conf = await axios.get(getManageURL("public/conferences"), { params: filter })
        if (conf.data) {
            const ec = conf.data.data              
            const ec_label =  ec.map(x => { 
                return {...x, type: 'conference'}
            })
            events.push(...ec_label)
        }

        const sem = await axios.get(getManageURL("public/seminars"), { params: filter })
        if (sem.data) {
            const es = sem.data.data
            const es_label = es.map(x => { 
                return {...x, type: 'seminar'}
            })
            events.push(...es_label)
        }

        events.sort((a, b) => {
            const dateA = a.startDatetime ? a.startDatetime : a.startDate
            const dateB = b.startDatetime ? b.startDatetime : b.startDate
            return new Date(dateA) - new Date(dateB)
        })

        return events
    })

    if (isLoading || error) {
        return <Loading widget="Lista degli eventi" error={error}></Loading>
    }

    var events_block = []
    for (var i = 0; i < data.length; i++) {
        const e = data[i]

        if (e.type == 'seminar') {
            const e = data[i]
            const link = getDMURL("seminario?id=" + e._id)
    
            events_block.push(
                <div key={e._id}>
                    <SeminarTitle seminar={e} href={link}></SeminarTitle>
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{truncateText(e.abstract, 200)}</Markdown>
                    <hr className="my-4"></hr>
                </div>
            )
        }
        else {
            const link = getDMURL("conferenza?id=" + e._id)
            events_block.push(
                <div key={e._id}>
                    <ConferenceTitle conference={e} href={link}></ConferenceTitle>
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{truncateText(e.notes, 200)}</Markdown>
                    <hr className="my-4"></hr>
                </div>
            )
        }

        
    }

    return <>
        {events_block}
    </>
}
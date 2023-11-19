import React from 'react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { formatPersonName, formatDate, formatTime, truncateText, getManageURL } from '../utils'


import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

export function SeminarList({ filter }) {
    const [events, setEvents] = useState(null)

    useEffect(() => {
        const loader = async () => {
            if (events === null) {
                const res = await axios.get(getManageURL("public/seminars", filter))
                if (res.data) {
                    const ee = res.data.data
                    ee.sort((a,b) => new Date(a.startDatetime) - new Date(b.startDatetime))
                    setEvents(ee)
                }
            }
        }

        loader()
    })

    if (events === null) {
        return <>
            Loading events ...
        </>
    }

    var events_block = []
    for (var i = 0; i < events.length; i++) {
        const e = events[i]
        var endDatetime = new Date(e.startDatetime)
        endDatetime.setMinutes(endDatetime.getMinutes() + e.duration)

        var category_tags = [ <a href="#">Seminars</a> ]
        if (e.category) {
            category_tags.push(", ")
            category_tags.push(<a href="#">{e.category.name}</a>)
        }

        events_block.push(
            <div key={e._id}>
                <h4>
                    <a href={"https://www.dm.unipi.it/seminario/?id=" + e._id}>{e.title}, {formatPersonName(e.speaker)}</a>
                </h4>
                <p>
                    <small>
                        <span className="far fa-calendar"></span> {formatDate(e.startDatetime)}
                        <span className="mx-1"></span>
                        <span className="far fa-clock"></span> {formatTime(e.startDatetime)}  &mdash; {formatTime(endDatetime)}
                        <span className="mx-1"></span>
                        <span className="fas fa-map-marker-alt"></span> {e.conferenceRoom?.name}
                        <span className="mx-1"></span>
                        <i className='fa fa-tags'></i> {category_tags}
                    </small>
                </p>
                <p>
                <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{truncateText(e.abstract, 200)}</Markdown>
                </p>
            </div>
        )
    }

    return <>
        {events_block}
    </>
}
import React from 'react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { formatPersonName, formatDate, formatTime, truncateText, getManageURL } from '../utils'

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

        console.log(e)
        // const tags = e.

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
                        <i className='fa fa-tags'></i> <a href="#">Seminars</a>, 
                    </small>
                </p>
                <p>
                    {truncateText(e.abstract, 200)}
                </p>
            </div>
        )
    }

    return <>
        {events_block}
    </>
}
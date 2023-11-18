import React from 'react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { formatPersonName, formatDatetime, truncateText, getManageURL } from '../utils'

export function EventList({ filter }) {
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
        events_block.push(
            <div key={e._id}>
                <h4>{e.title}, {formatPersonName(e.speaker)}</h4>
                <p>
                    {formatDatetime(e.startDatetime)} &mdash; {e.conferenceRoom?.name}
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
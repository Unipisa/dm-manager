import React from 'react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { truncateText, getManageURL } from '../utils'
import { SeminarTitle } from './Seminar'
import { Loading } from './Loading'


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
        return <Loading widget="Lista dei seminari"></Loading>
    }

    var events_block = []
    for (var i = 0; i < events.length; i++) {
        const e = events[i]
        events_block.push(
            <div key={e._id}>
                <SeminarTitle seminar={e} href={"https://www.dm.unipi.it/seminario?id=" + e._id}></SeminarTitle>
                <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{truncateText(e.abstract, 200)}</Markdown>
            </div>
        )
    }

    return <>
        {events_block}
    </>
}
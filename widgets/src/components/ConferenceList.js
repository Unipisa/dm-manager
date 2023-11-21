import React from 'react'
import axios from 'axios'
import { truncateText, getManageURL, getDMURL } from '../utils'
import { ConferenceTitle } from './Conference'
import { Loading } from './Loading'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { useQuery } from 'react-query'

export function ConferenceList({ from, to, grant }) {
    const filter = { from, to, grant }

    const { isLoading, error, data } = useQuery([ 'conferences' ], async () => {
        const res = await axios.get(getManageURL("public/conferences"), { params: filter })
        if (res.data) {
            const ee = res.data.data
            ee.sort((a,b) => new Date(a.startDatetime) - new Date(b.startDatetime))
            return ee
        }
    })

    if (isLoading || error) {
        return <Loading widget="Lista delle conferenze" error={error}></Loading>
    }

    var events_block = []
    for (var i = 0; i < data.length; i++) {
        const e = data[i]
        const link = getDMURL("conferenza?id=" + e._id)

        events_block.push(
            <div key={e._id}>
                <ConferenceTitle conference={e} href={link}></ConferenceTitle>
                <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{truncateText(e.notes, 200)}</Markdown>
                <hr className="my-4"></hr>
            </div>
        )
    }

    return <>
        {events_block}
    </>
}
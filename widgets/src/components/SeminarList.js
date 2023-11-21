import React from 'react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { truncateText, getManageURL } from '../utils'
import { SeminarTitle } from './Seminar'
import { Loading } from './Loading'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { useQuery } from 'react-query'

export function SeminarList({ filter }) {
    const { isLoading, error, data } = useQuery([ 'seminars' ], async () => {
        const res = await axios.get(getManageURL("public/seminars", filter))
        if (res.data) {
            const ee = res.data.data
            ee.sort((a,b) => new Date(a.startDatetime) - new Date(b.startDatetime))
            return ee
        }
    })

    if (isLoading) {
        return <Loading widget="Lista dei seminari"></Loading>
    }

    if (error) {
        return error.message
    }

    var events_block = []
    for (var i = 0; i < data.length; i++) {
        const e = data[i]
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
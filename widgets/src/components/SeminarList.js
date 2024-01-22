import React from 'react'
import axios from 'axios'
import { truncateText, getManageURL, getDMURL } from '../utils'
import { SeminarTitle } from './Seminar'
import { Loading } from './Loading'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { useQuery } from 'react-query'

export function SeminarList({ from, to, category, grant, _sort, _limit }) {
    const filter = { from, to, category, grant, _sort, _limit }

    const { isLoading, error, data } = useQuery([ 'seminars', filter ], async () => {
        const res = await axios.get(getManageURL("public/seminars"), { params: filter })
        return res.data.data
    })

    if (isLoading || error) {
        return <Loading widget="Lista dei seminari" error={error}></Loading>
    }

    var events_block = []
    for (var i = 0; i < data.length; i++) {
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

    return <>
        {events_block}
    </>
}
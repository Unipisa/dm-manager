import React from 'react'
import axios from 'axios'
import { truncateText, getManageURL, getDMURL, isEnglish } from '../utils'
import { ConferenceTitle } from './Conference'
import { Loading } from './Loading'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import { useQuery } from 'react-query'

export function ConferenceList({ from, to, grants, ssd, is_outreach, _sort, _limit }) {
    const filter = { from, to, grants, ssd, is_outreach, _sort, _limit }

    const { isLoading, error, data } = useQuery([ 'conferences', filter ], async () => {
        const res = await axios.get(getManageURL("public/conferences"), { params: filter })
        if (res.data) {
            return res.data.data
        }
    })

    if (isLoading || error) {
        return <Loading widget="Lista delle conferenze" error={error}></Loading>
    }

    var events_block = []
    for (var i = 0; i < data.length; i++) {
        const e = data[i];
        if (typeof(e) != 'undefined') {
            const en = isEnglish();
            const link = getDMURL(en ? `en/conference?id=${e._id}` : `conferenza?id=${e._id}`);
            events_block.push(
                <div key={e._id}>
                    <ConferenceTitle conference={e} href={link}></ConferenceTitle>
                    <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{truncateText(e.description, 200)}</Markdown>
                    <hr className="my-4"></hr>
                </div>
            );
        }
    }

    return <>
        {events_block}
    </>
}
import React from 'react'
import axios from 'axios'
import { truncateText, getManageURL } from '../utils'
import { ConferenceTitle } from './Conference'
import { Loading } from './Loading'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { useQuery } from 'react-query'

export function CourseList({ from, to}) {
    const filter = { from, to }

    const { isLoading, error, data } = useQuery([ 'conferences', filter ], async () => {
        const res = await axios.get(getManageURL("public/courses"), { params: filter })
        if (res.data) {
            return res.data.data
        }
    })

    if (isLoading || error) {
        return <Loading widget="Lista dei corsi" error={error}></Loading>
    }

    var courses_block = []
    for (var i = 0; i < data.length; i++) {
        const c = data[i];
        if (typeof(c) != 'undefined') {
            courses_block.push(
                <div key={c._id}>
                    <ConferenceTitle conference={c}></ConferenceTitle>
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{truncateText(c.description, 200)}</Markdown>
                    <hr className="my-4"></hr>
                </div>
            );
        }
    }

    return <>
        {courses_block}
    </>
}
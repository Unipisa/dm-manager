import React, { useEffect, useState } from 'react';
import { getManageURL } from '../utils';
import axios from 'axios'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

export function Seminar({}) {
    const [seminar, setSeminar] = useState(null)

    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')

    useEffect(() => {
        const loader = async () => {
            if (id != null && seminar === null) {
                const res = await axios.get(getManageURL('public/seminar/' + id))
                if (res.data.data) {
                    setSeminar(res.data.data[0])
                }
                
            }
        }

        loader()
    })

    if (id == null) {
        return <div>
            Please make sure that ?id=xxx is correctly set in the page URL.
        </div>
    }

    if (seminar === null) {
        return <div>Loading seminar...</div>
    }

    return <div>
            <h2>{seminar.title}</h2>
            <p>
                <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{seminar.abstract}</Markdown>
            </p>
        </div>
}


import React, { useEffect, useState } from 'react';
import { getManageURL } from '../utils';
import axios from 'axios'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import { formatDate, formatTime } from '../utils';

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
            <SeminarTitle seminar={seminar}></SeminarTitle>
            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{seminar.abstract}</Markdown>
        </div>
}

export function SeminarTitle({ seminar, href }) {
    var endDatetime = new Date(seminar.startDatetime)
    endDatetime.setMinutes(endDatetime.getMinutes() + seminar.duration)

    var category_tags = [ <a href="#" key="seminars-category">Seminars</a> ]
    if (seminar.category !== undefined) {
        category_tags.push(<span key={seminar.category._id}>, <a href="#">{seminar.category.name}</a></span>)
    }

    var title_block = <h2>{seminar.title}</h2>
    if (href !== undefined) {
        title_block = <a href={href}>
            {title_block}
        </a>
    }

    return <>
    {title_block}
    <p>
        <small>
            <span className="far fa-calendar"></span> {formatDate(seminar.startDatetime)}
            <span className="mx-1"></span>
            <span className="far fa-clock"></span> {formatTime(seminar.startDatetime)}  &mdash; {formatTime(endDatetime)}
            <span className="mx-1"></span>
            <span className="fas fa-map-marker-alt"></span> {seminar.conferenceRoom?.name}
            <span className="mx-1"></span>
            <i className='fa fa-tags'></i> {category_tags}
        </small>
    </p></>
}


import React from 'react';
import axios from 'axios'
import { Loading } from './Loading'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import { formatDate, formatTime, formatPersonName, getDMURL, getManageURL } from '../utils'
import { useQuery } from 'react-query'

export function Seminar({ id }) {
    const { isLoading, error, data } = useQuery([ 'seminar', id ], async () => {
        if (id !== null) {
            const res = await axios.get(getManageURL('public/seminar/' + id))
            const seminar = res.data.data[0]
            if (! seminar) {
                throw new Error("Impossibile trovare il seminario")
            }
            return seminar
        }
        else {
            throw new Error('Impossibile trovare il seminario richiesto')
        }
    })

    if (isLoading || error) {
        return <Loading widget="Descrizione seminario" error={error}></Loading>
    }

    return <div>
            <SeminarTitle seminar={data}></SeminarTitle>
            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{data.abstract}</Markdown>
        </div>
}

export function SeminarTitle({ seminar, href }) {
    var endDatetime = new Date(seminar.startDatetime)
    endDatetime.setMinutes(endDatetime.getMinutes() + seminar.duration)

    var category_tags = [ <a href={getDMURL("seminari")} key="seminars-category">Seminars</a> ]
    if (seminar.category !== undefined) {
        const link = getDMURL("seminar/?category=" + seminar.category._id)
        category_tags.push(<span key={seminar.category._id}>, <a href={link}>{seminar.category.name}</a>
        </span>)
    }

    const speaker = formatPersonName(seminar.speaker)

    var title_block = <span>{seminar.title} &ndash; {speaker}</span>
    if (href !== undefined) {
        title_block = <a href={href}>
            {title_block}
        </a>
    }
    title_block = <h3 className="title entry-title">{title_block}</h3>

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


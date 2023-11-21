import React, { useEffect, useState } from 'react';
import { getManageURL } from '../utils';
import axios from 'axios'
import { Loading } from './Loading'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import { formatDate, formatTime } from '../utils'
import { useQuery } from 'react-query'

export function Seminar({}) {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')

    const { isLoading, error, data } = useQuery([ 'seminar', id ], async () => {
        if (id !== null) {
            const res = await axios.get(getManageURL('public/seminar/' + id))
            const seminar = res.data.data[0]
            return seminar
        }
    })

    if (id == null) {
        return <div>
            Please make sure that ?id=xxx is correctly set in the page URL.
        </div>
    }

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

    var category_tags = [ <a href="https://www.dm.unipi.it/seminari" key="seminars-category">Seminars</a> ]
    if (seminar.category !== undefined) {
        category_tags.push(<span key={seminar.category._id}>, <a href={"https://www.dm.unipi.it/seminari/?category=" + seminar.category._id}>{seminar.category.name}</a>
        </span>)
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


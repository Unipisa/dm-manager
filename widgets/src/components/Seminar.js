import React from 'react';
import axios from 'axios'
import { Loading } from './Loading'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'

import { formatDate, formatTime, formatPersonName, getDMURL, getManageURL, isEnglish } from '../utils'
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
            <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{data.abstract}</Markdown>
        </div>
}

export function SeminarTitle({ seminar, href }) {
    const en = isEnglish();

    var endDatetime = new Date(seminar.startDatetime)
    endDatetime.setMinutes(endDatetime.getMinutes() + seminar.duration)

    var category_tags = [ <a href={getDMURL(en ? "seminars" : "prossimi-seminari")} key="seminars-category">Seminars</a> ]
    if (seminar.category !== undefined && seminar.category.length > 0) {
        seminar.category.forEach(cat => {
            const link = getDMURL(en ? "seminars/?category=" + cat._id : "prossimi-seminari/?category=" + cat._id)
            category_tags.push(<span key={cat._id}>, <a href={link}>{cat.name}</a></span>)
        })
    }

    const speakers = seminar.speakers.map(speaker => formatPersonName(speaker)).join(", ")

    var title_block = <>{seminar.title} &ndash; {speakers}</>

    if (seminar.category?.some(cat => cat.label === 'phd-thesis-defense')) {
        title_block = <>Ph.D. Thesis Defense: {title_block}</>
    }

    if (href !== undefined) {
        title_block = <a href={href}>
            {title_block}
        </a>
    }

    let room = seminar.conferenceRoom?.name || null;
    if (seminar.conferenceRoom?.name && seminar.conferenceRoom?.room) {
        const roomUrl = en
            ? getDMURL(`/map?sel=${seminar.conferenceRoom.room}`)
            : getDMURL(`/mappa?sel=${seminar.conferenceRoom.room}`);
        room = <a href={roomUrl}>{seminar.conferenceRoom.name}</a>;
    }
    
    return <>
    <h3 className="title entry-title">{title_block}</h3>
    <p>
        <small>
            <span className="far fa-calendar"></span> {formatDate(seminar.startDatetime)}
            <span className="mx-1"></span>
            <span className="far fa-clock"></span> {formatTime(seminar.startDatetime)}  &mdash; {formatTime(endDatetime)}
            <span className="mx-1"></span>
            <span className="fas fa-map-marker-alt"></span> {room}
            <span className="mx-1"></span>
            <i className='fa fa-tags'></i> {category_tags}
        </small>
    </p></>
}


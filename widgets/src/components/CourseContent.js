import React from 'react';
import Markdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import { PersonCardContent } from './PersonCard';
import { getDMURL } from '../utils';

export function CourseLecturers({ lecturers = [], en }) {
    if (!lecturers.length) return null;
    return <section>
        <h3 className="dm-course-section-title">{en ? (lecturers.length === 1 ? 'Lecturer' : 'Lecturers') : (lecturers.length === 1 ? 'Docente' : 'Docenti')}</h3>
        <div className="dm-people-cards">{lecturers.map((lecturer, index) =>
            <PersonCardContent key={lecturer._id || index} en={en} person={lecturer} />
        )}</div>
    </section>;
}

export function CourseDescription({ description, en }) {
    if (!description) return null;
    const title = en ? 'Description' : 'Descrizione';
    const content = <div className="dm-course-description">
        <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{description}</Markdown>
    </div>;
    return <section><h3 className="dm-course-section-title">{title}</h3>{content}</section>;
}

export function CourseLessons({ lessons = [], en, locale = en ? 'en-US' : 'it-IT' }) {
    const sorted = lessons.filter(lesson => lesson?.date && !Number.isNaN(new Date(lesson.date).getTime()))
        .slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const dateFormat = new Intl.DateTimeFormat(locale, {
        weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Europe/Rome',
    });
    const timeFormat = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Rome' });
    return <section>
        <h3 className="dm-course-section-title">{en ? 'Scheduled lessons' : 'Lezioni in programma'}</h3>
        {!sorted.length ? <p>{en ? 'No lessons scheduled yet.' : 'Nessuna lezione ancora in programma.'}</p> :
            <ul className="dm-course-lessons" role="list">{sorted.map((lesson, index) => {
                const date = new Date(lesson.date);
                const room = lesson.conferenceRoom;
                const roomUrl = room && lesson.conferenceRoomID
                    ? getDMURL(`/${en ? 'map' : 'mappa'}?sel=${lesson.conferenceRoomID}`) : null;
                return <li key={lesson._id || index}>
                    <span className="dm-course-lesson-date"><i className="far fa-calendar-alt fa-fw" aria-hidden="true"></i>{' '}{dateFormat.format(date)}</span>
                    <span><i className="far fa-clock fa-fw" aria-hidden="true"></i>{' '}{timeFormat.format(date)}
                        {lesson.duration != null && <> ({lesson.duration} {en ? 'minutes' : 'minuti'})</>}
                    </span>
                    {room && <span><i className="fas fa-door-open fa-fw" aria-hidden="true"></i>{' '}
                        {roomUrl ? <a href={roomUrl} target="_blank" rel="noopener noreferrer">{room}</a> : room}
                    </span>}
                </li>;
            })}</ul>}
    </section>;
}

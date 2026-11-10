import React from 'react';
import axios from 'axios';
import { useQuery } from 'react-query';
import { getManageURL, isEnglish } from '../utils';
import { Loading } from './Loading';
import { CourseLecturers, CourseDescription, CourseLessons } from './CourseContent';
import './styles.css';

export function Course({ phd_course_id, en: english }) {
    const en = isEnglish(english);
    const id = phd_course_id || (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('phd_course_id') : null);
    if (!id) return <p className="alert alert-danger" role="alert">{en ? 'No course ID provided.' : 'Nessun ID del corso specificato.'}</p>;
    if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) {
        return <p className="alert alert-danger" role="alert">{en ? 'Invalid course ID.' : 'ID del corso non valido.'}</p>;
    }
    return <CourseData id={id} en={en} />;
}

function CourseData({ id, en }) {
    const { isLoading, error, data } = useQuery(['course', id], async () => {
        const response = await axios.get(getManageURL('public/course/' + id));
        const course = response.data.data?.[0];
        if (!course) throw new Error(en ? 'Course not found.' : 'Corso non trovato.');
        return course;
    });
    if (isLoading || error) return <Loading widget={en ? 'Course details' : 'Dettagli del corso'} error={error} />;
    if (!data) return <p>{en ? 'Course not found.' : 'Corso non trovato.'}</p>;
    const dateFormat = new Intl.DateTimeFormat(en ? 'en-US' : 'it-IT', { dateStyle: 'long', timeZone: 'Europe/Rome' });
    const dates = [
        { label: en ? 'Start date' : 'Data di inizio', value: data.startDate },
        { label: en ? 'End date' : 'Data di fine', value: data.endDate },
    ].filter(item => item.value && !Number.isNaN(new Date(item.value).getTime()));
    return <article className="dm-course-list dm-course-detail">
        <header className="dm-course-detail-header">
            <h2 className="dm-course-detail-title dm-heading-with-badge">
                {data.courseType && <span className="dm-widget-badge">{data.courseType}</span>}
                <span className="dm-heading-text">{data.title}</span>
            </h2>
        </header>
        {dates.length > 0 && <dl className="dm-course-facts">
            {dates.map(({ label, value }) => <div key={label}>
                <dt><i className="far fa-calendar-alt fa-fw" aria-hidden="true"></i>{' '}{label}</dt>
                <dd><time dateTime={value}>{dateFormat.format(new Date(value))}</time></dd>
            </div>)}
        </dl>}
        <div className="dm-course-content">
            <CourseLecturers lecturers={data.lecturers} en={en} />
            <CourseLessons lessons={data.lessons} en={en} />
            <CourseDescription description={data.description} en={en} />
        </div>
    </article>;
}

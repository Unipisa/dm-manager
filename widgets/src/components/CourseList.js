import React, { useState } from 'react'
import { useQuery } from 'react-query'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import axios from 'axios'
import Accordion from './Accordion';
import { Loading } from './Loading'
import { formatDate, formatTime, getManageURL, getDMURL, isEnglish } from '../utils'
import { PersonCardContent } from './PersonCard';
import './styles.css';

export function CourseList({ from, to, phd, show_activation_filter = false }) {
    const [confirmedOnly, setConfirmedOnly] = useState(false);
    if (from === undefined || to === undefined) {
        return <div>Please specify both 'from' and 'to' in order to show the list of courses</div>;
    }
    
    const filter = { from, to, phd };

    const { isLoading, error, data } = useQuery(['conferences', filter], async () => {
        const res = await axios.get(getManageURL('public/courses'), { params: filter });
        const courses = res.data.data;
        if (!courses) {
            throw new Error('Impossibile trovare i corsi di dottorato richiesti');
        }
        return courses;
    });

    if (isLoading || error) {
        return <Loading widget="Lista dei corsi" error={error}></Loading>;
    }

    const en = isEnglish();
    const fallCourses = [];
    const springCourses = [];
    const noDateCourses = [];

    const fromYear = new Date(from).getFullYear();
    const toYear = new Date(to).getFullYear();
    const springDate = new Date(`${toYear}-01-01`);
    const noDate = new Date(`${fromYear}-09-01`);

    for (const course of data) {
        if (show_activation_filter && confirmedOnly && course?.activationStatus !== 'confirmed') {
            continue;
        }
        if (course && course.startDate) {
            const courseStartDate = new Date(course.startDate);
            if (courseStartDate.getTime() == noDate.getTime()) {
                noDateCourses.push(course);
            } else if (courseStartDate < springDate) {
                fallCourses.push(course);
            } else {
                springCourses.push(course);
            }
        }
    }
    
    fallCourses.sort((a, b) => a.title.localeCompare(b.title));
    springCourses.sort((a, b) => a.title.localeCompare(b.title));
    noDateCourses.sort((a, b) => a.title.localeCompare(b.title));

    const renderCourses = (courses) => {
        return courses.map(course => {
            const lecturerCards = course.lecturers.map(lecturer => {
                const showAffiliations = lecturer.affiliations && lecturer.affiliations.length > 0 && 
                    !lecturer.affiliations.some(affiliation => affiliation._id === '641b8b0b840928dc5b8da2e3');
                return <PersonCardContent key={lecturer._id} person={{
                    ...lecturer, affiliations: showAffiliations ? lecturer.affiliations : [],
                }} />;
            });

            const lessons = course.lessons && course.lessons.filter(lesson => Object.keys(lesson).length > 0).length > 0 ? (
                <div>
                    <h5 className="dm-course-section-title">Scheduled lessons</h5>
                    <ul className="dm-course-lessons">
                        {[...course.lessons].sort((a, b) => new Date(a.date) - new Date(b.date)).map((lesson, index) => {
                            let room = lesson.conferenceRoom || null;
                            if (lesson.conferenceRoom && lesson.conferenceRoomID) {
                                const roomUrl = en
                                    ? getDMURL(`/map?sel=${lesson.conferenceRoomID}`)
                                    : getDMURL(`/mappa?sel=${lesson.conferenceRoomID}`);
                                room = <a href={roomUrl}>{lesson.conferenceRoom}</a>;
                            }
                            
                            return (
                                <li key={index}>
                                    <span className="dm-course-lesson-date"><i className="far fa-calendar-alt fa-fw" aria-hidden="true"></i>{' '}{formatDate(lesson.date, 'en-US')}</span>
                                    <span><i className="far fa-clock fa-fw" aria-hidden="true"></i>{' '}{formatTime(lesson.date)} ({lesson.duration} minutes)</span>
                                    {room && <span><i className="fas fa-door-open fa-fw" aria-hidden="true"></i>{' '}{room}</span>}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null;

            return (
                <Accordion title={course.title} badge={course.courseType} badgePosition="left" key={course._id}>
                    <div className="dm-course-content">
                        <section>
                            <h5 className="dm-course-section-title">{course.lecturers.length === 1 ? 'Lecturer' : 'Lecturers'}</h5>
                            <div className="dm-people-cards dm-course-lecturers">{lecturerCards}</div>
                        </section>
                        {course.startDate && course.endDate &&
                        new Date(course.startDate).getTime() !== new Date(course.endDate).getTime() && (
                        <section>
                            <h5 className="dm-course-section-title">Period</h5>
                            <p className="dm-course-period"><i className="far fa-calendar-alt fa-fw" aria-hidden="true"></i>{' '}From {formatDate(course.startDate, 'en-US')} to {formatDate(course.endDate, 'en-US')}</p>
                        </section>
                        )}
                        {lessons}
                        <section className="dm-course-description">
                            <h5 className="dm-course-section-title">Description</h5>
                            <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{course.description}</Markdown>
                        </section>
                    </div>
                </Accordion>
            );
        });
    };

    return (
        <div className="dm-course-list">
            <p className="dm-course-intro">{show_activation_filter
                ? `The catalogue of Ph.D. courses for the academic year ${fromYear}-${toYear} is below:`
                : `The list of Ph.D. courses that will be taught during the academic year ${fromYear}-${toYear} is below:`}</p>
            {show_activation_filter && (
                <div className="dm-course-filter" role="group" aria-label="Course activation filter">
                    <button type="button" className={`btn ${!confirmedOnly ? 'btn-primary' : 'btn-outline-primary'}`}
                        aria-pressed={!confirmedOnly} onClick={() => setConfirmedOnly(false)}>
                        All courses
                    </button>
                    <button type="button" className={`btn ${confirmedOnly ? 'btn-primary' : 'btn-outline-primary'}`}
                        aria-pressed={confirmedOnly} onClick={() => setConfirmedOnly(true)}>
                        Active courses only
                    </button>
                </div>
            )}
            {show_activation_filter && confirmedOnly &&
                noDateCourses.length + fallCourses.length + springCourses.length === 0 && (
                    <p role="status">No active courses are available for this academic year.</p>
                )}
            
            {noDateCourses.length > 0 && (
            <div className="dm-course-group">
                {renderCourses(noDateCourses)}
            </div>
            )}
            
            {fallCourses.length > 0 && (
            <section className="dm-course-group">
                <h4 className="dm-course-term-heading">Fall/Winter Term (starting before January 1st, {toYear})</h4>
                {renderCourses(fallCourses)}
            </section>
            )}
            
            {springCourses.length > 0 && (
            <section className="dm-course-group">
                <h4 className="dm-course-term-heading">Winter/Spring Term (starting after January 1st, {toYear})</h4>
                {renderCourses(springCourses)}
            </section>
            )}
        </div>
        );
}

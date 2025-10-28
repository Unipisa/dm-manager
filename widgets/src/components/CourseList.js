import React from 'react'
import { useQuery } from 'react-query'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import axios from 'axios'
import Accordion from './Accordion';
import { Loading } from './Loading'
import { formatAffiliations, formatDate, formatTime, getManageURL, getDMURL, isEnglish } from '../utils'

export function CourseList({ from, to, phd }) {
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
    const springDate = new Date(`${fromYear + 1}-03-01`);
    const noDate = new Date(`${fromYear}-09-01`);

    for (const course of data) {
        if (course && course.endDate) {
            const courseEndDate = new Date(course.endDate);
            if (courseEndDate.getTime() == noDate.getTime()) {
                noDateCourses.push(course);
            } else if (courseEndDate < springDate) {
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
                const formattedAffiliations = showAffiliations ? formatAffiliations(lecturer.affiliations) : '';
                const hasInternalStaff = lecturer.staffs && lecturer.staffs.some(staff => staff.isInternal === true);
                
                return (
                    <div className="col-lg-6 col-12 py-2" key={lecturer._id}>
                        <div className="card h-100 m-2 shadow-sm">
                            <div className="card-body">
                                {hasInternalStaff ? (
                                    <a href={getDMURL(`en/person-details/?person_id=${lecturer._id}`)}>
                                        <i className="fas fa-id-card fa-fw"></i>
                                    </a>
                                ) : lecturer.personalPage ? (
                                    <a href={lecturer.personalPage} target="_blank" rel="noopener noreferrer">
                                        <i className="fas fa-id-card fa-fw"></i>
                                    </a>
                                ) : (
                                    <i className="fas fa-id-card fa-fw"></i>
                                )}
                                <span className="card-title ml-2 h5">
                                    {lecturer.firstName} {lecturer.lastName} {formattedAffiliations}
                                </span>
                                <br />
                                {lecturer.email && (
                                    <>
                                        <i className="fas fa-at mr-3"></i>
                                        <a href={`mailto:${lecturer.email}`}>{lecturer.email}</a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            });

            const lessons = course.lessons && course.lessons.filter(lesson => Object.keys(lesson).length > 0).length > 0 ? (
                <div>
                    <h5 className="wp-block-heading"><strong>Scheduled lessons:</strong></h5>
                    <ul>
                        {course.lessons.map((lesson, index) => {
                            let room = lesson.conferenceRoom || null;
                            if (lesson.conferenceRoom && lesson.conferenceRoomID) {
                                const roomUrl = en
                                    ? getDMURL(`/map?sel=${lesson.conferenceRoomID}`)
                                    : getDMURL(`/mappa?sel=${lesson.conferenceRoomID}`);
                                room = <a href={roomUrl}>{lesson.conferenceRoom}</a>;
                            }
                            
                            return (
                                <li key={index}>
                                    {formatDate(lesson.date, 'en-US')}, {formatTime(lesson.date)} ({lesson.duration} minutes), {room}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : null;

            return (
                <Accordion title={course.title} badge={course.courseType} key={course._id}>
                    <h5 className="wp-block-heading"><strong>{course.lecturers.length === 1 ? 'Lecturer:' : 'Lecturers:'}</strong></h5>
                    {lecturerCards}
                    {course.startDate && course.endDate && 
                    new Date(course.startDate).getTime() !== new Date(course.endDate).getTime() && (
                    <>
                        <h5 className="wp-block-heading"><strong>Period:</strong></h5>
                        <p>From {formatDate(course.startDate, 'en-US')} to {formatDate(course.endDate, 'en-US')}</p>
                    </>
                    )}
                    {lessons}
                    <h5 className="wp-block-heading"><strong>Description:</strong></h5>
                    <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{course.description}</Markdown>
                </Accordion>
            );
        });
    };

    return (
        <>
            <p>The list of Ph.D. courses that will be taught during the academic year {fromYear}-{toYear} is below:</p>
            <div style={{ height: '5px' }} aria-hidden="true" className="wp-block-spacer"></div>
            
            {noDateCourses.length > 0 && (
            <>
                {renderCourses(noDateCourses)}
                <div style={{ height: '20px' }} aria-hidden="true" className="wp-block-spacer"></div>
            </>
            )}
            
            {fallCourses.length > 0 && (
            <>
                <h4 className="wp-block-heading">Fall/Winter Term</h4>
                {renderCourses(fallCourses)}
                <div style={{ height: '20px' }} aria-hidden="true" className="wp-block-spacer"></div>
            </>
            )}
            
            {springCourses.length > 0 && (
            <>
                <h4 className="wp-block-heading">Winter/Spring Term</h4>
                {renderCourses(springCourses)}
            </>
            )}
        </>
        );
}
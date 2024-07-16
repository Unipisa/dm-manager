import React from 'react'
import { useQuery } from 'react-query'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import axios from 'axios'
import Accordion from './Accordion';
import { Loading } from './Loading'
import { formatAffiliations, formatDate, getManageURL, getDMURL } from '../utils'

export function CourseList({ from, to }) {
    if (from === undefined || to === undefined) {
        return <div>Please specify both 'from' and 'to' in order to show the list of courses</div>;
    }
    
    const filter = { from, to };

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

    const fallCourses = [];
    const springCourses = [];

    const fromYear = new Date(from).getFullYear();
    const toYear = new Date(to).getFullYear();
    const springDate = new Date(`${fromYear + 1}-03-01`);

    for (const course of data) {
        if (course && course.endDate) {
            const courseEndDate = new Date(course.endDate);
            if (courseEndDate < springDate) {
                fallCourses.push(course);
            } else {
                springCourses.push(course);
            }
        }
    }

    const renderCourses = (courses) => {
        return courses.map(course => {
            const lecturerCards = course.lecturers.map(lecturer => {
                const showAffiliations = lecturer.affiliations && lecturer.affiliations.length > 0 && 
                    !lecturer.affiliations.some(affiliation => affiliation._id === '641b8b0b840928dc5b8da2e3');
                const formattedAffiliations = showAffiliations ? formatAffiliations(lecturer.affiliations) : '';
            
                return (
                    <div className="col-lg-6 col-12 py-2" key={lecturer._id}>
                        <div className="card h-100 m-2 shadow-sm">
                            <div className="card-body">
                                {showAffiliations ? (
                                    <i className="fas fa-id-card fa-fw"></i>
                                ) : (
                                    <a href={getDMURL(`en/person-details/?person_id=${lecturer._id}`)}><i className="fas fa-id-card fa-fw"></i></a>
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

            return (
                <Accordion title={course.title} key={course._id}>
                    <h5 className="wp-block-heading"><strong>{course.lecturers.length === 1 ? 'Lecturer:' : 'Lecturers:'}</strong></h5>
                    {lecturerCards}
                    <h5 className="wp-block-heading"><strong>Period:</strong></h5>
                    <p>From {formatDate(course.startDate, 'en-US')} to {formatDate(course.endDate, 'en-US')}</p>
                    <h5 className="wp-block-heading"><strong>Description:</strong></h5>
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{course.description}</Markdown>
                </Accordion>
            );
        });
    };

    return (
        <>
            <p>The list of Ph.D. courses that will be taught during the academic year {fromYear}-{toYear} is below:</p>
            <div style={{ height: '5px' }} aria-hidden="true" className="wp-block-spacer"></div>
            <h4 class="wp-block-heading">Fall/Winter Term</h4>
            {renderCourses(fallCourses)}
            <div style={{ height: '20px' }} aria-hidden="true" className="wp-block-spacer"></div>
            <h4 class="wp-block-heading">Winter/Spring Term</h4>
            {renderCourses(springCourses)}
        </>
    );
}
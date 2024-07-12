import React from 'react'
import { useQuery } from 'react-query'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import axios from 'axios'
import Accordion from './Accordion';
import { Loading } from './Loading'
import { getManageURL } from '../utils'

export function CourseList({ from, to}) {
    const filter = { from, to }

    const { isLoading, error, data } = useQuery([ 'conferences', filter ], async () => {
        const res = await axios.get(getManageURL("public/courses"), { params: filter })
        const courses = res.data.data;
        if (!courses) {
            throw new Error("Impossibile trovare i corsi di dottorato richiesti");
        }
        return courses;
    })

    if (isLoading || error) {
        return <Loading widget="Lista dei corsi" error={error}></Loading>
    }

    var courses_block = []
    for (var i = 0; i < data.length; i++) {
        const course = data[i];
        if (typeof(course) != 'undefined') {
            const lecturerCards = course.lecturers.map(lecturer => (
                <div class="col-lg-6 col-12 py-2" key={lecturer._id}>
                    <div class="card h-100 m-2 shadow-sm">
                        <div class="card-body">
                            <i class="fas fa-id-card fa-fw"></i>
                            <span class="card-title ml-2 h5">{lecturer.firstName} {lecturer.lastName}</span>
                            <br></br>
                            <i class="fas fa-at mr-3"></i>
                            <a href={`mailto:${lecturer.email}`}>{lecturer.email}</a>
                        </div>
                    </div>
                </div>
            ));

            courses_block.push(
                <Accordion title={course.title}>
                    <h5 class="wp-block-heading"><strong>Lecturer:</strong></h5>
                        {lecturerCards}
                    <h5 class="wp-block-heading"><strong>Period:</strong></h5>
                        <p>Dal Al</p>
                    <h5 class="wp-block-heading"><strong>Description:</strong></h5>
                        <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{course.description}</Markdown>
                </Accordion>
            );
        }
    }

    return <>
        {courses_block}
    </>
}
import { Button, Table } from 'react-bootstrap'

import * as Icon from 'react-bootstrap-icons'
import { Link } from 'react-router-dom';
import { useEngine } from '../Engine';
import Loading from './Loading';

/** @typedef {import('../models/EventPhdCourse').Lesson} Lesson */

/**
 * Formats a UTC date to "YYYY-MM-DD HH:mm"
 * @type {(date: string | Date) => string}
 */
const formatDate = (date) => {
    if (typeof date === 'string') date = new Date(date)

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;

    return formattedDate;
}

export const isValidDate = (dateString) => {
    try {
        parseDate(dateString)
        return true
    } catch (e) {
        return false
    }
}

export const parseDate = (dateString) => {
    const [datePart, timePart] = dateString.trim().split(/\s+/g)
    const [year, month, day] = datePart.split('-')
    const [hours, minutes] = timePart.split(':')
    
    console.log(year, month, day, hours, minutes)
    
    if (year === undefined || month === undefined || day === undefined || hours === undefined || minutes === undefined) {
        throw new Error('invalid date format, expected "YYYY-MM-DD HH:mm"')
    }

    const utcDate = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, // Months are zero-based
        parseInt(day, 10),
        parseInt(hours, 10),
        parseInt(minutes, 10)
    )

    return utcDate
}

/**
 * @param {{ lessons: Lesson[], deleteLesson: (index: number) => void }} props 
 */
export const LessonTable = ({ lessons, deleteLesson }) => {
    const isEdit = !!deleteLesson

    const ConferenceRoom = ({ id }) => {
        const engine = useEngine()
        const { isSuccess, data } = engine.useGet('conference-room', id)

        if (!isSuccess) return <Loading />
        const { ConferenceRoom } = engine.Models
        return <Link key={data._id} to={ConferenceRoom.viewUrl(data._id)}>{ConferenceRoom.describe(data)}</Link>
    }

    return (
        <Table className="align-middle">
            <thead className="thead-dark">
                <tr>
                    <th>Orario</th>
                    <th>Durata (minuti)</th>
                    <th>Stanza</th>
                    {isEdit && <th></th>}
                </tr>
            </thead>
            <tbody>
                {lessons.map((lesson, i) => (
                    <tr key={i}>
                        <td>{formatDate(lesson.date)}</td>
                        <td>{lesson.duration}</td>
                        <td>
                            <ConferenceRoom id={lesson.conferenceRoom} />
                        </td>
                        {isEdit && (
                            <td>
                                <Button 
                                    className="btn btn-danger btn-sm"
                                    onClick={() => deleteLesson(i)}>
                                    <Icon.Trash />
                                </Button>
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </Table>
    )
}
import { Button, Table } from 'react-bootstrap'

import * as Icon from 'react-bootstrap-icons'
import { Link } from 'react-router-dom';
import { useEngine } from '../Engine';
import { formatDate } from './DatetimeInput';
import Loading from './Loading';

/** @typedef {import('../models/EventPhdCourse').Lesson} Lesson */

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
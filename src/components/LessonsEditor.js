import { useState } from 'react';
import { Button, ButtonGroup, Form, Table } from 'react-bootstrap'
import * as Icon from 'react-bootstrap-icons'
import { Link } from 'react-router-dom';

import { useEngine } from '../Engine';
import { DatetimeInput, formatDate } from './DatetimeInput';
import { ConferenceRoomInput, NumberInput } from './Input';
import Loading from './Loading';

/** @typedef {import('../models/EventPhdCourse').Lesson} Lesson */

const ConferenceRoom = ({ id }) => {
    const engine = useEngine()
    const { isSuccess, data } = engine.useGet('conference-room', id)

    if (!isSuccess) return <Loading />
    const { ConferenceRoom } = engine.Models
    return <Link key={data._id} to={ConferenceRoom.viewUrl(data._id)}>{ConferenceRoom.describe(data)}</Link>
}

export const LessonFormFields = ({ idPrefix, dateTime, setDateTime, duration, setDuration, conferenceRoom, setConferenceRoom }) => {
    console.log(idPrefix)

    return (
        <>
            <Form.Group className="row my-2">
                <Form.Label className="text-end col-sm-2 col-form-label" htmlFor={`${idPrefix}-datetime`}>
                    Orario
                </Form.Label>
                <div className="col-sm-10">
                    <DatetimeInput
                        id={`${idPrefix}-datetime`}
                        value={dateTime}
                        setValue={setDateTime} />
                </div>
            </Form.Group>
            <Form.Group className="row my-2">
                <Form.Label className="text-end col-sm-2 col-form-label" htmlFor={`${idPrefix}-duration`}>
                    Durata
                </Form.Label>
                <div className="col-sm-10">
                    <NumberInput 
                        id={`${idPrefix}-duration`}
                        value={duration}
                        setValue={setDuration} />
                </div>
            </Form.Group>
            <Form.Group className="row my-2">
                <Form.Label className="text-end col-sm-2 col-form-label" htmlFor={`${idPrefix}-room`}>
                    Aula
                </Form.Label>
                <div className="col-sm-10">
                    <ConferenceRoomInput 
                        id={`${idPrefix}-room`}
                        value={conferenceRoom}
                        setValue={setConferenceRoom} />
                </div>
            </Form.Group>    
        </>
    )
}

const EditLessonForm = ({ idPrefix, close, lesson, updateLesson, deleteLesson }) => {
    const [dateTime, setDateTime] = useState(lesson.date)
    const [duration, setDuration] = useState(lesson.duration)
    const [conferenceRoom, setConferenceRoom] = useState(lesson.conferenceRoom)

    const update = () => {
        updateLesson({
            ...lesson,
            date: dateTime,
            duration: duration,
            conferenceRoom: conferenceRoom,
        })

        close()
    }
    
    return (
        <div>
            <h4 className="mt-2 mb-3">Modifica Lezione</h4>
            <LessonFormFields idPrefix={idPrefix} {...{
                dateTime, setDateTime,
                duration, setDuration,
                conferenceRoom, setConferenceRoom,
            }}/>
            <ButtonGroup className="mt-3">
                <Button 
                    className="btn-primary"
                    onClick={() => update()}>
                    Modifica Lezione
                </Button>
                <Button
                    className="btn btn-secondary"
                    onClick={() => close()}>
                    Annulla Modifiche
                </Button>
                <Button
                    className="btn btn-danger"
                    onClick={() => deleteLesson()}>
                    Elimina Lezione
                </Button>
            </ButtonGroup>
        </div>
    )
}

const LessonEditRow = ({ id, lesson, updateLesson, deleteLesson }) => {
    const [editing, setEditing] = useState(false)

    if (editing) 
        return (
            <td colSpan={4}>
                <EditLessonForm {...{
                    idPrefix: `${id}-edit`,
                    lesson,
                    close: () => setEditing(false),
                    updateLesson,
                    deleteLesson,
                }} />
            </td>
        )
    else
        return (
            <>
                <td>{formatDate(lesson.date)}</td>
                <td>{lesson.duration}</td>
                <td>
                    <ConferenceRoom id={lesson.conferenceRoom} />
                </td>
                <td className="d-flex justify-content-end gap-2">
                    <Button 
                        className="btn btn-warning btn-sm"
                        onClick={() => setEditing(true)}>
                        <Icon.Pencil />
                    </Button>
                    <Button 
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteLesson()}>
                        <Icon.Trash />
                    </Button>
                </td>
            </>
        )
}


const LessonViewRow = ({ lesson }) => {
    return (
        <>
            <td>{formatDate(lesson.date)}</td>
            <td>{lesson.duration}</td>
            <td>
                <ConferenceRoom id={lesson.conferenceRoom} />
            </td>
        </>
    )
}

/**
 * @param {{ 
 *      lessons: Lesson[],
 *      updateLesson: (index: number, newValue: Lesson) => void,
 *      deleteLesson: (index: number) => void
 *  }} props 
 */
const LessonsEditor = ({ lessons, updateLesson, deleteLesson }) => {
    const isEdit = !!updateLesson && !!deleteLesson

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
                        {isEdit ? (
                            <LessonEditRow id={`lesson-${i}`} {...{ 
                                lesson, 
                                updateLesson: lesson => updateLesson(i, lesson), 
                                deleteLesson: () => deleteLesson(i), 
                            }} />
                        ) : (
                            <LessonViewRow lesson={lesson} />
                        )}
                    </tr>
                ))}
            </tbody>
        </Table>
    )
}


export default LessonsEditor

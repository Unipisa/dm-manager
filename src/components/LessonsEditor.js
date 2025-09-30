import { useState, useEffect } from 'react';
import { Button, ButtonGroup, Form, Table } from 'react-bootstrap'
import * as Icon from 'react-bootstrap-icons'
import { Link } from 'react-router-dom';

import { useEngine } from '../Engine';
import { DatetimeInput, formatDate } from './DatetimeInput';
import { ConferenceRoomInput, NumberInput } from './Input';
import { handleRoomBooking, getRoomBookingStatus } from '../processes/RoomsBookings'

/** @typedef {import('../models/EventPhdCourse').Lesson} Lesson */

const ConferenceRoomOutput = ({ value }) => {
    const engine = useEngine()
    if (!value)
        return <>???</>
    const { ConferenceRoom } = engine.Models
    return <Link to={ConferenceRoom.viewUrl(value._id)}>{value.name}</Link>
}

export const LessonFormFields = ({ idPrefix, dateTime, setDateTime, duration, setDuration, conferenceRoom, setConferenceRoom, roomWarning }) => {
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
                    {roomWarning && (
                        <div className="text-muted small mt-1" style={{ fontSize: '0.875rem' }}>
                            {roomWarning}
                        </div>
                    )}
                </div>
            </Form.Group>
        </>
    )
}

const EditLessonForm = ({ idPrefix, close, lesson, updateLesson, deleteLesson }) => {
    const [dateTime, setDateTime] = useState(lesson.date)
    const [duration, setDuration] = useState(lesson.duration)
    const [conferenceRoom, setConferenceRoom] = useState(lesson.conferenceRoom)
    const [roomWarning, setRoomWarning] = useState('')

    useEffect(() => {
        const updateRoomWarning = async () => {
            if (conferenceRoom && dateTime && duration) {
                try {
                    const lessonData = {
                        conferenceRoom,
                        startDatetime: dateTime,
                        duration,
                        mrbsBookingID: lesson.mrbsBookingID // Use the original booking ID for checking
                    }
                    const result = await handleRoomBooking(lessonData, 'courses')
                    setRoomWarning(result.warning || '')
                } catch (error) {
                    setRoomWarning('')
                }
            } else {
                setRoomWarning('')
            }
        }
        updateRoomWarning()
    }, [conferenceRoom, dateTime, duration, lesson.mrbsBookingID])

    const update = () => {
        updateLesson({
            ...lesson,
            date: dateTime,
            duration,
            conferenceRoom,
            // mrbsBookingID stays the same - we don't let users edit it manually
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
                roomWarning,
            }}/>
            <ButtonGroup className="mt-3">
                <Button className="btn-primary" onClick={() => update()}>Modifica Lezione</Button>
                <Button className="btn btn-secondary" onClick={() => close()}>Annulla Modifiche</Button>
                <Button className="btn btn-danger" onClick={() => deleteLesson()}>Elimina Lezione</Button>
            </ButtonGroup>
        </div>
    )
}

const LessonEditRow = ({ id, lesson, updateLesson, deleteLesson }) => {
    const [editing, setEditing] = useState(false)
    const [bookingStatus, setBookingStatus] = useState('')

    useEffect(() => {
        if (!editing) {
            const checkBookingStatus = async () => {
                if (lesson.conferenceRoom && lesson.date && lesson.duration) {
                    try {
                        const lessonData = {
                            conferenceRoom: lesson.conferenceRoom,
                            startDatetime: lesson.date,
                            duration: lesson.duration,
                            mrbsBookingID: lesson.mrbsBookingID
                        }
                        const result = await handleRoomBooking(lessonData, 'courses')
                        setBookingStatus(getRoomBookingStatus(result, lesson.mrbsBookingID))
                    } catch (error) {
                        setBookingStatus(lesson.mrbsBookingID ? `ID: ${lesson.mrbsBookingID}` : 'Nessuna prenotazione')
                    }
                } else {
                    setBookingStatus(lesson.mrbsBookingID ? `ID: ${lesson.mrbsBookingID}` : 'Nessuna prenotazione')
                }
            }
            checkBookingStatus()
        }
    }, [lesson, editing])

    if (editing) 
        return (
            <td colSpan={5}>
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
                <td><ConferenceRoomOutput value={lesson.conferenceRoom} /></td>
                <td>{bookingStatus}</td>
                <td className="d-flex justify-content-end gap-2">
                    <Button className="btn btn-warning btn-sm" onClick={() => setEditing(true)}>
                        <Icon.Pencil />
                    </Button>
                    <Button className="btn btn-danger btn-sm" onClick={() => deleteLesson()}>
                        <Icon.Trash />
                    </Button>
                </td>
            </>
        )
}

const LessonViewRow = ({ lesson }) => {
    const [bookingStatus, setBookingStatus] = useState('')

    useEffect(() => {
        const checkBookingStatus = async () => {
            if (lesson.conferenceRoom && lesson.date && lesson.duration) {
                try {
                    const lessonData = {
                        conferenceRoom: lesson.conferenceRoom,
                        startDatetime: lesson.date,
                        duration: lesson.duration,
                        mrbsBookingID: lesson.mrbsBookingID
                    }
                    const result = await handleRoomBooking(lessonData, 'courses')
                    console.log(result)
                    setBookingStatus(getRoomBookingStatus(result, lesson.mrbsBookingID))
                } catch (error) {
                    setBookingStatus(lesson.mrbsBookingID ? `ID: ${lesson.mrbsBookingID}` : 'Nessuna prenotazione')
                }
            } else {
                setBookingStatus(lesson.mrbsBookingID ? `ID: ${lesson.mrbsBookingID}` : 'Nessuna prenotazione')
            }
        }
        checkBookingStatus()
    }, [lesson])

    return (
        <>
            <td>{formatDate(lesson.date)}</td>
            <td>{lesson.duration}</td>
            <td><ConferenceRoomOutput value={lesson.conferenceRoom} /></td>
            <td>{bookingStatus}</td>
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
                    <th>Prenotazione Rooms</th>
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

import { useEffect, useState } from 'react'
import { useParams, Navigate, useSearchParams } from 'react-router-dom'
import { Button, ButtonGroup, Card, Container, Form } from 'react-bootstrap'

import Loading from '../components/Loading'
import { useEngine } from '../Engine'
import { ModelHeading } from '../components/ModelHeading'
import { NumberInput, PersonInput, RoomInput, StringInput } from '../components/Input'
import moment from 'moment'
import { isValidDate, LessonTable, parseDate } from '../components/PhdCourseLessonList'

/** @typedef {import('../models/EventPhdCourse').Lesson} Lesson */

const sortBy = (list, compareFn) => {
    const clone = [...list]
    clone.sort((a, b) => compareFn(a, b))
    return clone
}

const compareValue = (v1, v2) => {
    // capita di confrontare una stringa con una data
    if (JSON.stringify(v1) === JSON.stringify(v2)) return true
    if (typeof(v1) !== typeof(v2)) return false
    if (Array.isArray(v1)) {
        if (v1.length !== v2.length) return false
        return v1.every((v, i) => compareValue(v, v2[i]))
    }
    if (typeof(v1) === 'object') return (v1?._id && v1?._id === v2?._id)
    return v1 === v2
}

/**
 * @type {Record<string, (addLesson: (l: Lesson) => void, lesson: Lesson, count: number?) => void}
 */
const CADENCE_TEMPLATE_GENERATORS = {
    'single': (addLesson, lesson) => {
        addLesson(lesson)
    },
    'weekly-1': (addLesson, lesson, count) => {
        for (let i = 0; i < count; i++) {
            addLesson({ ...lesson, date: moment(lesson.date).add(i, 'weeks').toDate() })
        }
    },
    'weekly-2': (addLesson, lesson, count) => {
        for (let i = 0; i < count; i++) {
            addLesson({ ...lesson, date: moment(lesson.date).add(i * 2, 'weeks').toDate() })
        }
    },
    'monthly': (addLesson, lesson, count) => {
        for (let i = 0; i < count; i++) {
            addLesson({ ...lesson, date: moment(lesson.date).add(i, 'months').toDate() })
        }
    },
}

const GenerateLessonForm = ({ addLesson, close, ...rest }) => {
    const [dateTime, setDateTime] = useState('')
    const [duration, setDuration] = useState(120)
    const [room, setRoom] = useState(null)

    const [cadence, setCadence] = useState('single')
    const [repetitions, setRepetitions] = useState(1)

    const handleGenerateLessons = () => {
        const date = parseDate(dateTime)

        const baseLesson = { date, duration, room: room._id }
        CADENCE_TEMPLATE_GENERATORS[cadence]?.(addLesson, baseLesson, repetitions)
        
        close()
    }

    return (
        <Container {...rest}>
            <Form.Group className="row my-2">
                <Form.Label className="text-end col-sm-2 col-form-label" htmlFor="new-lesson-start">
                    Orario
                </Form.Label>
                <div className="col-sm-10">
                    <input
                        className={["form-control", !isValidDate(dateTime) && "is-invalid"].filter(Boolean).join(' ')} 
                        id="new-lesson-start"
                        type="text"
                        value={dateTime}
                        onChange={e => setDateTime(e.target.value)}
                        placeholder="YYYY-MM-DD HH:mm" 
                    />
                </div>
            </Form.Group>
            <Form.Group className="row my-2">
                <Form.Label className="text-end col-sm-2 col-form-label" htmlFor="new-lesson-duration">
                    Durata
                </Form.Label>
                <div className="col-sm-10">
                    <NumberInput 
                        id="new-lesson-duration"
                        value={duration}
                        setValue={setDuration} />
                </div>
            </Form.Group>
            <Form.Group className="row my-2">
                <Form.Label className="text-end col-sm-2 col-form-label" htmlFor="new-lesson-room">
                    Aula
                </Form.Label>
                <div className="col-sm-10">
                    <RoomInput 
                        id="new-lesson-room"
                        value={room}
                        setValue={setRoom} />
                </div>
            </Form.Group>
            <Form.Group className="row my-2">
                <Form.Label className="text-end col-sm-2 col-form-label" htmlFor="new-lesson-repeat-cadence">
                    Cadenza
                </Form.Label>
                <div className="col-sm-10">
                    <select 
                        id="new-lesson-repeat-cadence"
                        className="form-control" 
                        value={cadence}
                        onChange={e => setCadence(e.target.value)}
                    >
                        <option value="single">Non ripetere</option>
                        <option value="weekly-1">Settimanale</option>
                        <option value="weekly-2">Ogni due settimane</option>
                        <option value="monthly">Ogni mese</option>
                    </select>
                </div>
            </Form.Group>
            {cadence !== 'single' && (
                <Form.Group className="row my-2">
                    <Form.Label className="text-end col-sm-2 col-form-label" htmlFor="new-lesson-repeat-count">
                        N° Ripetizioni
                    </Form.Label>
                    <div className="col-sm-10">
                        <NumberInput 
                            id="new-lesson-repeat-count"
                            value={repetitions}
                            setValue={setRepetitions} />
                    </div>
                </Form.Group>
            )}
            <ButtonGroup className="offset-sm-8 col-sm-4">
                <Button 
                    className="btn-primary"
                    onClick={() => handleGenerateLessons()}>
                    Genera
                </Button>
                <Button 
                    className="btn-secondary"
                    onClick={() => close()}>
                    Annulla
                </Button>
            </ButtonGroup>
        </Container>
    )
}

export default function PhdCourseEditPage({ Model }) {
    const params = useParams()
    const id = params.id
    
    const [searchParams] = useSearchParams()
    const clone_id = searchParams.get('clone')
    
    const [redirect, setRedirect] = useState(null)

    const create = id === 'new'
    const [modifiedObj, setModifiedObj] = useState(null)
    const engine = useEngine()
    const putObj = engine.usePut(Model.code)
    const patchObj = engine.usePatch(Model.code)
    const engineDeleteObj = engine.useDelete(Model.code)

    const { status, data } = engine.useGet(Model.code, id)
    const { status: cloneStatus, data: cloneData } = engine.useGet(Model.code, clone_id ?? null)
    
    useEffect(() => {
        if (clone_id) {
            if (cloneStatus === "success") {
                setModifiedObj(cloneData)
            }
        } else {
            if (status === "success") {
                setModifiedObj(data)
            }
        }
    }, [clone_id, status, cloneStatus, data, cloneData])

    const [showGenerateLessonForm, setShowGenerateLessonForm] = useState(false)

    if (redirect !== null) return <Navigate to={redirect} />

    if (status === "error") return <div>errore caricamento</div>
    if (status === "loading") return <Loading />
    if (modifiedObj === null) return <Loading />

    const originalObj = data
    const modifiedFields = Object.keys(modifiedObj)
        .filter(key => !compareValue(modifiedObj[key], originalObj[key]))
    const changed = modifiedFields.length > 0

    const deleteLesson = (index) => {
        setModifiedObj(obj => ({
            ...obj,
            lessons: [
                ...obj.lessons.slice(0, index),
                ...obj.lessons.slice(index + 1),
            ]
        }))
    }
    
    const addLesson = lesson => {
        setModifiedObj(obj => ({
            ...obj,
            lessons: sortBy(
                [
                    ...obj.lessons,
                    lesson,
                ],
                (l1, l2) => new Date(l1.date) - new Date(l2.date),
            )
        }))
    }

    const submit = async () => {
        if (modifiedObj._id) {
            await patchObj(modifiedObj)
            engine.addInfoMessage(`Corso di dottorato modificato`)
            setRedirect(Model.viewUrl(originalObj._id))
        } else {
            const resultObj = await putObj(modifiedObj)
            engine.addInfoMessage(`Nuovo corso di dottorato "${Model.describe(resultObj)}" inserito`)
            setRedirect(Model.viewUrl(resultObj._id))
        }
    }

    const deletePhdCourse = async () => {
        await engineDeleteObj(originalObj)
        engine.addWarningMessage(`Corso di Dottorato ${Model.describe(originalObj)} eliminato`)
        setRedirect(Model.indexUrl())
    }

    return (
        <>
            <ModelHeading model={Model}/>
            <Card>
                <Card.Header>
                    <h3>
                        {create 
                            ? "Nuovo Corso di Dottorato" 
                            : `Modifica Corso di Dottorato ${Model.describe(modifiedObj)}`}
                    </h3>
                </Card.Header>
                <Card.Body>
                    <Form onSubmit={e => e.preventDefault()}>
                        <Form.Group className="row my-2">
                            <Form.Label className="col-sm-2 col-form-label" htmlFor={"title"} style={{textAlign: "right"}}>
                                Titolo
                            </Form.Label>
                            <div className="col-sm-10">
                                <StringInput 
                                    id="title"
                                    value={modifiedObj.title}
                                    setValue={value => {
                                        setModifiedObj(obj => ({
                                            ...obj,
                                            title: value,
                                        }))
                                    }}
                                />
                            </div>
                            <div className="col-sm-2"></div>
                        </Form.Group>
                        <Form.Group className="row my-2">
                            <Form.Label className="col-sm-2 col-form-label" htmlFor={"lecturer"} style={{textAlign: "right"}}>
                                Docente
                            </Form.Label>
                            <div className="col-sm-10">
                                <PersonInput 
                                    id="lecturer"
                                    value={modifiedObj.lecturer}
                                    setValue={value => {
                                        setModifiedObj(obj => ({
                                            ...obj,
                                            lecturer: value,
                                        }))
                                    }}
                                />
                            </div>
                            <div className="col-sm-2"></div>
                        </Form.Group>
                        <Form.Group className="row my-2">
                            <Form.Label className="col-sm-2 col-form-label" htmlFor={"lecturer"} style={{textAlign: "right"}}>
                                Lezioni
                            </Form.Label>
                            <div className="col-sm-10">
                                {!showGenerateLessonForm 
                                    ? (
                                        <Button 
                                            className="offset-sm-9 col-sm-3 btn-primary"
                                            onClick={() => setShowGenerateLessonForm(true)}
                                        >
                                            Aggiungi Lezioni
                                        </Button>
                                    ) : (
                                        <GenerateLessonForm 
                                            className="mb-3"
                                            addLesson={addLesson}
                                            close={() => setShowGenerateLessonForm(false)} />
                                    )}
                                <Container>
                                    <LessonTable 
                                        lessons={modifiedObj.lessons}
                                        deleteLesson={deleteLesson} />
                                </Container>
                            </div>
                        </Form.Group>
                        <ButtonGroup className="mt-3">
                            <Button 
                                className="btn-primary"
                                disabled= { !changed }
                                onClick={() => submit()}>
                                {create ? "Aggiungi Corso di Dottorato" : "Salva Modifiche"}
                            </Button>
                            <Button
                                className="btn btn-secondary"
                                onClick={() => setRedirect(originalObj._id ? Model.viewUrl(originalObj._id) : Model.indexUrl())}>
                                Annulla Modifiche
                            </Button>
                            {!create && (
                                <Button 
                                    className="btn btn-danger pull-right"
                                    onClick={() => deletePhdCourse()}>
                                    Elimina {Model.describe(modifiedObj)}
                                </Button>
                            )}
                        </ButtonGroup>
                    </Form>
                </Card.Body>
            </Card>
        </>     
    )
}

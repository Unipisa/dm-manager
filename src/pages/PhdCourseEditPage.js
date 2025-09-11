import { useEffect, useState } from 'react'
import { useParams, Navigate, useSearchParams } from 'react-router-dom'
import { Button, ButtonGroup, Card, Container, Form } from 'react-bootstrap'

import { useEngine } from '../Engine'
import { DateInput, NumberInput, PersonInput, SelectInput, StringInput, TextInput } from '../components/Input'

import Loading from '../components/Loading'
import { ModelHeading } from '../components/ModelHeading'
import LessonsEditor, { LessonFormFields } from '../components/LessonsEditor'

import moment from 'moment'

/** @typedef {import('../models/EventPhdCourse').Lesson} Lesson */

const sortBy = (list, compareFn) => {
    const clone = [...list]
    clone.sort((a, b) => compareFn(a, b))
    return clone
}

const compareValue = (v1, v2) => {
    // capita di confrontare una stringa con una data
    if (JSON.stringify(v1) === JSON.stringify(v2)) return true
    // if (typeof(v1) !== typeof(v2)) return false
    // if (Array.isArray(v1)) {
    //     if (v1.length !== v2.length) return false
    //     return v1.every((v, i) => compareValue(v, v2[i]))
    // }
    // if (typeof(v1) === 'object') return (v1?._id && v1?._id === v2?._id)
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
    const [duration, setDuration] = useState(60)
    const [conferenceRoom, setConferenceRoom] = useState(null)

    const [cadence, setCadence] = useState('single')
    const [repetitions, setRepetitions] = useState(1)

    const {addErrorMessage} = useEngine()

    const handleGenerateLessons = () => {
        if (!conferenceRoom) {
            addErrorMessage("Non ha inserito un'aula conferenze")
            return
        }

        const baseLesson = { date: dateTime, duration, conferenceRoom: conferenceRoom._id }
        CADENCE_TEMPLATE_GENERATORS[cadence]?.(addLesson, baseLesson, repetitions)
        
        close()
    }

    return (
        <Container {...rest}>
            <LessonFormFields idPrefix="new-lesson" {...{
                dateTime, setDateTime,
                duration, setDuration,
                conferenceRoom, setConferenceRoom,
            }} />
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

    const create = id === '__new__'
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
                delete cloneData._id
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

    const updateLesson = (index, newLesson) => {
        setModifiedObj(obj => ({
            ...obj,
            lessons: [
                ...obj.lessons.slice(0, index),
                newLesson,
                ...obj.lessons.slice(index + 1),
            ]
        }))
    }

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
                            <Form.Label className="col-sm-2 col-form-label" htmlFor={"description"} style={{textAlign: "right"}}>
                                Descrizione
                            </Form.Label>
                            <div className="col-sm-10">
                                <TextInput 
                                    id="description"
                                    value={modifiedObj.description}
                                    setValue={value => {
                                        setModifiedObj(obj => ({
                                            ...obj,
                                            description: value,
                                        }))
                                    }}
                                />
                            </div>
                            <div className="col-sm-2"></div>
                        </Form.Group>
                        <Form.Group className="row my-2">
                            <Form.Label className="col-sm-2 col-form-label" htmlFor={"phd"} style={{textAlign: "right"}}>
                                Dottorato in
                            </Form.Label>
                            <div className="col-sm-10">
                                <SelectInput 
                                    id="phd"
                                    options={["Matematica", "HPSC"]}
                                    value={modifiedObj.phd}
                                    setValue={value => {
                                        setModifiedObj(obj => ({
                                            ...obj,
                                            phd: value,
                                        }))
                                    }}
                                />
                            </div>
                            <div className="col-sm-2"></div>
                        </Form.Group>
                        <Form.Group className="row my-2">
                            <Form.Label className="col-sm-2 col-form-label" htmlFor={"courseType"} style={{textAlign: "right"}}>
                                Tipo
                            </Form.Label>
                            <div className="col-sm-10">
                                <SelectInput 
                                    id="courseType"
                                    options={["", "Foundational", "Methodological", "Thematic"]}
                                    value={modifiedObj.courseType || ""}
                                    setValue={value => {
                                        setModifiedObj(obj => ({
                                            ...obj,
                                            courseType: value === "" ? null : value,
                                        }))
                                    }}
                                />
                            </div>
                            <div className="col-sm-2"></div>
                        </Form.Group>
                        <Form.Group className="row my-2">
                            <Form.Label className="col-sm-2 col-form-label" htmlFor={"start-date"} style={{textAlign: "right"}}>
                                Data inizio
                            </Form.Label>
                            <div className="col-sm-10">
                                <DateInput 
                                    id="start-date"
                                    value={modifiedObj.startDate}
                                    setValue={value => {
                                        setModifiedObj(obj => ({
                                            ...obj,
                                            startDate: value,
                                        }))
                                    }}
                                />
                            </div>
                            <div className="col-sm-2"></div>
                        </Form.Group>
                        <Form.Group className="row my-2">
                            <Form.Label className="col-sm-2 col-form-label" htmlFor={"end-date"} style={{textAlign: "right"}}>
                                Data fine
                            </Form.Label>
                            <div className="col-sm-10">
                                <DateInput 
                                    id="end-date"
                                    value={modifiedObj.endDate}
                                    setValue={value => {
                                        setModifiedObj(obj => ({
                                            ...obj,
                                            endDate: value,
                                        }))
                                    }}
                                />
                            </div>
                            <div className="col-sm-2"></div>
                        </Form.Group>
                        <Form.Group className="row my-2">
                            <Form.Label className="col-sm-2 col-form-label" style={{textAlign: "right"}}>
                                Docente/i
                            </Form.Label>
                            <div className="col-sm-10">
                                <PersonInput 
                                    id="lecturers"
                                    multiple={true}
                                    value={modifiedObj.lecturers}
                                    setValue={value => {
                                        setModifiedObj(obj => ({
                                            ...obj,
                                            lecturers: value,
                                        }))
                                    }}
                                />
                            </div>
                            <div className="col-sm-2"></div>
                        </Form.Group>
                        <Form.Group className="row my-2">
                            <Form.Label className="col-sm-2 col-form-label" style={{textAlign: "right"}}>
                                Referente/i
                            </Form.Label>
                            <div className="col-sm-10">
                                <PersonInput 
                                    id="coordinators"
                                    multiple={true}
                                    value={modifiedObj.coordinators}
                                    setValue={value => {
                                        setModifiedObj(obj => ({
                                            ...obj,
                                            coordinators: value,
                                        }))
                                    }}
                                />
                            </div>
                            <div className="col-sm-2"></div>
                        </Form.Group>
                        <Form.Group className="row my-2">
                            <Form.Label className="col-sm-2 col-form-label" style={{textAlign: "right"}}>
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
                                    <LessonsEditor 
                                        lessons={modifiedObj.lessons}
                                        updateLesson={updateLesson}
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

import { Button, Card, Form, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { useQuery, useQueryClient } from 'react-query'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import 'katex/dist/katex.min.css'

import { InputRow, DateInput, NumberInput, SelectInput, StringInput, TextInput } from '../components/Input'
import LessonsEditor, { LessonFormFields } from '../components/LessonsEditor'
import { PrefixProvider } from './PrefixProvider'
import Loading from '../components/Loading'
import { setter, useEngine } from '../Engine'
import { SelectPeopleBlock } from './SelectPeopleBlock'

import moment from 'moment'


export default function Course() {
    const { id } = useParams()

    const { isLoading, error, data } = useQuery([ 'process', 'course', id ], async function () {
        var course = { 
            title: "", 
            description: "",
            phd: "",
            courseType: null,
            startDate: null,
            endDate: null,
            lecturers: null,
            lessons: [] // Initialize lessons as empty array
        }

        if (id) {
            const res = await api.get(`/api/v0/process/courses/get/${id}`)
            course = res.data[0]

            // If the course could not be loaded, then either it does not exist, or it 
            // was created by another user. Either way, we need to give an understandable
            // error to the end user. 
            if (! course) {
                return;
            }

            course._id = id
        }

        return {
            course, 
            forbidden: !course
        }            
    })

    if (isLoading) return <Loading error={error}></Loading>
    if (error) return <div>{`${error}`}</div>

    return <CourseBody course={data.course} forbidden={data.forbidden}/>
}

export function CourseBody({ course, forbidden }) {
    const [data, setData] = useState(course)
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    if (forbidden) {
        return <div>
            <h4>Accesso negato</h4>
            <p>
                Il corso selezionato non esiste, oppure è stato creato da un altro utente.
                Nel secondo caso, solo l'utente che l'ha originariamente creato (o un amministratore)  
                può modificarne il contenuto. 
            </p>
            <p>
                Nel caso sia necessario l'intervento di un amministratore, scrivere 
                all'indirizzo <a href="mailto:help@dm.unipi.it">help@dm.unipi.it</a>.
            </p>
        </div>
    }

    const onCompleted = async () => {
        // Insert the course in the database
        await api.put('/api/v0/process/courses/save', data)
        queryClient.invalidateQueries([ 'process', 'course', data._id ])
        navigate('/process/courses')
    }

    return <PrefixProvider value="process/courses">
        <h1 className="text-primary pb-4">
            { course._id 
                ? "Modifica corso" 
                : "Inserimento nuovo corso" }
        </h1>
        <CourseDetailsBlock 
            data={data} setData={setData}
            onCompleted={onCompleted}
            active={true}
        />
    </PrefixProvider>
}

export function CourseDetailsBlock({ onCompleted, data, setData, change, active, error }) {
    const user = useEngine().user
    const isAdmin = user.roles && user.roles.includes('admin')

    const requirement = (()=>{
        if (!data.title || typeof data.title !== 'string' || data.title.trim() === "") return "Inserire il titolo del corso"
        if (!data.phd) return "Inserire il dottorato del corso"
        if (!data.startDate) return "Inserire la data di inizio del corso"
        if (!data.endDate) return "Inserire la data di fine del corso"
        if (new Date(data.startDate) > new Date(data.endDate)) return "Data di fine anteriore alla data di inizio"
        if (!data.lecturers || data.lecturers.length === 0) return "Inserire almeno un organizzatore per il corso"
        return ""
    })()

    // Functions to manage lessons
    const updateLesson = (index, newLesson) => {
        setData(prevData => {
            const newLessons = [...prevData.lessons]
            newLessons[index] = newLesson
            return { ...prevData, lessons: newLessons }
        })
    }

    const deleteLesson = (index) => {
        setData(prevData => {
            const newLessons = prevData.lessons.filter((_, i) => i !== index)
            return { ...prevData, lessons: newLessons }
        })
    }

    const addLesson = (newLesson) => {
        setData(prevData => {
            const updatedLessons = [...(prevData.lessons || []), newLesson]
            // Sort lessons by date (like in the admin page)
            updatedLessons.sort((l1, l2) => new Date(l1.date) - new Date(l2.date))
            return {
                ...prevData,
                lessons: updatedLessons
            }
        })
    }

    return <PrefixProvider value="process/courses">
        <Card className="shadow">
            <Card.Header>
                <div className="d-flex d-row justify-content-between">
                    <div>
                        Dettagli del corso
                    </div>
                    <div>
                    { isAdmin && data._id && <a href={`/event-course/${data._id}`}>{data._id}</a>}    
                    { change && !active &&  
                        <Button className="text-end btn-warning btn-sm" onClick={change}>
                            Modifica
                        </Button>
                    }</div>
                </div>  
            </Card.Header>
            <Card.Body>
            { active ? <>
                <Form>
                    <InputRow label="Titolo" className="my-3">
                        <StringInput value={data.title} setValue={setter(setData,'title')}/>
                    </InputRow>
                    <InputRow label="Docente/i" className="my-3">
                        <SelectPeopleBlock people={data.lecturers || []} setPeople={people => setData(data => ({...data, lecturers: people}))} prefix="process/courses"/>
                    </InputRow>
                    <InputRow label="Data di inizio" className="my-3">
                        <DateInput value={data.startDate} setValue={setter(setData,'startDate')}/>
                    </InputRow>
                    <InputRow label="Data di fine" className="my-3">
                        <DateInput value={data.endDate} setValue={setter(setData, 'endDate')}/>
                    </InputRow>
                    <InputRow label="Dottorato in" className="my-3">
                        <SelectInput 
                            value={data.phd} 
                            setValue={setter(setData, "phd")} 
                            options={["Matematica", "HPSC"]}
                        />
                    </InputRow>
                    <InputRow label="Tipo" className="my-3">
                        <div className="d-flex align-items-center">
                            <OverlayTrigger placement="left" overlay={<Tooltip id="course-type-tooltip">
                                Questo campo è necessario solo per i corsi del dottorato in HPSC</Tooltip>}>
                                <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                            </OverlayTrigger>
                            <SelectInput 
                                value={data.courseType ?? ""} 
                                setValue={(val) => {
                                    const normalizedValue = val === "" ? null : val;
                                    setter(setData, "courseType")(normalizedValue);
                                }} 
                                 options={["", "Foundational", "Methodological", "Thematic"]}
                            />
                        </div>
                    </InputRow>
                    <InputRow className="my-3" label="Descrizione">
                        <div className="d-flex align-items-start">
                            <OverlayTrigger placement="left" overlay={<Tooltip id="description-tooltip">
                                Si ricorda che potete scrivere sia in LaTex (utilizzando $ per le formule) 
                                che in Markdown <a href="https://www.markdownguide.org/">https://www.markdownguide.org/</a>
                                <br />
                                L'anteprima della descrizione verrà mostrata più sotto mentre scrivi.
                                </Tooltip>}>
                                <Button size="sm" style={{ marginRight: '10px' }}>?</Button>
                            </OverlayTrigger>   
                            <TextInput value={data.description} setValue={setter(setData,'description')}/>
                        </div>
                    </InputRow>
                </Form>
                {error && <div className="alert alert-danger">{error}</div>}
                {requirement && <div className="alert alert-warning">{requirement}</div>}
                <div className="d-flex flex-row justify-content-end">
                    <Button className="text-end" onClick={onCompleted} disabled={requirement!==''}>Salva</Button>
                </div>
            </> : <>
                titolo: <b>{data.title}</b><br/>
                data inizio: <b>{data.startDate}</b><br/>
                data fine: <b>{data.endDate}</b><br/>
                phd: <b>{data.phd}</b><br/>
                courseType: <b>{data.courseType}</b><br/>
                descrizione: <b>{data.description}</b><br/>
                creato da: <b>{data.createdBy?.username || data.createdBy?.email || '???'}</b><br/>
                {/* Display lessons in read-only mode */}
                {data.lessons && data.lessons.length > 0 && (
                    <>
                        <br/>
                        <strong>Lezioni:</strong><br/>
                        <LessonsEditor lessons={data.lessons} />
                    </>
                )}
            </>}
            </Card.Body>
        </Card>
        
        {active && (
            <Card className="shadow mt-3">
                <Card.Header>
                    <div className="d-flex d-row justify-content-between align-items-center">
                        <div>Gestione Lezioni</div>
                        
                    </div>
                </Card.Header>
                <Card.Body>
                    {data.lessons && data.lessons.length > 0 ? (
                        <LessonsEditor 
                            lessons={data.lessons}
                            updateLesson={updateLesson}
                            deleteLesson={deleteLesson}
                        />
                    ) : (
                        <p className="text-muted">Nessuna lezione inserita. Clicca "Aggiungi Lezione" per iniziare.</p>
                    )}
                    <AddLessonButton onAdd={addLesson} />
                </Card.Body>
            </Card>
        )}

        { data.description && 
            <Card className="shadow mt-3" style={{maxWidth:"60em"}}>
                <Card.Header>Anteprima descrizione</Card.Header>
                <Card.Body>
                <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{data.description}</Markdown>
                </Card.Body>
            </Card>
        }
</PrefixProvider>
}

function AddLessonButton({ onAdd }) {
    const [showForm, setShowForm] = useState(false)
    const [dateTime, setDateTime] = useState(new Date())
    const [duration, setDuration] = useState(60)
    const [conferenceRoom, setConferenceRoom] = useState(null)
    const [cadence, setCadence] = useState('single')
    const [repetitions, setRepetitions] = useState(1)

    const handleAdd = () => {
        if (!dateTime || !duration || !conferenceRoom) return

        const baseLesson = { date: dateTime, duration, conferenceRoom }

        switch (cadence) {
            case 'single':
                onAdd(baseLesson)
                break
            case 'weekly-1':
                for (let i = 0; i < repetitions; i++) {
                    onAdd({ ...baseLesson, date: moment(dateTime).add(i, 'weeks').toDate() })
                }
                break
            case 'weekly-2':
                for (let i = 0; i < repetitions; i++) {
                    onAdd({ ...baseLesson, date: moment(dateTime).add(i * 2, 'weeks').toDate() })
                }
                break
            case 'monthly':
                for (let i = 0; i < repetitions; i++) {
                    onAdd({ ...baseLesson, date: moment(dateTime).add(i, 'months').toDate() })
                }
                break
            default:
                onAdd(baseLesson)
        }

        // reset
        setDateTime(new Date())
        setDuration(60)
        setConferenceRoom(null)
        setCadence('single')
        setRepetitions(1)
        setShowForm(false)
    }

    const handleCancel = () => {
        setDateTime(new Date())
        setDuration(60)
        setConferenceRoom(null)
        setCadence('single')
        setRepetitions(1)
        setShowForm(false)
    }

    if (!showForm) {
        return (
            <Button className="btn-sm" onClick={() => setShowForm(true)}>
                Aggiungi Lezione
            </Button>
        )
    }

    return (
        <div className="w-100">
            <h5>Nuova Lezione</h5>
            <LessonFormFields 
                idPrefix="new-lesson"
                dateTime={dateTime}
                setDateTime={setDateTime}
                duration={duration}
                setDuration={setDuration}
                conferenceRoom={conferenceRoom}
                setConferenceRoom={setConferenceRoom}
            />

            <Form.Group className="row my-2">
                <Form.Label className="text-end col-sm-2 col-form-label">Cadenza</Form.Label>
                <div className="col-sm-10">
                    <select className="form-control" value={cadence} onChange={e => setCadence(e.target.value)}>
                        <option value="single">Non ripetere</option>
                        <option value="weekly-1">Settimanale</option>
                        <option value="weekly-2">Ogni due settimane</option>
                        <option value="monthly">Ogni mese</option>
                    </select>
                </div>
            </Form.Group>

            {cadence !== 'single' && (
                <Form.Group className="row my-2">
                    <Form.Label className="text-end col-sm-2 col-form-label">N° Ripetizioni</Form.Label>
                    <div className="col-sm-10">
                        <NumberInput value={repetitions} setValue={setRepetitions} />
                    </div>
                </Form.Group>
            )}

            <div className="mt-3">
                <Button className="me-2" onClick={handleAdd} disabled={!dateTime || !duration || !conferenceRoom}>
                    Aggiungi
                </Button>
                <Button className="btn-secondary" onClick={handleCancel}>Annulla</Button>
            </div>
        </div>
    )
}
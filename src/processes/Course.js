import { Button, Card, Form, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { useQuery, useQueryClient } from 'react-query'
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import 'katex/dist/katex.min.css'
import { formatDate } from '../components/DatetimeInput'
import { InputRow, DateInput, NumberInput, SelectInput, StringInput, TextInput } from '../components/Input'
import LessonsEditor, { LessonFormFields } from '../components/LessonsEditor'
import { PrefixProvider } from './PrefixProvider'
import Loading from '../components/Loading'
import { setter, useEngine } from '../Engine'
import { SelectPeopleBlock } from './SelectPeopleBlock'
import { handleRoomBooking, createRoomBooking, deleteBooking } from './RoomsBookings'

import moment from 'moment'

export default function Course({variant}) {
    // variant è '' per /process/courses
    // ed è 'my/' per /process/my/courses    
    const { id } = useParams()

    const { isLoading, error, data } = useQuery([ 'process', variant, 'course', id ], async function () {
        var course = { 
            title: "", 
            description: "",
            phd: "",
            courseType: null,
            startDate: null,
            endDate: null,
            lecturers: null,
            coordinators: null,
            lessons: [] // Initialize lessons as empty array
        }

        if (id) {
            const res = await api.get(`/api/v0/process/${variant}courses/get/${id}`)
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

    return <CourseBody course={data.course} forbidden={data.forbidden} variant={variant}/>
}

export function CourseBody({ course, forbidden, variant }) {
    const [data, setData] = useState(course)
    const [originalLessons, setOriginalLessons] = useState(course.lessons || [])
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [bookingActions, setBookingActions] = useState(null)
    const [isProcessingBookings, setIsProcessingBookings] = useState(false)

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

    const analyzeBookingActions = async (currentLessons, originalLessons) => {
        const actions = {
            toBook: [],      // New lessons or lessons with changed details
            toDelete: [],    // Lessons that were deleted
            toUpdate: [],    // Existing lessons with booking that need updating
            conflicts: [],   // Lessons that can't be booked due to conflicts
            noChange: [],    // Lessons with valid existing bookings
            external: []     // Lessons in external rooms (no booking needed)
        }

        // Find deleted lessons (in original but not in current)
        for (const originalLesson of originalLessons) {
            const lessonId = originalLesson._id
            if (lessonId && !currentLessons.find(l => l._id === lessonId)) {
                if (originalLesson.mrbsBookingID) {
                    actions.toDelete.push({
                        lesson: originalLesson,
                        bookingId: originalLesson.mrbsBookingID
                    })
                }
            }
        }

        // Check each current lesson
        for (const lesson of currentLessons) {
            if (!lesson.conferenceRoom || !lesson.date || !lesson.duration) {
                continue // Skip incomplete lessons
            }

            // Check if room is external (no mrbsRoomID)
            if (!lesson.conferenceRoom.mrbsRoomID) {
                actions.external.push({ lesson })
                continue
            }

            // Find if this lesson existed before
            const originalLesson = lesson._id 
                ? originalLessons.find(l => l._id === lesson._id)
                : null

            const hasChanged = originalLesson && (
                new Date(lesson.date).getTime() !== new Date(originalLesson.date).getTime() ||
                lesson.duration !== originalLesson.duration ||
                lesson.conferenceRoom._id !== originalLesson.conferenceRoom?._id
            )

            // Check room availability
            try {
                const lessonData = {
                    conferenceRoom: lesson.conferenceRoom,
                    startDatetime: lesson.date,
                    duration: lesson.duration,
                    mrbsBookingID: lesson.mrbsBookingID,
                    title: data.title
                }
                const result = await handleRoomBooking(lessonData, `${variant}courses`)

                if (result.type === 'available') {
                    if (result.message === "No changes" && lesson.mrbsBookingID) {
                        actions.noChange.push({ lesson, result })
                    } else if (hasChanged && lesson.mrbsBookingID) {
                        // Existing lesson with booking that has changed
                        actions.toUpdate.push({ 
                            lesson, 
                            result,
                            oldBookingId: lesson.mrbsBookingID,
                            roomData: result.roomData
                        })
                    } else if (!lesson.mrbsBookingID) {
                        // New lesson needs booking
                        actions.toBook.push({ 
                            lesson, 
                            result,
                            roomData: result.roomData
                        })
                    }
                } else if (result.type === 'unavailable') {
                    actions.conflicts.push({ lesson, result })
                    // If there was a booking before, we need to delete it
                    if (lesson.mrbsBookingID) {
                        actions.toDelete.push({
                            lesson,
                            bookingId: lesson.mrbsBookingID
                        })
                    }
                }
            } catch (error) {
                console.error('Error checking lesson availability:', error)
            }
        }

        return actions
    }

    const onCompleted = async () => {
        const actions = await analyzeBookingActions(data.lessons || [], originalLessons)
        
        // Check if there are any booking actions needed
        const hasActions = actions.toBook.length > 0 || 
                        actions.toDelete.length > 0 || 
                        actions.toUpdate.length > 0 || 
                        actions.conflicts.length > 0

        if (hasActions) {
            setBookingActions(actions)
            setShowBookingModal(true)
        } else {
            // No booking actions needed, just save
            await saveCourse()
        }
    }

    const saveCourse = async (executeBookings = false) => {
        try {
            if (executeBookings && bookingActions) {
                setIsProcessingBookings(true)
                
                // Delete bookings first
                for (const action of bookingActions.toDelete) {
                    try {
                        await deleteBooking(action.bookingId, `${variant}courses`)
                        console.log(`Deleted booking ${action.bookingId}`)
                    } catch (error) {
                        console.error(`Error deleting booking ${action.bookingId}:`, error)
                    }
                }

                // Update bookings (delete old, create new)
                for (const action of bookingActions.toUpdate) {
                    try {
                        await deleteBooking(action.oldBookingId, `${variant}courses`)
                        const bookingResult = await createRoomBooking({
                                ...action.roomData,
                                organizers: data.coordinators || []
                            }, `${variant}courses`)
                        if (bookingResult.success) {
                            // Update the lesson with new booking ID
                            const lessonIndex = data.lessons.findIndex(l => l === action.lesson)
                            if (lessonIndex !== -1) {
                                data.lessons[lessonIndex].mrbsBookingID = bookingResult.bookingId
                            }
                        }
                    } catch (error) {
                        console.error('Error updating booking:', error)
                    }
                }

                // Create new bookings
                for (const action of bookingActions.toBook) {
                    try {
                        const bookingResult = await createRoomBooking({
                            ...action.roomData,
                            organizers: data.coordinators || []
                        }, `${variant}courses`)
                        if (bookingResult.success) {
                            // Update the lesson with booking ID
                            const lessonIndex = data.lessons.findIndex(l => l === action.lesson)
                            if (lessonIndex !== -1) {
                                data.lessons[lessonIndex].mrbsBookingID = bookingResult.bookingId
                            }
                        }
                    } catch (error) {
                        console.error('Error creating booking:', error)
                    }
                }
            }

            // Save the course
            await api.put(`/api/v0/process/${variant}courses/save`, data)
            queryClient.invalidateQueries(['process', variant, 'course', data._id])
            setOriginalLessons([...data.lessons])
            navigate(`/process/${variant}courses`)
        } catch (error) {
            console.error('Error saving course:', error)
        } finally {
            setIsProcessingBookings(false)
            setShowBookingModal(false)
        }
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
            variant={variant}
        />
        <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Riepilogo Prenotazioni</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {bookingActions && (
                    <div>
                        {bookingActions.toBook.length > 0 && (
                            <div className="mb-3">
                                <h6>✓ Lezioni da prenotare su Rooms ({bookingActions.toBook.length}):</h6>
                                <ul>
                                    {bookingActions.toBook.map((action, i) => (
                                        <li key={i}>
                                            {formatDate(action.lesson.date)} - {action.lesson.conferenceRoom.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {bookingActions.toUpdate.length > 0 && (
                            <div className="mb-3">
                                <h6>↻ Lezioni da aggiornare su Rooms ({bookingActions.toUpdate.length}):</h6>
                                <ul>
                                    {bookingActions.toUpdate.map((action, i) => (
                                        <li key={i}>
                                            {formatDate(action.lesson.date)} - {action.lesson.conferenceRoom.name}
                                            <small className="text-muted"> (la prenotazione precedente verrà cancellata e ricreata)</small>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {bookingActions.toDelete.length > 0 && (
                            <div className="mb-3">
                                <h6>✗ Prenotazioni da cancellare su Rooms ({bookingActions.toDelete.length}):</h6>
                                <ul>
                                    {bookingActions.toDelete.map((action, i) => (
                                        <li key={i}>
                                            {formatDate(action.lesson.date)} - {action.lesson.conferenceRoom?.name || 'Aula rimossa'}
                                            <small className="text-muted"> (ID: {action.bookingId})</small>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {bookingActions.conflicts.length > 0 && (
                            <div className="mb-3 alert alert-warning">
                                <h6>⚠ Conflitti - Impossibile prenotare su Rooms ({bookingActions.conflicts.length}):</h6>
                                <ul>
                                    {bookingActions.conflicts.map((action, i) => (
                                        <li key={i}>
                                            {formatDate(action.lesson.date)} - {action.lesson.conferenceRoom.name}
                                            <br />
                                            <small>{action.result.warning}</small>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {bookingActions.noChange.length > 0 && (
                            <div className="mb-3">
                                <h6 className="text-muted">✓ Prenotazioni esistenti valide su Rooms ({bookingActions.noChange.length})</h6>
                            </div>
                        )}

                        {bookingActions.external.length > 0 && (
                            <div className="mb-3">
                                <h6 className="text-muted">ℹ Aule esterne - nessuna prenotazione su Rooms necessaria ({bookingActions.external.length})</h6>
                            </div>
                        )}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button 
                    variant="secondary" 
                    onClick={() => setShowBookingModal(false)}
                    disabled={isProcessingBookings}
                >
                    Annulla
                </Button>
                <Button 
                    variant="primary" 
                    onClick={() => saveCourse(true)}
                    disabled={isProcessingBookings}
                >
                    {isProcessingBookings ? 'Salvando...' : 'Continua'}
                </Button>
            </Modal.Footer>
        </Modal>
    </PrefixProvider>
}

export function CourseDetailsBlock({ onCompleted, data, setData, change, active, error, variant }) {
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
                    <InputRow label="Referente/i" className="my-3">
                        <SelectPeopleBlock people={data.coordinators || []} setPeople={people => setData(data => ({...data, coordinators: people}))} prefix="process/courses"/>
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
                        <LessonsEditor lessons={data.lessons} variant={variant} />
                    </>
                )}
            </>}
            </Card.Body>
        </Card>
        
        {active && (
            <Card className="shadow mt-3">
                <Card.Header>
                    <div className="d-flex d-row justify-content-between align-items-center">
                        <div>Gestione Lezioni (le prenotazioni su Rooms sono gestite quando si preme "Salva")</div>
                    </div>
                </Card.Header>
                <Card.Body>
                    {data.lessons && data.lessons.length > 0 ? (
                        <LessonsEditor 
                            lessons={data.lessons}
                            updateLesson={updateLesson}
                            deleteLesson={deleteLesson}
                            variant={variant}
                        />
                    ) : (
                        <p className="text-muted">Nessuna lezione inserita. Clicca "Aggiungi Lezione" per iniziare.</p>
                    )}
                    <AddLessonButton onAdd={addLesson} variant={variant} />
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

function AddLessonButton({ onAdd, variant }) {
    const [showForm, setShowForm] = useState(false)
    const [dateTime, setDateTime] = useState(new Date())
    const [duration, setDuration] = useState(60)
    const [conferenceRoom, setConferenceRoom] = useState(null)
    const [cadence, setCadence] = useState('single')
    const [repetitions, setRepetitions] = useState(1)
    const [roomWarning, setRoomWarning] = useState('')

    useEffect(() => {
        const updateRoomWarning = async () => {
            if (cadence !== 'single') {
                // Show warning for repeated lessons
                setRoomWarning('Quando una cadenza è selezionata, far attenzione ai messaggi di disponibilità delle aule dopo aver generato le lezioni')
            } else if (conferenceRoom && dateTime && duration) {
                // Check room availability only for single lessons
                try {
                    const lessonData = {
                        conferenceRoom,
                        startDatetime: dateTime,
                        duration,
                        mrbsBookingID: null
                    }
                    const result = await handleRoomBooking(lessonData, `${variant}courses`)
                    setRoomWarning(result.warning || '')
                } catch (error) {
                    setRoomWarning('')
                }
            } else {
                setRoomWarning('')
            }
        }
        updateRoomWarning()
    }, [conferenceRoom, dateTime, duration, cadence, variant])

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
                roomWarning={roomWarning}
                variant={variant}
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

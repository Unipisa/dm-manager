import { useQuery, useQueryClient } from 'react-query'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import api from '../api'
import { useState } from 'react'
import { ModalDeleteDialog } from '../components/ModalDialog'
import { formatDate } from '../components/DatetimeInput'
import { useEngine } from '../Engine'

export default function ManageCourses() {
    return (
        <CourseList></CourseList>
    )
}

function CourseList() {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteObjectName, setDeleteObjectName] = useState(null)
    const [deleteCourseId, setDeleteCourseId] = useState(null)

    const queryClient = useQueryClient()
    const { isLoading, error, data } = useQuery([ 'process', 'courses' ])

    if (isLoading) {
        return "Loading"
    }

    if (error) {
        return "Error: " + error.message
    }

    const deleteCourse = async (response) => {
        setDeleteCourseId(null)
        setDeleteObjectName(null)
        setShowDeleteDialog(false)

        if (! response) {
            return
        }
        try {
            await api.del("/api/v0/process/courses/" + deleteCourseId)
        }
        catch {
            console.log("Error while deleting the course")
        }
        
        queryClient.invalidateQueries([ 'process', 'courses' ])
    }

    const confirmDeleteCourse = async (id) => {
        setDeleteCourseId(id)
        setDeleteObjectName("il corso")
        setShowDeleteDialog(true)
    }

    return <>
        <h1 className="text-primary pb-0">Gestione corsi di dottorato</h1>
        <ModalDeleteDialog show={showDeleteDialog} objectName={deleteObjectName} handleClose={deleteCourse}></ModalDeleteDialog>
        <a href="/process/courses/add">
            <button className="btn btn-primary my-3">Nuovo corso di dottorato</button>
        </a>
        <div className="row">
            {data.data.map(course => 
                <div className="p-3 col-lg-6 p-0" key={"course-" + course._id}>
                    <Course course={course} onDelete={() => confirmDeleteCourse(course._id)} />
                </div>
            )}
        </div>
        <hr />
        <div>
        <i>Chi può accedere a questa pagina?</i><br />
        Questa pagina è accessibile a tutti gli utenti 
        con permesso <i>/process/courses</i>.
        </div>
    </>
}

function Course({course, onDelete}) {
    const user = useEngine().user
    const isAdmin = user.roles && user.roles.includes('admin')

    return <Card className="shadow">
        <Card.Header className="h6">
            <div className="d-flex d-row justify-content-between">
                <div>Corso</div>
                {isAdmin && <a href={`/event-phd-course/${course._id}`}>{course._id}</a>}
            </div>
        </Card.Header>
        <Card.Body>
            <strong>Titolo</strong>: {course.title} <br></br>
            <strong>Phd</strong>: {course.phd}<br></br>
            <strong>Data inizio</strong>: {formatDate(course.startDate, false)}<br></br>
            <strong>Data fine</strong>: {formatDate(course.endDate, false)}<br></br>
            <div className="mt-2 d-flex flex-row justify-content-end">                        
                {onDelete && <button className="ms-2 btn btn-danger" onClick={onDelete}>
                    Elimina
                </button>}
                <Link className="ms-2" to={"/process/courses/add/" + course._id}>
                    <button className="btn btn-primary">
                        Modifica
                    </button>
                </Link>
            </div>
        </Card.Body>                
    </Card>
}
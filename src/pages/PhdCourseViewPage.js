import { useParams, useNavigate } from 'react-router-dom'
import { Button, ButtonGroup, Card, Container } from 'react-bootstrap'

import { ObjectProvider, useObject } from '../components/ObjectProvider'

import Timestamps from '../components/Timestamps'
import { ModelHeading } from '../components/ModelHeading'
import { ModelFieldOutput } from '../components/ModelOutput'
import LessonsEditor from '../components/LessonsEditor'

const PhdCourseView = ({ Model }) => {
    const obj = useObject()
    const navigate = useNavigate()

    const schema = Model.schema.fields

    return (
        <Card>
            <Card.Header>
                <h3>{Model.name} {Model.describe(obj)}</h3>
            </Card.Header>
            <Card.Body>
                <p>
                    <strong className="align-top">Titolo: </strong>
                    <ModelFieldOutput key="title" field="title" schema={schema.title} value={obj.title} />
                </p>
                <p>
                    <strong className="align-top">Data Inizio: </strong>
                    <ModelFieldOutput key="startDate" field="startDate" schema={schema.startDate} value={obj.startDate} />
                </p>
                <p>
                    <strong className="align-top">Data Fine: </strong>
                    <ModelFieldOutput key="endDate" field="endDate" schema={schema.endDate} value={obj.endDate} />
                </p>
                <p>
                    <strong className="align-top">Dottorato in: </strong>
                    <ModelFieldOutput key="phd" field="phd" schema={schema.phd} value={obj.phd} />
                </p>
                <p>
                    <strong className="align-top">Tipo: </strong>
                    <ModelFieldOutput key="courseType" field="courseType" schema={schema.courseType} value={obj.courseType} />
                </p>
                <p>
                    <strong className="align-top">Docente/i: </strong>
                    <ModelFieldOutput key="lecturers" field="lecturers" schema={schema.lecturers} value={obj.lecturers} />
                </p>
                <p>
                    <strong className="align-top">Descrizione: </strong>
                    <ModelFieldOutput key="description" field="description" schema={schema.description} value={obj.description} />
                </p>
                <h4>Lezioni</h4>
                <Container>
                    <LessonsEditor lessons={obj.lessons} />
                </Container>
                <ButtonGroup>
                    <Button key='edit' className="btn-warning" onClick={() => navigate('edit')}>
                        Modifica
                    </Button>
                    <Button key='clone' className="btn-primary" onClick={() => navigate(`${Model.editUrl('__new__')}?clone=${obj._id}`)}>
                        Duplica
                    </Button>
                </ButtonGroup>
            </Card.Body>
            <Card.Footer>
                <Timestamps obj={obj} />
            </Card.Footer>
        </Card>
    )
}

export default function PhdCourseViewPage({ Model }) {
    const params = useParams()
    const id = params.id

    return <>
        <ObjectProvider path={Model.code} id={id}>
            <ModelHeading model={Model} />
            <PhdCourseView Model={Model} />
        </ObjectProvider>
    </>
}


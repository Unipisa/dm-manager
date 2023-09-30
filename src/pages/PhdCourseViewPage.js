import { useParams } from 'react-router-dom'
import { ModelHeading } from '../components/ModelHeading'

import { ObjectProvider, useObject } from '../components/ObjectProvider'
// import RelatedDetails from '../components/RelatedDetails'

import { Button, ButtonGroup, Card, Container } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import Timestamps from '../components/Timestamps'
import { ModelFieldOutput } from '../components/ModelOutput'
import { LessonTable } from '../components/PhdCourseLessonList'

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
                    <strong className="align-top">titolo: </strong>
                    <ModelFieldOutput key="title" field="title" schema={schema.title} value={obj.title} />
                </p>
                <p>
                    <strong className="align-top">docente: </strong>
                    <ModelFieldOutput key="lecturer" field="lecturer" schema={schema.lecturer} value={obj.lecturer} />
                </p>
                <h4>Lezioni</h4>
                <Container>
                    <LessonTable lessons={obj.lessons} />
                </Container>
                <ButtonGroup>
                    <Button key='edit' className="btn-warning" onClick={() => navigate('edit')}>
                        Modifica
                    </Button>
                    <Button key='clone' className="btn-primary" onClick={() => navigate(`${Model.editUrl('new')}?clone=${obj._id}`)}>
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


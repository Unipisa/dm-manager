import { useEffect, useState } from 'react'
import { Route, useParams, useSearchParams, Navigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Button, ButtonGroup, Card, Form } from 'react-bootstrap'

import ModelsPage from '../pages/ModelsPage'
import ModelViewPage from '../pages/ModelViewPage'


import Loading from '../components/Loading'
import { useEngine } from '../Engine'
import { ModelHeading } from '../components/ModelHeading'
import { StringInput, TextInput } from '../components/Input'

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

const EditPage = ({ Model }) => {
    const params = useParams()
    const id = params.id
    
    const [searchParams] = useSearchParams()
    const clone_id = searchParams.get('clone')
    
    const [ redirect, setRedirect ] = useState(null)

    const create = id === 'new'
    const [modifiedObj, setModifiedObj] = useState(null)
    const engine = useEngine()
    // const putObj = engine.usePut(objCode)
    // const patchObj = engine.usePatch(objCode)
    // const engineDeleteObj = engine.useDelete(objCode)

    const { status, data } = engine.useGet(Model.code, id)
    
    useEffect(() => {
        if (status === "success") {
            setModifiedObj(data)
        }
    }, [status, data])

    if (redirect !== null) return <Navigate to={redirect} />

    if (status === "error") return <div>errore caricamento</div>
    if (status === "loading") return <Loading />
    if (modifiedObj === null) return <Loading />

    const originalObj = data
    const modifiedFields = Object.keys(modifiedObj)
        .filter(key => !compareValue(modifiedObj[key], originalObj[key]))
    const changed = modifiedFields.length > 0

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
                        <Form.Label className="col-sm-2 " htmlFor={"title"} style={{textAlign: "right"}}>
                            Titolo
                        </Form.Label>
                        <div className="col-sm-10">
                            <StringInput id="title" />                     
                        </div>
                        <div className="col-sm-2"></div>
                        <div className="col-sm-10 form-text">Help text</div>
                    </Form.Group>
                        <ButtonGroup className="mt-3">
                            <Button 
                                className="btn-primary"
                                disabled= { !changed }>
                                {create ? "Aggiungi Corso di Dottorato" : "Salva Modifiche"}
                            </Button>
                            <Button className="btn btn-secondary">
                                Annulla Modifiche
                            </Button>
                            {!create && (
                                <Button className="btn btn-danger pull-right">
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

export default class EventPhdCourse {
    constructor() {
        this.ModelName = "EventPhdCourse"
        
        this.code = "event-phd-course"
        this.name = "corso di dottorato"
        this.oa = "o"
        this.articulation = {
            'oggetto': "corso di dottorato", 
            'oggetti': "corsi di dottorato",
            'l\'oggetto': "il corso di dottorato",
            'gli oggetti': "i corsi di dottorato", 
            'un oggetto': "un corso di dottorato", 
        }
        this.indexDefaultFilter = {'_sort': 'title', '_limit': 10}
        this.columns = {
            'title': 'Titolo',
            'lecturer': 'Docente',
        }

        this.schema = null

        this.IndexPage = ModelsPage
        this.ViewPage = ModelViewPage
        this.EditPage = EditPage
    }

    // absolute url of objects index
    indexUrl() {return `/${this.code}`}
    
    // absolute url of object with given id
    viewUrl(id) {return `/${this.code}/${id}`}

    // absolute url of object with given id
    editUrl(id) {return `/${this.code}/${id}/edit`}

    // info about elements to be added into the menu bar
    menuElements(user) {
        return user && this.schema && user.hasSomeRole(...this.schema.supervisorRoles) ? [
            {
                key: this.code,
                url: this.indexUrl(), 
                text: 'Corsi di Dottorato',
                category: 'eventi',
            },
        ] : [];
    }

    homeElements(user) {
        if (user.hasSomeRole(...this.schema.managerRoles)) {
            return [<Link to={this.indexUrl()}>Gestire i Corsi di Dottorato</Link>]
        } else if (user.hasSomeRole(...this.schema.supervisorRoles)) {
            return [<Link to={this.indexUrl()}>Visualizzare i Corsi di Dottorato</Link>]
        } else {
            return []
        }    
    }

    // brief description of given object
    describe(obj) {
        return `"${obj.title}"`;
    }

    onObjectChange(setObj) {}

    routers() {
        const MyModelsPage = ({ Model }) => {
            // react component to render index page
            // cannot use directly ModelsPage because
            // otherwise react thinks it is the same component
            // for each model
            return <ModelsPage Model={Model} />
        }

        let MyIndex = null 
        if (this.IndexPage === ModelsPage) MyIndex = MyModelsPage
        else if (this.IndexPage) MyIndex = this.IndexPage

        const indexRouter = MyIndex
            && <Route path={this.indexUrl()} element={<MyIndex Model={this}/>} />
        const viewRouter = this.ViewPage
            && <Route path={this.viewUrl(":id")} element={<this.ViewPage Model={this}/>} />
        const editRouter = this.EditPage  
            && <Route path={this.editUrl(":id")} element={<this.EditPage Model={this}/>} />

        return [indexRouter, viewRouter, editRouter].filter(Boolean)
    }    
}

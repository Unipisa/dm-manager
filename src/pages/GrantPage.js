import { useState } from 'react'
import { Card, Form, Button, ButtonGroup } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import { useEngine, myDateFormat } from '../Engine'
import { StringInput, DateInput, TextInput, ListInput, SelectInput } from '../components/Input'

export default function GrantPage() {
    const objCode = 'grant'
    const objName = 'grant'
    const indexUrl = '/grants'
    const empty = {
        name: "",
        identifier: "", 
        project_type: "", 
        funds: "National",
        funding_entity: "", 
        pi: "", 
        local_coordinator: "", 
        members: [], 
        startDate: null, 
        endDate: null, 
        website: "", 
        budget_amount: "0", 
        description: "", 
        keywords: [], 
        ssd: "",
    }

    const engine = useEngine()
    const { id } = useParams()
    const create = (id === 'new')
    const [ edit, setEdit ] = useState(create)
    const [ obj, setObj ] = useState(create ? empty : null)
    const [ redirect, setRedirect ] = useState(null)
    const query = engine.useGet(objCode, id)
    const putObj = engine.usePut(objCode, (obj) => {
        engine.addInfoMessage(`nuovo ${objName} ${obj.name} inserito`)
        setRedirect(indexUrl)
    })
    const patchObj = engine.usePatch(objCode, (response) => {
        engine.addInfoMessage(`${objName} ${obj.name} modificato`)
        setRedirect(indexUrl)
    })
    const deleteObj = engine.useDelete(objCode, (response, obj) => {
        engine.addWarningMessage(`${objName} ${obj.name} eliminato`)
        setRedirect(indexUrl)
    })

    if (obj === null) {
        if (query.isSuccess) {
            setObj(query.data)
        }
        return <div>caricamento...</div>
    }

    const original = create ? empty : query.data

    const changed = Object.entries(obj).some(([key, val])=>{
            return val !== original[key]})

    const submit = async (evt) => {
        if (obj._id) {
            let payload = Object.fromEntries(Object.keys(empty)
                .filter(key => obj[key]!==original[key])
                .map(key => ([key, obj[key]])))
            payload._id = obj._id
            patchObj(payload)
        } else {
            putObj(obj)
        }
    }

    if (redirect !== null) return <Navigate to={redirect} />

    return <Card>
        <Card.Header>
            <h3>{ create ? `nuovo ${objName}` : `${objName} ${obj?.name}` }</h3>
        </Card.Header>
        <Card.Body>
        <Form onSubmit={ (event) => event.preventDefault() }
        >
            <StringInput name="name" label="nome" store={ obj } setStore={ setObj } edit={ edit }/> 
            <StringInput name="identifier" label="id" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="projectType" label="tipo" store={ obj } setStore={ setObj } edit={ edit }/>
            <SelectInput name="funds" label="fondi" options={["National", "International"]} store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="fundingEntity" label="ente erogatore" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="pi" label="principal investigator" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="localCoordinator" label="coordinatore locale" store={ obj } setStore={ setObj } edit={ edit }/>
            <ListInput name="members" label="membri" store={ obj } setStore= { setObj } edit={ edit }/>
            <DateInput name="startDate" label="inizio" store={ obj } setStore={ setObj } edit={ edit }/>
            <DateInput name="endDate" label="fine" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="webSite" label="sito web" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="budgetAmount" label="ammontare budget" store={ obj } setStore={ setObj } edit={ edit }/>
            <TextInput name="description" label="descrizione" store={ obj } setStore={ setObj } edit={ edit }/>
            <ListInput name="keywords" label="parole chiave" store={ obj } setStore={ setObj } edit={ edit }/>
            <StringInput name="ssd" label="SSD" store={ obj } setStore={ setObj } edit={ edit }/>
            <TextInput name="notes" label="note" store={ obj } setStore={ setObj } edit={ edit }/>
            { edit ?
                <ButtonGroup className="mt-3">
                    <Button 
                        onClick={ submit } 
                        className="btn-primary"
                        disabled= { !changed }>
                        {create?`aggiungi ${objName}`:`salva modifiche`}
                    </Button>
                    <Button 
                        onClick={ () => setRedirect(indexUrl)}
                        className="btn btn-secondary">
                        { changed ? `annulla modifiche` : `torna all'elenco`}
                    </Button>
                    {!create && <Button
                        onClick={ () => deleteObj(obj) }
                        className="btn btn-danger pull-right">
                            elimina {objName}
                    </Button>}
                </ButtonGroup>
            : <ButtonGroup>
                <Button 
                    onClick={ () => setEdit(true) }
                    className="btn-warning">
                    modifica
                </Button>
                <Button 
                    onClick={ () => setRedirect(indexUrl)}
                    className="btn btn-secondary">
                        torna all'elenco
                </Button>
            </ButtonGroup>
            }
            </Form>
        <br />
        <p style={{align: "right"}}>
            Creato da <b>{obj.createdBy?.username}</b> 
            {' '}il <b>{myDateFormat(obj.createdAt)}</b>
        <br />
            Modificato da <b>{obj.updatedBy?.username}</b> 
            {' '}il <b>{myDateFormat(obj.updatedAt)}</b>
        </p>
        </Card.Body>
    </Card>
}

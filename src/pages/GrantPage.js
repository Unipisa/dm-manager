import { useState } from 'react'
import { Card, Form, Button, ButtonGroup } from 'react-bootstrap'
import { useParams, Navigate } from 'react-router-dom'

import { useEngine, myDateFormat } from '../Engine'
import { StringInput, DateInput, TextInput, ListInput, SelectInput, PersonInput } from '../components/Input'

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
        pi: null, 
        local_coordinator: null, 
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

    const setter = field => value => setObj(obj => ({...obj, [field]: value}))

    return <Card>
        <Card.Header>
            <h3>{ create ? `nuovo ${objName}` : `${objName} ${obj?.name}` }</h3>
        </Card.Header>
        <Card.Body>
        <Form onSubmit={ (event) => event.preventDefault() }
        >
            <StringInput setValue={setter("name")} value={obj.name} label="nome" edit={ edit }/> 
            <StringInput setValue={setter("identifier")} value={obj.identifier} label="id" edit={ edit }/>
            <StringInput setValue={setter("projectType")} value={obj.projectType} label="tipo" edit={ edit }/>
            <SelectInput setValue={setter("funds")} value={obj.funds} label="fondi" options={["National", "International"]} edit={ edit }/>
            <StringInput setValue={setter("fundingEntity")} value={obj.fundingEntity} label="ente erogatore" edit={ edit }/>
            <PersonInput setValue={setter("pi")} value={obj.pi} label="principal investigator" edit={ edit }/>
            <PersonInput setValue={setter("localCoordinator")} value={obj.localCoordinator} label="coordinatore locale" edit={ edit }/>
            <PersonInput multiple setValue={setter("members")} value={obj.members} label="membri" setStore= { setObj } edit={ edit }/>
            <DateInput setValue={setter("startDate")} value={obj.startDate} label="inizio" edit={ edit }/>
            <DateInput setValue={setter("endDate")} value={obj.endDate} label="fine" edit={ edit }/>
            <StringInput setValue={setter("webSite")} value={obj.webSite} label="sito web" edit={ edit }/>
            <StringInput setValue={setter("budgetAmount")} value={obj.budgetAmount} label="ammontare budget" edit={ edit }/>
            <TextInput setValue={setter("description")} value={obj.description} label="descrizione" edit={ edit }/>
            <ListInput setValue={setter("keywords")} value={obj.keywords} label="parole chiave" edit={ edit }/>
            <StringInput setValue={setter("ssd")} value={obj.ssd} label="SSD" edit={ edit }/>
            <TextInput setValue={setter("notes")} value={obj.notes} label="note" edit={ edit }/>
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

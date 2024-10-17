import { Button, Card } from 'react-bootstrap'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'

import { InputRow, StringInput, BooleanInput } from '../components/Input'
import { PrefixProvider } from './PrefixProvider'
import api from '../api'
import Loading from '../components/Loading'
import {setter} from '../Engine'
import { useEngine } from '../Engine'

export default function Url() {
    const { id } = useParams()
    const path = `process/my/urls/${id || '__new__'}`
    const query = useQuery(path.split('/'))
    if (query.isLoading) return <Loading />
    if (query.isError) return <div>Errore caricamento: {query.error.response.data?.error || `${query.error}`}</div>

    let url = {...query.data}

    return <UrlForm url={url}/>
}

function UrlForm({url}) {
    const [data, setData] = useState(url)
    const modified = url.alias!==data.alias || url.destination!==data.destination || url.index!==data.index
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const addMessage = useEngine().addMessage

    return <PrefixProvider value={`process/my/visits`}>
        <h1 className="text-primary pb-4">{url._id 
            ? "Modifica alias"
            : "Inserimento nuovo alias"}</h1>
        <UrlDetailsBlock
            data={data} 
            setData={setData} 
        />
        <Button className="mt-3 mx-2" onClick={save} disabled={!modified}>
            salva
        </Button>
        <Button className="mt-3 mx-2" onClick={completed}>
            Indietro
        </Button>
    </PrefixProvider>

    async function completed() {
        navigate(`/process/my/urls`)     
    }
    
    async function save() {
        try {
            if (url._id) {
                await api.patch(`/api/v0/process/my/urls/${url._id}`, data)
            } else {
                await api.put(`/api/v0/process/my/urls`, data)
            }
            navigate(`/process/my/urls/`, {replace: true})
        } catch (e) {
            addMessage(`${e}`)
        }
        queryClient.invalidateQueries(`process/my/urls`.split('/'))
    }

}

function UrlDetailsBlock({data, setData, active, done, edit}) {
    const user = useEngine().user
    const isAdmin = user.roles && user.roles.includes('admin')

    return <Card className="shadow mb-3">
        <Card.Header>
            <div className="d-flex d-row justify-content-between">
                <div>Alias</div>
                <div>
                { isAdmin && data._id && <a href={`/url/${data._id}`}>{data._id}</a>}
                </div>
            </div>
        </Card.Header>
        <Card.Body>
        <InputRow label="" className="my-3">
            {data.owner}
        </InputRow>
        <InputRow label="alias" className="my-3">
            <StringInput value={data.alias} setValue={setter(setData,'alias')} />
        </InputRow>
        <InputRow label="destination" className="my-3">
            <StringInput value={data.destination} setValue={setter(setData,"destination")} />
        </InputRow>
        <InputRow label="indicizza" className="my-3">
            <BooleanInput value={data.index} setValue={setter(setData,"index")} />
        </InputRow>
        </Card.Body>
    </Card>
}


import {useState,useRef} from 'react'
import {Table, Button, ButtonGroup} from 'react-bootstrap'
import ReactToPrint from 'react-to-print'
import { useQuery, useQueryClient } from 'react-query'
import { myDateFormat } from '../Engine'

import {useEngine} from '../Engine'
import api from '../api'

function Display({roomLabel, onSave}) {
    const namesRef = useRef(null)
    const numberRef = useRef(null)
    const printRef = useRef(null)
    const blue = "#08467b"
    const [size, setSize] = useState(roomLabel?.size || 0)
    const [format, setFormat] = useState(roomLabel?.format || 'square')
    const [lastId, setLastId] = useState(null)

    if (lastId !== roomLabel._id) {
        setLastId(roomLabel._id)
        setSize(roomLabel?.size || 0)
        setFormat(roomLabel?.format || 'square')
    }

    const dimensions = format === 'square' 
        ? { width: "15cm", height: "15cm" }
        : { width: "16cm", height: "9cm" }

    function sanitize(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }

    return <>
        <div ref={printRef} 
            style={{
                height: dimensions.height,
                width: dimensions.width,
                borderStyle: "solid",
                borderColor: "#eee",
                borderWidth: "1px",
                margin:"1cm",
                WebkitPrintColorAdjust: "exact", 
                printColorAdjust: "exact"
        }}>
            <img alt="" style={{
                height: format === 'square' ? "3cm" : "2.5cm",
                opacity: "0.8",
                marginTop: "0.2cm",
                marginLeft: "0.2cm",
                marginBottom: "-0.2cm"
                }} src="/img/matematica_dx.svg" />
            <div style={{
                height: format === 'square' ? "13cm" : "7cm",
                marginTop: "-2cm"
            }}>
                <div ref={namesRef} 
                    contentEditable="true" style={{
                    color: blue,
                    textAlign: "center",
                    fontSize: `${Math.round(100*Math.pow(2,size/2))/100}cm`, 
                    position: "relative",
                    top: format === 'square' ? "50%" : "55%",
                    transform: "translateY(-50%)",
                    }}
                    dangerouslySetInnerHTML={{__html: roomLabel.names.map(
                        name=>`<div>${sanitize(name)}</div>`).join('')}} />
            </div>
            <div style={{
                marginTop: format === 'square' ? "-4cm" : "-3cm",
                marginRight: "0.5cm"
            }}>
            <div ref={numberRef} 
                contentEditable="true" 
                style={{
                    backgroundColor: blue,
                    color: "white",
                    width: "3cm",
                    height: "3cm",
                    fontSize: "1.5cm",
                    textAlign: "right",
                    paddingTop: ".5cm",
                    paddingRight: "0.1cm",
                    marginTop: format === 'square' ? "2cm" : "1.5cm",
                    float: "left"
                }}
                dangerouslySetInnerHTML={{__html: sanitize(roomLabel.number)}}
                />
            <img alt="" style={{
                height: format === 'square' ? "8cm" : "6cm",
                position: "relative",
                float: "right",
                opacity: "0.12",
                marginTop: format === 'square' ? "-3.2cm" : "-1.7cm",
                marginRight: "-0.4cm",
                pointerEvents: "none"
                }} src="/img/cherubino_pant541.png" />
            </div>
        </div>
        <ButtonGroup>
        { printRef && <ReactToPrint 
            trigger={() => <Button className="btn-warning">stampa cartellino</Button>}
            content={() => printRef.current}
            />}
        { onSave && namesRef && 
            <Button onClick={() => {
                const names = [...namesRef.current.children].map(child => child.textContent)
                const number = numberRef.current.textContent
                onSave({names, number, size, format})
            }}>aggiungi ai cartellini da fare</Button> }
            <select value={size} onChange={e => setSize(e.target.value)}>
                <option value="2">scritta molto grande</option>
                <option value="1">scritta grande</option>
                <option value="0">scritta di dimensione normale</option>
                <option value="-1">scritta piccola</option>
                <option value="-2">scritta molto piccola</option>
            </select>
            <select value={format} onChange={e => setFormat(e.target.value)}>
                <option value="square">formato quadrato</option>
                <option value="rectangular">formato rettangolare</option>
            </select>
        </ButtonGroup>
    </>
}

function RoomsTable({onClick, onDone, onDelete, data, columns=['number','names','createdBy']}) {
    const engine = useEngine()
    // visibility of manager elements
    const visibility = (onDone || onDelete) &&  engine.user.hasSomeRole('admin', '/process/roomLabels', 'room-manager') ? "visible" : "hidden"

    if (data.length === 0) return <p>nessuno</p>

    return <Table hover>
        <thead>
            <tr>
                { columns.map(column => {
                    switch(column) {
                        case 'number': return <th key={column}>stanza</th>
                        case 'names': return <th key={column}>nomi</th>
                        case 'createdBy': return <th key={column}>richiesto da</th>
                        case 'createdAt': return <th key={column}>richiesto il</th>
                        case 'managedAt': return <th key={column}>fatto il</th>
                        case 'actions': return <th key={column} style={{visibility}}>azioni</th>
                        default: return <th key={column}>{column}: unknown column</th>
                    }
                })}
            </tr>
        </thead>
        <tbody>
            { 
            data.map(obj =>
                <tr key={obj._id} onClick={() => onClick(obj)}>
                    { columns.map(column => {
                        switch(column) {
                            case 'number': return <td key={column}>{obj.number}</td>
                            case 'names': return <td key={column}>{obj.names.join(", ")}</td>
                            case 'createdBy': return <td key={column}>{obj.createdBy.email || obj.createdBy.username}</td>
                            case 'createdAt': return <td key={column}>{myDateFormat(obj.createdAt)}</td>
                            case 'managedAt': return <td key={column}>{myDateFormat(obj.updatedAt)}</td>
                            case 'actions': return <td key={column} style={{visibility}}>
                                <ButtonGroup>
                                    {   obj.state === 'submitted' && onDone && 
                                        <Button className='btn-primary' onClick={() => onDone(obj)}>
                                            fatto
                                        </Button>}
                                    {   onDelete && 
                                        <Button className='btn-danger' onClick={() => onDelete(obj)}>
                                            elimina
                                        </Button>}
                                </ButtonGroup>
                            </td>
                            default: return <td key={column}>{column}: unknown column</td>
                        }
                    })}
                </tr>) 
            }
        </tbody>
    </Table>
}

function RoomLabels({data, onClick, onDone, onDelete, urlId, setUrlId }) {
    const {addMessage} = useEngine()

    if (urlId) {
        const obj = data.find(obj => obj._id === urlId)
        if (obj) {
            // avoid calling upper component change
            // while rendering
            setTimeout(() => onClick(obj), 0)       
        } else {
            addMessage(`non trovo il cartellino ${urlId}`)
        }
        setTimeout(()=> setUrlId(null), 0)
    }

    return <>
        <h3>cartellini richiesti</h3>
        <RoomsTable 
            onClick={onClick} 
            onDone={onDone}
            onDelete={onDelete}
            data={data.filter(obj => obj.state==='submitted')}
            label="cartellini richiesti"
            columns={['number','names','createdBy','createdAt','actions']}
        />
        <h3>cartellini fatti</h3>
        <RoomsTable 
            onClick={onClick} 
            data={data.filter(obj => obj.state==='managed')}
            label="cartellini fatti"
            columns={['number','names','createdBy','managedAt']}
        />
    </>
}

export default function ManageRoomLabels() {
    const engine = useEngine()
    const [roomLabel, setRoomLabel] = useState({
        names: ["Nome Cognome"],
        number: "123",
        fontSize: 0,
        format: 'square'
    })
//    const patchRoomLabel = engine.usePatch('roomLabel')
    const [urlId, setUrlId] = useState(window.location.search.substring(1))
    const query = useQuery(['process','roomLabels'])
    const queryClient = useQueryClient()
    
    if (query.isLoading) return <p>caricamento...</p>
    if (query.isError) return <p>errore: {query.error.message}</p>

    function invalidate() {
        queryClient.invalidateQueries(['process','roomLabels'])
    }

    const onSave = async (roomLabel) => {
        setRoomLabel(roomLabel)
        await api.post(`/api/v0/process/roomLabels`, roomLabel)
        invalidate()
    }

    const onDone = async (roomLabel) => {
        await api.patch(`/api/v0/process/roomLabels/${roomLabel._id}`, {state: 'managed'})
        invalidate()
    }

    const onClick = (roomLabel) => {
        setRoomLabel(roomLabel)
    }

    async function onDelete(roomLabel) {
        await api.del(`/api/v0/process/roomLabels/${roomLabel._id}`)
        invalidate()
    }

    return <>
        <p>Puoi modificare il nome e il numero di stanza.</p>
        <Display 
            roomLabel={roomLabel}
            onSave={onSave}/>
        <div style={{marginTop: "1cm"}}/>
        { engine.user.hasSomeRole('admin', 'supervisor', '/process/roomLabels') && query.isSuccess && 
            <RoomLabels data={query.data.data} onClick={onClick} onDone={onDone} onDelete={onDelete} urlId={urlId} setUrlId={setUrlId} />
        }
        <hr />
        <i>Chi può accedere a questa pagina?</i>
        <br />
        Solo chi ha uno dei permessi: <i>admin</i>, <i>supervisor</i>, <i>/process/roomLabels</i>.
    </>
}

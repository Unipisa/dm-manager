import {useState,useRef} from 'react'
import {Table, Button, Badge, ButtonGroup} from 'react-bootstrap'
import ReactToPrint from 'react-to-print'

import {useEngine} from '../Engine'
import Loading from '../components/Loading'

function Display({roomLabel, onSave}) {
    const namesRef = useRef(null)
    const numberRef = useRef(null)
    const printRef = useRef(null)
    const blue = "#08467b"
    const [size, setSize] = useState(roomLabel?.size || 0)
    const [lastId,setLastId] = useState(null)

    if (lastId !== roomLabel._id) {
        setLastId(roomLabel._id)
        setSize(roomLabel?.size || 0)
    }

    function sanitize(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }

    return <>
        <div ref={printRef} 
            style={{
                height: "15cm",
                width: "15cm",
                borderStyle: "solid",
                borderColor: "#eee",
                borderWidth: "1px",
                margin:"1cm",
                WebkitPrintColorAdjust: "exact", 
                printColorAdjust: "exact"
        }}>
            <img alt="" style={{
                height: "3cm",
                opacity: "0.8",
                marginTop: "0.2cm",
                marginLeft: "0.2cm",
                marginBottom: "-0.2cm"
                }} src="/img/matematica_dx.svg" />
            <div style={{
                height:"13cm",
                marginTop:"-2cm"
            }}>
                <div ref={namesRef} 
                    contentEditable="true" style={{
                    color: blue,
                    textAlign: "center",
                    fontSize: `${Math.round(100*Math.pow(2,size/2))/100}cm`, 
                    position: "relative",
                    top: "50%",
                    transform: "translateY(-50%)",
                    }}
                    dangerouslySetInnerHTML={{__html: roomLabel.names.map(
                        name=>`<div>${sanitize(name)}</div>`).join('')}} />
            </div>
            <div style={{
                marginTop: "-4cm",
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
                    marginTop: "2cm",
                    float: "left"
                }}
                dangerouslySetInnerHTML={{__html: sanitize(roomLabel.number)}}
                />
            <img alt="" style={{
                height: "8cm",
                position: "relative",
                float: "right",
                opacity: "0.12",
                marginTop: "-3.2cm",
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
                onSave({names, number, size})
            }}>aggiungi ai cartellini da fare</Button> }
            <select value={ size } onChange={e => setSize(e.target.value)}>
                <option value="2">scritta molto grande</option>
                <option value="1">scritta grande</option>
                <option value="0">scritta di dimensione normale</option>
                <option value="-1">scritta piccola</option>
                <option value="-2">scritta molto piccola</option>
            </select>
        </ButtonGroup>
    </>
}

function RoomsTable({onClick, onDone, onDelete, data}) {
    const engine = useEngine()
    // visibility of manager elements
    const visibility = engine.user.hasSomeRole('admin', 'room-manager') ? "visible" : "hidden"

    if (data.length === 0) return <p>nessuno</p>

    return <Table hover>
        <thead>
            <tr>
                <th>stanza</th>
                <th>nomi</th>
                <th>stato</th>
                <th style={{visibility}}>azioni</th>
            </tr>
        </thead>
        <tbody>
            { 
            data.map(obj =>
                <tr key={obj._id} onClick={() => onClick(obj)}>
                    <td>{obj.number}</td>
                    <td>{obj.names.join(", ")}</td>
                    <td>
                        <Badge bg={{'submitted': 'warning', 'managed': 'success'}[obj.state]}>
                        {{
                            'submitted': 'da fare',
                            'managed': 'fatto'
                        }[obj.state]}
                        </Badge>
                    </td>
                    <td style={{visibility}}>
                        <ButtonGroup>
                            {
                            obj.state === 'submitted' 
                            && <Button className='btn-primary' onClick={() => onDone(obj)}>fatto</Button>
                            }
                            <Button className='btn-danger' onClick={() => onDelete(obj)}>elimina</Button>
                        </ButtonGroup>
                    </td>
                </tr>) 
            }
        </tbody>
    </Table>
}

function RoomLabels({onClick, onDone, onDelete}) {
    const engine = useEngine()
    const query = engine.useIndex('roomLabel')

    let data = []
    if (query.isLoading) return <Loading />
    if (query.isSuccess) data = query.data.data

    return <>
        <h3>cartellini richiesti</h3>
        <RoomsTable 
            onClick={onClick} 
            onDone={onDone}
            onDelete={onDelete}
            data={data.filter(obj => obj.state==='submitted')}
            label="cartellini richiesti"
        />
        <h3>cartellini fatti</h3>
        <RoomsTable 
            onClick={onClick} 
            onDone={onDone}
            onDelete={onDelete}
            data={data.filter(obj => obj.state==='managed')}
            label="cartellini fatti"
        />
    </>
}

export default function RoomLabelsPage() {
    const engine = useEngine()
    const [roomLabel, setRoomLabel] = useState({
        names: ["Nome Cognome"],
        number: "123",
        fontSize: 0
    })
    const putRoomLabel = engine.usePut('roomLabel')
    const patchRoomLabel = engine.usePatch('roomLabel')
    const onDelete = engine.useDelete('roomLabel')
    const isSupervisor = engine.user.hasSomeRole('admin', 'supervisor', 'room-manager', 'room-supervisor')

    const onSave = (roomLabel) => {
        setRoomLabel(roomLabel)
        putRoomLabel(roomLabel)
    }

    const onDone = (roomLabel) => {
        patchRoomLabel({_id: roomLabel._id, state: 'managed'})
    }

    const onClick = (roomLabel) => {
        setRoomLabel(roomLabel)
    }

    return <>
        <p>Puoi modificare il nome e il numero di stanza.</p>
        <Display 
            roomLabel={roomLabel}
            onSave={isSupervisor?onSave:null}/>
        <div style={{marginTop: "1cm"}}/>
        { engine.user.hasSomeRole('admin', 'supervisor', 'room-manager', 'room-supervisor') && 
            <RoomLabels onClick={onClick} onDone={onDone} onDelete={onDelete} />
        }
    </>
}

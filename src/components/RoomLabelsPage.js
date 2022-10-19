import {useState,useRef} from 'react'
import {Table, Button} from 'react-bootstrap'
import {useEngine} from '../Engine'

function Display({names, number, onSave}) {
    const namesRef = useRef(null)
    const numberRef = useRef(null)
    const blue = "#08467b"

    function sanitize(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }

    console.log(`DISPLAY: --${number}--${names.join('-')}--`)

    return <>
        <div style={{
            height: "15cm",
            width: "15cm",
            borderStyle: "solid",
            borderColor: "#eee",
            borderWidth: "1px",
            margin:"5px",
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
                    fontSize: "1cm",
                    position: "relative",
                    top: "50%",
                    transform: "translateY(-50%)",
                    }}
                    dangerouslySetInnerHTML={{__html: names.map(
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
                dangerouslySetInnerHTML={{__html: sanitize(number)}}
                />
            <img alt="" style={{
                height: "8cm",
                position: "relative",
                float: "right",
                opacity: "0.15",
                marginTop: "-3.2cm",
                marginRight: "-0.4cm",
                pointerEvents: "none"
                }} src="/img/cherubino_pant541.png" />
            </div>
        </div>
    { onSave && namesRef && 
        <Button onClick={() => {
            const names = [...namesRef.current.children].map(child => child.textContent)
            const number = numberRef.current.textContent
            onSave({names,number})
        }}>salva</Button> }
    </>
}

function RoomLabels({onClick}) {
    const [showList, setShowList] = useState(false)
    const engine = useEngine()
    const query = engine.useIndex('roomLabel')

    let data = []
    if (query.isLoading) return <span>loading...</span>
    if (query.isError) {
        engine.addErrorMessage(query.error)
    } else {
        data = query.data.data
    }

    return <>
        <div>
            <Button onClick={() => setShowList(v => !v)}>
                { `${showList?"nascondi":"mostra"} elenco cartellini`}
            </Button>
            { showList &&
                <Table bordered hover>
                    <thead>
                        <tr>
                            <th>stanza</th>
                            <th>nomi</th>
                        </tr>
                    </thead>
                    <tbody>
                        { 
                        data.map(obj =>
                            <tr key={obj._id} onClick={() => onClick(obj)}>
                                <td>{obj.number}</td>
                                <td>{obj.names.join(", ")}</td>
                            </tr>) 
                        }
                    </tbody>
                </Table>
            }
        </div>
    </>
}

export default function RoomLabelPage() {
    const engine = useEngine()
    const [names, setNames] = useState(["Nome Cognome"])
    const [number, setNumber] = useState("123")
    const putRoomLabel = engine.usePut('roomLabel', (obj) => {
        engine.addInfoMessage(`nuova etichetta ${obj.number} inserita`)
    })

    const onSave = ({names, number}) => {
        setNames(names)
        setNumber(number)
        putRoomLabel({names, number})
    }

    const onClick = (roomLabel) => {
        console.log(`CLICK: ${JSON.stringify(roomLabel)}`)
        setNames(roomLabel.names)
        setNumber(roomLabel.number)
    }

    return <>
        <p>Puoi modificare il nome e il numero di stanza.</p>
            <Display number={number} names={names} onSave={onSave}/>
        <div style={{marginTop: "1cm"}}/>
        { engine.user.hasSomeRole('admin', 'supervisor', 'room-manager', 'room-supervisor') && 
            <RoomLabels onClick={onClick} />
        }
    </>
}


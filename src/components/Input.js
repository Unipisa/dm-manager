import { Modal, Button } from 'react-bootstrap'
import UtcDatePicker from "./UtcDatePicker"
import "react-datepicker/dist/react-datepicker.css"
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { useState, useRef } from 'react';
import { useQuery } from 'react-query'

import api from '../api'
import { useEngine } from '../Engine'
import Loading from './Loading'

export function StringInput({ id, value, setValue }) {
    return <input 
        className="form-control col-sm-10"
        id={ id } 
        value={ value || "" } 
        onChange={ (evt) => {setValue(evt.target.value)} }
    />
}

export function AttachmentInput({ id, value, setValue, image }) {
    // const [uploading, setUploading] = useState(false)
    const engine = useEngine()

    function getNewAttachment() {
        const input = document.createElement('input')
        input.type = 'file'
        input.onchange = e => {
            const file = e.target.files[0]
            if (file) {
                var reader = new FileReader()
                reader.onload = () => {
                    const data = {
                        filename: file.name, 
                        mimetype: file.type, 
                        data: btoa(reader.result)
                    }
                    api.post('/api/v0/upload', data).then(data => {
                        setValue(data.url)
                    }).catch(data => {
                        engine.addMessage(data.message, 'error')
                    })
                }
                reader.readAsBinaryString(file)
            }
        }
        input.click()
    }

    return <div className="form-row">
        <div className="d-inline-block col-sm-10">
            { image 
            ? (value ? <img src={value} style={{maxWidth: '10em'}} alt="" /> : '---')
            : <input 
                className="form-control"
                id={ id } 
                value={ value || "" } 
                onChange={ (evt) => {setValue(evt.target.value)} }
            /> }
        </div>
    <div className="ps-2 d-inline-block col-sm-2 d-inline-block">
        <button onClick={getNewAttachment} className="w-100 btn btn-primary">
            Upload
        </button>
    </div>
    </div>
}

export function ImageInput({ id, value, setValue }) {
    return <AttachmentInput id={id} value={value} setValue={setValue} image={true} />
}

export function NumberInput({ id, value, setValue }) {
    return <input 
        className="form-control col-sm-10"
        id={ id } 
        type="number"
        value={ value===null ? "" : value } 
        onChange={ (evt) => {setValue(evt.target.value)} }
    />
}

export function DateInput({ id, value, setValue }) {
    return <UtcDatePicker 
        id={ id }
        className="form-control"
        selected={ value ? new Date(value) : null }  
        dateFormat="d.MM.yyyy"
        onChange={ date => setValue(date) } 
    />
}

export function ListInput({ id, value, setValue, separator }) {
    if (separator === undefined) separator = ','    
    return <input 
        id={ id } 
        value={ value.join(separator) || "" } 
        onChange={ (evt) => {
                const val = evt.target.value
                    .split(separator)
                    .map( x => x.trim())
                setValue(val) 
            } 
        }
        className="form-control" 
    />
}

export function TextInput({ id, value, setValue }) {
    return <textarea 
        id={ id } 
        value={ value || "" }
        rows={10}
        onChange={ (evt) => setValue(evt.target.value) }
        className="form-control" 
    />
}

//
// How to use this input: insert something along the lines of 
//
//  <PersonInput label="Persona" value={person} setValue={setPerson} edit={true}></PersonInput>
//
// TODO: valutare widget alternativo: https://react-select.com/home
export function ObjectInput({ id, placeholder, render, new_object, objCode, objName, oa, inputs, value, setValue, multiple }) {
    const engine = useEngine()
    const [options, setOptions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [show, setShow] = useState(false)
    const typeaheadref = useRef(null)

    // Data used for the new person create
    const [newObject, setNewObject] = useState({})

    // Use to avoid opening the menu after creating a new object
    const [avoidMenu, setAvoidMenu] = useState(false)

    if (multiple === undefined) {
        multiple = false
    }

    // Determine the value of selected that should be initialized
    const [selected, setSelected] = useState(multiple ? value : (value ? [value] : []))

    const labelDisplayFunction = x => {
        if (!x || x.noObjectSelected || x.newObjectEntry)
            return ""

        return render(x)
    }

    function handleClose() {
        // Add a new person with the given data
        api.put(`/api/v0/${objCode}`, newObject).then(data => {      
            if (multiple) {
                setSelected([ ...value, data ])
                setValue([ ...value, data ])
            }   
            else {
                setSelected([ data ])
                setValue(data)
            }

            setShow(false);
            setAvoidMenu(true)
        }).catch(err => engine.addMessage(err.message))
    }

    function onChangeHandler(evt) {
        if (evt.length > 0 && evt[evt.length - 1].newObjectEntry) {
            setNewObject(new_object(evt[evt.length - 1].query))
            setShow(true)
            return
        }

        // Filter the entries removing the "No Object selected entries, if any"
        evt = Array.from(evt).filter(x => ! (x.noObjectSelected || x.newObjectEntry))

        setSelected(evt)
        typeaheadref.current.hideMenu()

        if (evt.length > 0) {
            setValue(multiple ? evt : evt[0])
        }
        else {
            setValue(multiple ? [] : null)
        }
    }

    const handleSearch = (query) => {
        setIsLoading(true)
       
        api.get(`/api/v0/${objCode}/search`, {q: query}).then((data) => {
            const searchoptions = data["data"].map(x => {
                return {...x}
            })

            let newoptions = searchoptions

            if (! multiple)
                newoptions = [ { noObjectSelected: true }, ...newoptions ]

            if (searchoptions.length === 0) {
                newoptions = [{
                    newObjectEntry: true,
                    query: query
                }, ...newoptions ]
            }

            setOptions(newoptions)
            setIsLoading(false);
        }).catch(err => engine.addMessage(err.message))
    }

    const menuRenderFunction = x => {
        if (x.newObjectEntry) {
            return <><span className="text-muted">{`Nuov${oa} ${objName}`}</span> {x.query}</>
        }
        if (x.noObjectSelected) {
            return <span className="text-muted">{`Nessun${oa} ${objName}`}</span>
        }
        return <span>{labelDisplayFunction(x)}</span>
    }

    const onBlurHandler = x => {
        if (multiple) {
            setSelected(value)
        }
        else {
            setSelected(value ? [value] : [])
        }

        if (! value) {
            typeaheadref.current.clear()
        }
    }

    const filterBy = () => true

    const onMenuToggle = () => {
        if (avoidMenu) {
            typeaheadref.current.hideMenu()
            setAvoidMenu(false)
        }
    }

    return <>
       <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{`Crea nuov${oa} ${objName}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {Object.entries(inputs).map(([key, label]) => 
                <input key={key} className="mb-2 form-control" placeholder={label} value={newObject[key]} onChange={x => setNewObject(o => ({...o, [key]: x.target.value}))}></input>
            )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={x => setShow(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Salva
          </Button>
        </Modal.Footer>
      </Modal>
        <AsyncTypeahead
          ref={typeaheadref}
          className="col-sm-10"
          filterBy={filterBy}
          isLoading={isLoading}
          id={ id }
          labelKey={labelDisplayFunction}
          onSearch={handleSearch}
          options={options}
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
          onMenuToggle={onMenuToggle}
          placeholder={placeholder}
          selected={selected}
          renderMenuItemChildren={menuRenderFunction}
          multiple={multiple}
        />
    </>
}

export function PersonInput({ id, value, setValue, multiple }) {
    return <ObjectInput 
        id={id} 
        value={value} 
        setValue={setValue} 
        multiple={multiple} 
        objCode="person"
        objName="persona"
        oa="a"
        render={_ => `${_.firstName} ${_.lastName} (${_.affiliation})`}
        new_object={q => ({firstName: "", lastName: q, affiliation: ""})}
        inputs={{
                firstName: 'Nome',
                lastName: 'Cognome',
                affiliation: 'Affiliazione',
        }}
        placeholder="cognome"
    />
}

export function GrantInput({ id, value, setValue, multiple }) {
    return <ObjectInput 
        id={id} 
        value={value} 
        setValue={setValue} 
        multiple={multiple} 
        objCode="grant"
        objName="grant"
        oa="o"
        render={_ => `${_.name} (${_.pi ? _.pi.lastName : ''} - ${_.identifier})`}
        new_object={q => ({identifier: q})}
        inputs={{
                identifier: 'Identificativo',
        }}
        placeholder="grant"
    />
}

export function SelectInput({ id, options, value, setValue, displayFunction }) {
    //console.assert(value===null || options.includes(value),`Value ${value} not in options`) 
    return <select 
        className="form-control col-sm-10"
        id={ id } 
        value={ value || "" } 
        onChange={ (evt) => setValue(evt.target.value) }>
        { options.map(value => <option key={value} value={value}>{ displayFunction ? displayFunction(value) : value }</option>)}
    </select>
}

export function BooleanInput({ id, value, setValue }) {
    return <input 
        className="form-check-input col-sm-10"
        type='checkbox' 
        id={ id } 
        checked={ !!value } 
        onChange={ (evt) => {setValue(!!evt.target.checked)} }
    />                 
}

export function MultipleSelectInput({ id, options, value, setValue}) {
    return <select 
        multiple className="form-control col-sm-10"
        id={ id }
        value={ value || [] }
        onChange={ (evt) => {
            const opts = Array.from(evt.target.options)
            const selectedOpts = opts.filter(x => x.selected).map(x => x.value)
            setValue(selectedOpts)
        }}>
        { options.map(value => <option key={value} value={value}>{ value }</option>)}
    </select>
}

export function RoomInput({ id, value, setValue }) {
    const engine = useEngine()
    const path = 'room'
    const query = useQuery([path], () => api.get(`/api/v0/${path}`,{_sort: 'code', _limit: 1000}), {
        onError: (err) => {
            engine.addMessage(err.message, 'error') },
        })
    if (query.isLoading) return <Loading />
    const data = new Map(query.data.data.map(room => ([room._id, room])))
    if (value && value._id) value = value._id
    return <SelectInput 
        id={id}
        options = {Array.from(data.keys())}
        displayFunction = {id => {
            if (id === null) return '---'
            const room = data.get(id)
            if (room === undefined) return '???' // database inconsistency
            return room.code
        }}
        value={value} 
        setValue={value => setValue(value?data.get(value):null)}
    />
}

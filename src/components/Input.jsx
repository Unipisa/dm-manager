import { Modal, Button } from 'react-bootstrap'
import UtcDatePicker from "./UtcDatePicker"
import "react-datepicker/dist/react-datepicker.css"
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { useState, useRef } from 'react';
import { useQuery } from 'react-query'
import { useId, createContext, useContext } from 'react'
import { Card, Form } from 'react-bootstrap'

import api from '../api'
import { useEngine } from '../Engine'
import Loading from './Loading'
import { usePrefix } from '../processes/PrefixProvider'

const InputIdContext = createContext('')

export function useInputId() {
    return useContext(InputIdContext)
}

export function InputRow({ label, modified, help, children, className}) {
    const id = useId()

    return <Form.Group className={`row ${className || 'my-2'}`}>
        <Form.Label className={ "col-form-label text-end col-sm-2 " + (modified ? "bg-warning" : "") } htmlFor={ id }>
            { label }
        </Form.Label>
        <div className="col-sm-10">
            <InputIdContext.Provider value={id}>
                { children }
            </InputIdContext.Provider>
        </div>
        <div className="col-sm-2"></div>
        <div className="col-sm-10 form-text">{help}</div>
    </Form.Group>
}

export function StringInput({ value, setValue }) {
    // local copy of value, with possible leading/trailing spaces
    // which are removed when setValue is called
    const [myValue, setMyValue] = useState(value || "")
    const id = useInputId()
    return <input 
        className="form-control col-sm-10"
        id={ id } 
        value={ myValue } 
        onChange={ (evt) => {setMyValue(evt.target.value);setValue(evt.target.value.trim())} }
    />
}

export function EmailInput({ value, setValue }) {
    const id = useInputId()

    return <input 
        className="form-control col-sm-10"
        id={ id } 
        type="email"
        value={ value || "" } 
        onChange={ (evt) => {setValue(filterEmail(evt.target.value))} }
    />

    function filterEmail(email) {
        const match = email.match(/.*<(.*)>/)
        if (match && match[1]) email = match[1]
        
        email = email.replace(/\s/g, '')

        return email
    }
}

async function uploadFiles(files, _private, engine, urlOnly) {
    const readFile = (file) => {
        return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async () => {
            const data = {
                filename: file.name, 
                mimetype: file.type, 
                data: btoa(reader.result),
                private: _private || false,
            }
            try {
                const upload_data = await api.post('/api/v0/upload', data)
                resolve(urlOnly ? upload_data.url : upload_data.upload)
            } catch (err) {
                engine.addMessage(err.message, 'error')
                reject(err.message)
            }
        }
        reader.onerror = () => reject(reader.error);
        reader.readAsBinaryString(file); // or readAsDataURL / readAsArrayBuffer / readAsBinaryString
    });
  };

  const results = [];

  for (const file of files) {
    const content = await readFile(file);
    results.push(content);
  }

  return results;
}

export function uploadNewAttachment(setValue, _private, engine, urlOnly, multiple=false, onCancel = () => {}) {
    const input = document.createElement('input')   
    input.type = 'file'
    input.multiple = multiple
    let fileSelected = false 
    input.onchange = async e => {
        if (!e.target.files || e.target.files.length === 0) {
            return
        }
        fileSelected = true 
        const newUploads = await uploadFiles(e.target.files, _private, engine, urlOnly)
        if (multiple)
            setValue(newUploads)
        else
            setValue(newUploads[0])
    }
    window.addEventListener(
        'focus',
        () => {
            setTimeout(() => {
                if (!fileSelected) {
                    onCancel()
                }
            }, 300)
        },
        { once: true }
    )
    input.click()
}

export function MultipleAttachmentInput({ value, setValue }) {
    const engine = useEngine()
    const id = useInputId()

    return <div className='form-row'>
        <div className="d-inline-block col-sm-10 form-row row" id={id}>
            { (value || []).map( (val, idx) => 
                <div key={val._id} className="mb-2 col-sm-6 d-inline-block">
                    <Card className="">
                        <Card.Header>{val.filename}</Card.Header>
                        <Card.Body>
                            <Button className='btn-sm btn-primary me-3' onClick={() => {
                                window.location.href = `/api/v0/upload/${val._id}`
                            }}>Open</Button>   
                            <Button className='btn-sm btn-danger' onClick={() => {
                                const newValue = [ ...value ]
                                newValue.splice(idx, 1)
                                setValue(newValue)
                            }}>Remove</Button>   
                        </Card.Body>
                    </Card>
                </div>
            )}
        </div>
        <div className="ps-2 d-inline-block col-sm-2 d-inline-block">
            <button type="button" onClick={() => uploadNewAttachment((newUrl) => {
                    setValue([ ...(value || []), ...newUrl ])
                }, true, engine, false, true) } className="w-100 btn btn-primary">
                Upload
            </button>
        </div>
    </div>
}

export function PrivateAttachmentInput({ value, setValue }) {
    return <AttachmentInput value={value} setValue={setValue} _private={true} />
}

export function AttachmentInput({ value, setValue, image, _private }) {
    // const [uploading, setUploading] = useState(false)
    const id = useInputId()
    const engine = useEngine()
    const getNewAttachment = () => uploadNewAttachment(setValue, _private, engine, true)

    return <div className="form-row">
        <div className="d-inline-block col-sm-10">
            {   image && value &&
                <img src={value} className="rounded" style={{maxWidth: '10em'}} alt="" />
            }
            <input 
                className="form-control"
                id={ id } 
                value={ value || "" } 
                onChange={ (evt) => {setValue(evt.target.value)} }
            />
        </div>
    <div className="ps-2 d-inline-block col-sm-2 d-inline-block">
        <button type="button" onClick={getNewAttachment} className="w-100 btn btn-primary">
            Upload
        </button>
    </div>
    </div>
}

export function ImageInput({ value, setValue }) {
    const id = useInputId()

    return <AttachmentInput id={id} value={value} setValue={setValue} image={true} />
}

export function NumberInput({ value, setValue }) {
    const id = useInputId()

    return <input 
        className="form-control col-sm-10"
        id={ id } 
        type="number"
        value={ value===null ? "" : value } 
        onChange={ (evt) => {setValue(evt.target.value)} }
    />
}

export function DateInput({ value, setValue, defaultDate }) {
    const id = useInputId()

    return <UtcDatePicker 
        id={ id }
        className="form-control"
        selected={ value ? new Date(value) : (defaultDate ? new Date(defaultDate) : null) }  
        dateFormat="d.MM.yyyy"
        onChange={ date => setValue(date) } 
    />
}

export function ListInput({ value, setValue, separator }) {
    if (separator === undefined) separator = ','
    const id = useInputId()
    const [myValue, setMyValue] = useState(value?value.join(separator):"")

    return <input 
        id={ id } 
        value={ myValue } 
        onChange={ (evt) => {
                setMyValue(evt.target.value)
                const val = evt.target.value
                    .split(separator)
                    .map( x => x.trim())
                    .filter( x => x!=="")
                setValue(val) 
            } 
        }
        className="form-control" 
    />
}

export function TextInput({ value, setValue }) {
    const id = useInputId()

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
export function ObjectInput({ placeholder, apiPrefix, render, new_object, objCode, objName, oa, inputs, value, setValue, multiple }) {
    const id = useInputId()
    const prefixFromHook = usePrefix()
    const api_prefix = apiPrefix ?? prefixFromHook

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
    const selected = multiple ? value : (value ? [value] : [])

    const labelDisplayFunction = x => {
        if (!x || x.noObjectSelected || x.newObjectEntry)
            return ""

        return render(x)
    }

    function handleClose() {
        // Add a new person with the given data
        console.log(`Creating new object (${objCode})`, newObject)
        api.put(`/api/v0/${api_prefix}/${objCode}`, newObject).then(data => {      
            console.log("New object created", data)
            console.log("value", value)
            if (multiple) {
                setValue([ ...value, data ])
            }   
            else {
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

        if (!multiple && evt.length > 1) {
            evt = [evt[evt.length - 1]]
        }

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
        api.get(`/api/v0/${api_prefix}/${objCode}/search`, {q: query}).then((data) => {
            const searchoptions = data["data"].map(x => {
                return {...x}
            })

            let newoptions = searchoptions

            if (! multiple)
                newoptions = [ { noObjectSelected: true }, ...newoptions ]

            if (searchoptions.length === 0 && new_object) {
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

    function renderInput([key, label]) {
        // TODO: this is very fragile!
        if (label === 'Affiliazioni') {
            return <InstitutionInput 
                id={`affiliazione-${key}`}
                key={key} 
                value={newObject[key] || []} 
                multiple={true}
                setValue={x => {
                    console.log(`Setting ${key} to`, x)
                    setNewObject(o => ({...o, [key]: x}))
                }} />
        } else {
            return <input 
                key={key} 
                className="mb-2 form-control" 
                placeholder={label} 
                value={newObject[key]} 
                onChange={x => setNewObject(o => ({...o, [key]: x.target.value}))}>
            </input>
        }
    }

    return <>
       <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{`Crea nuov${oa} ${objName}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {Object.entries(inputs).map(renderInput)}
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
          multiple={true}
        />
    </>
}

export function PersonInput({ value, setValue, multiple, disableCreation }) {
    return <ObjectInput 
        value={value} 
        setValue={setValue} 
        multiple={multiple} 
        objCode="person"
        objName="persona"
        oa="a"
        render={_ => {
            const affiliations = (_.affiliations || []).map(x => x.name).join(" and ")
            return `${_.firstName} ${_.lastName} (${affiliations})`}}
        new_object={disableCreation ? null : q => ({firstName: "", lastName: q, affiliation: ""})}
        inputs={{
                firstName: 'Nome',
                lastName: 'Cognome',
                affiliations: 'Affiliazioni',
        }}
        placeholder="cognome"
    />
}

export function GrantInput({ value, setValue, multiple, disableCreation }) {
    return <ObjectInput 
        value={value} 
        setValue={setValue} 
        multiple={multiple} 
        objCode="grant"
        objName="grant"
        oa="o"
        render={_ => `${_.name} (${_.pi ? _.pi.lastName : ''} - ${_.identifier})`}
        new_object={disableCreation ? null : q => ({identifier: q})}
        inputs={{
                identifier: 'Identificativo',
        }}
        placeholder="grant"
    />
}

export function SelectInput({ options, value, setValue, displayFunction }) {
    const id = useInputId()

    //console.assert(value===null || options.includes(value),`Value ${value} not in options`) 
    value = value || ""
    if (! options.includes(value)) {
        options = [value, ...options]
    }
    return <select 
        className="form-control"
        id={ id } 
        value={ value || "" } 
        onChange={ (evt) => {
            // console.log(`OnChange ${evt.target.value}`)
            setValue(evt.target.value) 
        }}>
        { options.map(value => <option key={value} value={value}>{ displayFunction ? displayFunction(value) : value }</option>)}
    </select>
}

export function BooleanInput({ value, setValue }) {
    const id = useInputId()

    return <input 
        className="form-check-input col-sm-10"
        type='checkbox' 
        id={ id } 
        checked={ !!value } 
        onChange={ (evt) => {setValue(!!evt.target.checked)} }
    />                 
}

export function MultipleSelectInput({ options, value, setValue }) {
    const id = useInputId()
    const selectedValues = value || []

    const toggleOption = (optionValue) => {
        if (selectedValues.includes(optionValue)) {
            setValue(selectedValues.filter(v => v !== optionValue))
        } else {
            setValue([...selectedValues, optionValue])
        }
    }

    return (
        <div className="col-sm-10">
            {/* Selected items as badges */}
            {selectedValues.length > 0 && (
                <div className="mb-2">
                    {selectedValues.map(val => (
                        <span key={val} className="badge bg-primary me-1 mb-1">
                            {val}
                            <button
                                type="button"
                                className="btn-close btn-close-white ms-1"
                                style={{ fontSize: '0.6rem' }}
                                onClick={() => toggleOption(val)}
                                aria-label="Remove"
                            />
                        </span>
                    ))}
                </div>
            )}
            
            {/* Checkbox list */}
            <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {options.map(option => (
                    <div key={option} className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id={`${id}-${option}`}
                            checked={selectedValues.includes(option)}
                            onChange={() => toggleOption(option)}
                        />
                        <label className="form-check-label" htmlFor={`${id}-${option}`}>
                            {option}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function RoomInput({ value, setValue }) {
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

export function ConferenceRoomInput({ value, setValue, disableCreation, apiPrefix }) {
    return <ObjectInput
        value={value}
        setValue={setValue}
        objCode="conference-room"
        objName="aula per conferenza"
        oa="a"
        render={conferenceRoom => conferenceRoom.name ?? '???'}
        new_object={disableCreation ? null : q => ({ name: '' })}
        inputs={{
            name: 'Nome',
        }}
        placeholder="Aula per conferenza..."
        apiPrefix={apiPrefix}
    />
}

export function SeminarCategoryInput({ value, setValue, disableCreation, multiple }) {
    return <ObjectInput
        value={value}
        setValue={setValue}
        objCode="seminar-category"
        objName="ciclo di seminari"
        oa="o"
        render={seminarCategory => seminarCategory.name}
        new_object={disableCreation ? null : q => ({ name: q, label: '' })}
        inputs={{
            name: 'Nome',
            label: 'Label',
        }}
        placeholder="Ciclo di seminari..."
        multiple={multiple}
    />
}

// export function ConferenceRoomInput({ value, setValue }) {
//     const engine = useEngine()
//     const query = useQuery(['conference-room'], () => api.get('/api/v0/conference-room', {_sort: 'name', _limit: 100}), {
//         onError: (err) => {
//             engine.addMessage(err.message, 'error') },
//         })
    
//     if (query.isLoading) return <Loading />
    
//     const data = new Map(query.data.data.map(conferenceRoom => ([conferenceRoom._id, conferenceRoom])))
    
//     if (value && value._id) value = value._id
    
//     return <SelectInput 
//         options = {Array.from(data.keys())}
//         displayFunction = {id => {
//             if (id === null) return '---'
//             const conferenceRoom = data.get(id)
//             if (conferenceRoom === undefined) return '???' // database inconsistency
//             return conferenceRoom.name
//         }}
//         value={value} 
//         setValue={value => setValue(value ? data.get(value) : null)}
//     />
// }

export function InstitutionInput({ value, setValue, multiple, disableCreation }) {
    return <ObjectInput 
        value={value} 
        setValue={setValue} 
        multiple={multiple} 
        objCode="institution"
        objName="institution"
        oa="o"
        render={_ => `${_.name} ${_.city ? '('+_.city + ')' : ''}`}
        new_object={disableCreation ? null : q => ({name: q})}
        inputs={{
                name: 'nome',
        }}
        placeholder="affiliazione"
    />
}


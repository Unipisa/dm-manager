import { Form, Modal, Button } from 'react-bootstrap'
import UtcDatePicker from "./UtcDatePicker"
import "react-datepicker/dist/react-datepicker.css"
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { useState, useRef, useId } from 'react';

import api from '../api'
import { myDateFormat } from '../Engine'

export function StringInput({ label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {value}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>
            { label }</Form.Label>
        <div className="col-sm-10">
            <input className="form-control col-sm-10"
                id={ id } 
                value={ value || "" } 
                onChange={ (evt) => {setValue(evt.target.value)} }
            />                 
        </div>
    </Form.Group>
}

export function DateInput({ label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {myDateFormat(value)}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>
            { label }</Form.Label>
        <div className="col-sm-10">
            <UtcDatePicker 
                className="form-control"
                selected={ value ? new Date(value) : null }  
                dateFormat="d.MM.yyyy"
                onChange={ date => setValue(date) } />
        </div>
    </Form.Group>
}

export function ListInput({ label, value, setValue, separator, edit }) {
    const id = useId()
    if (separator === undefined) separator = ','    
    if (!edit) return <p><b>{label}:</b> {value.join(', ')}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>{ label }</Form.Label>
            <div className="col-sm-10">
                <input 
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
        </div>
    </Form.Group>
}

export function TextInput({ label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {value}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>
            { label }</Form.Label>
        <div className="col-sm-10">
            <textarea 
                id={ id } 
                value={ value || "" }
                rows={10}
                onChange={ (evt) => setValue(evt.target.value) }
                className="form-control" 
            />
        </div>
    </Form.Group>
}

//
// How to use this input: insert something along the lines of 
//
//  <PersonInput label="Persona" value={person} setValue={setPerson} edit={true}></PersonInput>
//
export function ObjectInput({ placeholder, render, new_object, objCode, objName, oa, inputs, label, value, setValue, edit, multiple }) {
    const [options, setOptions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [show, setShow] = useState(false)
    const typeaheadref = useRef(null)
    const id = useId()

    // Data used for the new person create
    const [newObject, setNewObject] = useState({})

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

    if (! edit) {
        const values = multiple ? value : [ value ]
        return <p>
            <strong>{ label }: </strong>{Array.from(values).map(labelDisplayFunction).join(", ")}
        </p> 
    }

    function handleClose() {
        // Add a new person with the given data
        api.put(`/api/v0/${objCode}`, newObject).then(data => {      
            if (multiple) {
                setValue([ ...value, data ])
                setSelected([ ...value, data ])
            }   
            else {       
                setValue(data)
                setSelected([ data ])
            }
            typeaheadref.current.blur()
        })

        setShow(false);
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
        })   
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

    return <Form.Group className="row">
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
       <Form.Label className="col-sm-2">
            { label }
        </Form.Label>
        <AsyncTypeahead
          className="col-sm-10"
          filterBy={filterBy}
          isLoading={isLoading}
          id={ id }
          labelKey={labelDisplayFunction}
          onSearch={handleSearch}
          options={options}
          ref={typeaheadref}
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
          placeholder={placeholder}
          selected={selected}
          renderMenuItemChildren={menuRenderFunction}
          multiple={multiple}
        />
    </Form.Group>
}

export function PersonInput({ label, value, setValue, edit, multiple }) {
    return <ObjectInput 
        label={label} value={value} setValue={setValue} edit={edit} multiple={multiple} 
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

export function RoomInput({ label, value, setValue, edit, multiple }) {
    return <ObjectInput 
        label={label} value={value} setValue={setValue} edit={edit} multiple={multiple} 
        objCode="room"
        objName="stanza"
        oa="a"
        render={_ => `${_.number}, piano ${_.floor } ${_.building}`}
        new_object={q => ({number: q, floor: "", building: ""})}
        inputs={{
                number: 'Numero',
                floor: 'Piano',
                building: 'Edificio',
        }}
        placeholder="numero"
        />
}

export function GrantInput({ label, value, setValue, edit, multiple }) {
    return <ObjectInput 
        label={label} value={value} setValue={setValue} edit={edit} multiple={multiple} 
        objCode="grant"
        objName="grant"
        oa="o"
        render={_ => `${_.identifier || _.name} (${_.pi })`}
        new_object={q => ({identifier: q})}
        inputs={{
                identifier: 'Identificativo',
        }}
        placeholder="grant"
        />
}

export function SelectInput({ options, label, value, setValue, edit }) {
    const id = useId()
    console.assert(options.includes(value)) 
    if (!edit) return <p><b>{label}:</b> {value}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>
            { label }</Form.Label>
        <div className="col-sm-10">
            <select className="form-control col-sm-10"
                id={ id } 
                value={ value || "" } 
                onChange={ (evt) => setValue(evt.target.value) }>
            { options.map(value => <option key={value} value={value}>{ value }</option>)}
            </select>
        </div>
    </Form.Group>
}

export function BooleanInput({ label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {value?'sì':'no'}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>
            { label }</Form.Label>
        <div className="col-sm-10">
            <input className="form-check-input col-sm-10"
                type='checkbox' 
                id={ id } 
                checked={ !!value } 
                onChange={ (evt) => {setValue(!!evt.target.checked)} }
            />                 
        </div>
    </Form.Group>

}

export function MultipleSelectInput({ options, label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {value.join(",")}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>
            { label }</Form.Label>
        <div className="col-sm-10">
            <select multiple className="form-control col-sm-10"
                id={ id }
                value={ value || [] }
                onChange={ (evt) => {
                    const opts = Array.from(evt.target.options)
                    const selectedOpts = opts.filter(x => x.selected).map(x => x.value)
                    setValue(selectedOpts)
                }}>
            { options.map(value => <option key={value} value={value}>{ value }</option>)}
            </select>
        </div>
    </Form.Group>
}
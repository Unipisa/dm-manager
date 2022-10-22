import { FormGroup, FormLabel } from 'react-bootstrap'
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

export function StringInput({ name, label, store, setStore, value }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `myinput-${name}`
    return <FormGroup className="row">
        <FormLabel className="col-sm-2" htmlFor={ id }>
            { label }</FormLabel>
        <div className="col-sm-10">
            <input className="form-control col-sm-10"
                id={ id } 
                name={ name } 
                value={ value || "" } 
                onChange={ (evt) => {
                    setStore(obj => {
                        obj = {...obj}
                        obj[name] = evt.target.value
                        return obj
                    })} 
                }
            />                 
        </div>
    </FormGroup>
}

export function DateInput({ name, label, store, setStore, value }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `dateinput-${name}`
    return <FormGroup className="row">
        <FormLabel className="col-sm-2" htmlFor={ id }>
            { label }</FormLabel>
        <div className="col-sm-10">
            <ReactDatePicker 
                className="form-control"
                selected={ value ? new Date(value) : null }  
                dateFormat="d.MM.yyyy"
                onChange={ date => {
                        setStore(obj => {
                            obj = {...obj}
                            obj[name] = date
                            return obj
                        }) 
                    } 
            }/>
        </div>
    </FormGroup>
}

export function ListInput({ name, label, store, setStore, value, separator }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    if (separator === undefined) separator = ','
    const id = `myinput-${name}`
    return <FormGroup className="row">
        <FormLabel className="col-sm-2" htmlFor={ id }>{ label }</FormLabel>
            <div className="col-sm-10">
                <input 
                    id={ id } 
                    name={ name } 
                    value={ value.join(separator) || "" } 
                    onChange={ (evt) => {
                            const val = evt.target.value
                                .split(separator)
                                .map( x => x.trim())
                            setStore(obj => {
                                obj = {...obj}
                                obj[name] = val
                                return obj
                            }) 
                        } 
                    }
                    className="form-control" 
                />
        </div>
    </FormGroup>
}

export function TextInput({ name, label, store, setStore, value }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `textinput-${name}`
    return <FormGroup className="row">
        <FormLabel className="col-sm-2" htmlFor={ id }>
            { label }</FormLabel>
        <div className="col-sm-10">
            <textarea 
                id={ id } 
                name={ name } 
                value={ value || "" } 
                onChange={ (evt) => {
                        setStore(obj => {
                            obj = {...obj}
                            obj[name] = evt.target.value
                            return obj
                        }) 
                    } 
                }
                className="form-control" 
            />
        </div>
    </FormGroup>
}

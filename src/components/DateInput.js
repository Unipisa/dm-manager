import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

export default function DateInput({ name, label, store, setStore, value }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `dateinput-${name}`
    return <>
    <tr>
        <td style={{text_align: "right"}}>
            <label className="form-label" htmlFor={ id }>{ label }</label>
        </td>
        <td>
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
        </td>
    </tr>
    </>
}
export default function TextInput({ name, label, store, setStore, value }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `textinput-${name}`
    return <>
    <tr>
        <td style={{text_align: "right"}}>
            <label className="form-label" htmlFor={ id }>{ label }</label>
        </td>
        <td>
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
        </td>
    </tr>
    </>
}
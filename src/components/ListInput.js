export default function ListInput({ name, label, store, setStore, value }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `myinput-${name}`
    return <>
    <tr>
        <td style={{text_align: "right"}}>
            <label className="form-label" htmlFor={ id }>{ label }</label>
        </td>
        <td>
            <input 
                id={ id } 
                name={ name } 
                value={ value.join(',') || "" } 
                onChange={ (evt) => {
                        const val = evt.target.value
                            .split(',')
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
        </td>
    </tr>
    </>
}
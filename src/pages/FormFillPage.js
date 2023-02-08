import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from 'react-bootstrap'

import { useEngine } from '../Engine'
import api from '../api'
import Models from '../models/Models'
import { useObject, ObjectProvider } from '../components/ObjectProvider'

export default function FormFillPage() {
    const id = useParams().id
    if (!id) return <p>Invalid id ({id})</p>
    return <ObjectProvider Model={ Models.Form } id={id}>
        <FormFillPageInner />
    </ObjectProvider>
}

function FormFillPageInner() {
    const engine = useEngine()
    const user = engine.user
    const vars = {
        email: user.email,
        username: user.username,
        lastName: user.lastName,
        firstName: user.firstName,
    }
    const [data, setData] = useState({})
    const form = useObject()
    const [thanks, setThanks] = useState(false)

    async function submit() {
        const res = await api.put(`${Models.Form.viewUrl(form._id)}/fill`, data)
        setThanks(true)
    }

    if (thanks) return <p>
        <b>Grazie per aver compilato il modulo!</b>
        <br />
        Le tue risposte sono state inviate, 
        puoi chiudere questa pagina.</p>

    return <>
        <h1>{form.name}</h1>
        <RenderHtml text={form.text} vars={vars} 
            data={data} setData={setData} />
        <Button onClick={submit}>invia modulo</Button>
    </>

}

function RenderHtml({text, vars, data, setData}) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/html')
    return <RenderElement el={doc.body} key="body"
         vars={vars} data={data} setData={setData} />
}

function Error({key, children}) {
    return <span key={key} className='text-danger bg-warning'>{'<'}{children}{'>'}</span>
}

function RenderElement({el, key, vars, data, setData}) {
const nodeName = el.nodeName.toLowerCase()
if (nodeName === '#text') return el.textContent
const children = [...el.childNodes].map((child, i) => 
    <RenderElement el={child} key={i} vars={vars} 
        data={data} setData={setData} />)
//return <>({nodeName}){children}(/{nodeName})</>
if (nodeName == 'var') {
    if (!vars) return <Error key={key}>internal error: no vars</Error>
    const varName = el.textContent
    if (!vars[varName]) return <Error key={key}>invalid var: {`"${varName}"`}</Error>
    return <span key={key}>{vars[varName]}</span>
}
if (nodeName === 'br') return <br key={key} />
if (nodeName === 'p') return <p key={key}>{children}</p>
if (nodeName === 'b') return <b key={key}>{children}</b>
if (nodeName === 'i') return <i key={key}>{children}</i>
if (nodeName === 'select') return <select 
    name={el.name} value={data[el.name]}
    onChange={ evt => setData(data => ({
        ...data, [el.name]: evt.target.value}))}>
    {children}
</select>
if (nodeName === 'option') return <option value={el.value}>{children}</option>
return <>{children}</>
}
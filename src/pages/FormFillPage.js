import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card } from 'react-bootstrap'

import { useEngine } from '../Engine'
import { useObject, ObjectProvider } from '../components/ObjectProvider'
import LoginPage from './LoginPage'

export default function FormFillPage({enabled = true, showData = false}) {
    const id = useParams().id
    if (!id) return <p>Invalid id ({id})</p>
    return <ObjectProvider path="fill" id={id}>
        <FormFillPageInner enabled={enabled} showData={showData}/>
    </ObjectProvider>
}

export function FormFillPageInner({enabled, showData}) {
    const engine = useEngine()
    const user = engine.user
    const vars = {
        email: user?.email,
        username: user?.username,
        lastName: user?.lastName,
        firstName: user?.firstName,
    }
    const [data, setData] = useState({})
    const form = useObject()
    const [thanks, setThanks] = useState(false)
    const putUrl = `/fill/${form._id}`
    const put = engine.usePut(putUrl)

    if (!user && form.requireAutentication) {
        return <LoginPage engine={engine}/>
    }

    async function submit() {
        if (!enabled) {
            engine.addWarningMessage('Modulo disabilitato')
            return
        }
        await put(data)
        setThanks(true)
    }

    if (form.closed) {
        return <Card>
            <Card.Header>{form.name}</Card.Header>
            <Card.Body>
                <b>Il modulo è chiuso.</b>
            </Card.Body>
        </Card>
    }

    if (thanks) return <p>
        <b>Grazie per aver compilato il modulo!</b>
        <br />
        Le tue risposte sono state inviate, 
        puoi chiudere questa pagina.</p>

    return <>
        <Card>
            <Card.Header>{form.name}</Card.Header>
            <Card.Body>
                <RenderHtml text={form.text} vars={vars} 
                    data={data} setData={setData} />
            </Card.Body>
            <Card.Footer>
                <Button disabled={!enabled} onClick={submit}>invia modulo</Button>       
            </Card.Footer>
        </Card>
        <table style={{display: showData?'block':'none'}}>
            <thead>
                <tr>
                    <th>name</th>
                    <th>value</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(data).map(([field, value]) =>
                    <tr key={field}>
                        <td>{field}</td>
                        <td>{value}</td>
                    </tr>  
                )}  
            </tbody>
        </table>
    </>

}

export function extractFieldNames(text) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/html')
    return extractFieldNamesFromElement(doc.body)
}

function extractFieldNamesFromElement(el) {
    const nodeName = el.nodeName.toLowerCase()
    if (nodeName === '#text') return []
    let names = []

    if (nodeName === 'input') names.push(el.name)
    if (nodeName === 'select') names.push(el.name)
    if (nodeName === 'textarea') names.push(el.name)
    
    ;[...el.childNodes].forEach(child => {
            names = [...names, ...extractFieldNamesFromElement(child)]
        })

    return names
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

function RenderElement({el, vars, data, setData}) {
    const nodeName = el.nodeName.toLowerCase()
    if (nodeName === '#text') return el.textContent
    const children = [...el.childNodes].map((child, i) => 
        <RenderElement el={child} key={i} vars={vars} 
            data={data} setData={setData} />)
    //return <>({nodeName}){children}(/{nodeName})</>
    if (nodeName === 'var') {
        if (!vars) return <Error>internal error: no vars</Error>
        const varName = el.textContent
        if (!vars[varName]) return <Error>invalid var: {`"${varName}"`}</Error>
        return <span>{vars[varName]}</span>
    }
    if (nodeName === 'br') return <br />
    if (nodeName === 'p') return <p>{children}</p>
    if (nodeName === 'b') return <b>{children}</b>
    if (nodeName === 'i') return <i>{children}</i>
    if (nodeName === 'ul') return <ul>{children}</ul>
    if (nodeName === 'li') return <li>{children}</li>
    if (nodeName === 'input') return <RenderInput el={el} data={data} setData={setData} />
    if (nodeName === 'select') return <RenderSelect el={el} data={data} setData={setData}>{children}</RenderSelect>
    if (nodeName === 'textarea') return <RenderTextarea el={el} data={data} setData={setData} />
    if (nodeName === 'option') return <option value={el.value}>{children}</option>
    if (nodeName === 'a') return <a href={el.href}>{children}</a>
    return <>{children}</>
}

function RenderInput({el, data, setData}) {
    const name = el.name
    const value = data[el.name] || el.value
    useEffect(() => {
        if (data[name] !== value) {
            setData(data => ({...data, [name]: value}))
        }
    }, [data, name, value, setData])
    if (!name) return <Error>input without name</Error>
    if (el.value && !data[el.name]) return <>...loading...</> 
    return <input
        className="form form-control"
        name={name}
        value={value}
        onChange={ evt => setData(data => ({
            ...data, [name]: evt.target.value}))} />
}

function RenderSelect({el, data, setData, children}) {
    const name = el.name
    const value = data[el.name] || el.value
    useEffect(() => {
        if (data[name] !== value) {
            setData(data => ({...data, [name]: value}))
        }
    }, [data, name, value, setData])
    if (!name) return <Error>select without name</Error>
    if (el.value && !data[el.name]) return <>...loading...</> 
    return <select className="form form-control"
        name={name} value={value}
        onChange={ evt => setData(data => ({
            ...data, [name]: evt.target.value}))}>
        {children}
    </select>
}

function RenderTextarea({el, data, setData}) {
    const name = el.name
    const value = data[el.name] || el.value
    useEffect(() => {
        if (data[name] !== value) {
            setData(data => ({...data, [name]: value}))
        }
    }, [data, name, value, setData])
    if (!name) return <Error>textarea without name</Error>
    if (el.value && !data[el.name]) return <>...loading...</> 
    return <textarea
        className="form form-control"
        name={name}
        onChange={ evt => setData(data => ({
            ...data, [name]: evt.target.value}))} value={value} />
}


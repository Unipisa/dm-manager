import { useParams } from 'react-router-dom'

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
    const form = useObject()
    return <>
        { renderHtml(form.text) }
    </>
}

function renderHtml(html) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    console.log('doc')
    console.dir(doc)
    return renderElement(doc.body, 'body')
}

function renderElement(el, key) {
const nodeName = el.nodeName.toLowerCase()
console.log(`rendering ${nodeName} ${el}`)
console.dir(el)
if (nodeName === '#text') return el.textContent
const children = [...el.childNodes].map((child, i) => renderElement(child,i))
if (nodeName === 'b') return <b key={key}>{children}</b>
if (nodeName === 'select') return <select name={el.name} value={el.value}>{children}</select>
if (nodeName === 'option') return <option value={el.value}>{children}</option>
return <>{children}</>
}
import { useParams, Link } from 'react-router-dom'
import { Tabs, Tab } from 'react-bootstrap'

import { useEngine } from '../Engine'
import ModelView from '../components/ModelView'
import { ObjectProvider, useObject } from '../components/ObjectProvider'
import { FormFillPageInner } from './FormFillPage'
import LoadTable from '../components/LoadTable'

export default function FormViewPage() {
    const params = useParams()
    const id = params.id
    const engine = useEngine()
    const Form = engine.Models.Form

    return <ObjectProvider path={Form.code} id={id}>
        <FormViewPageInner/>
    </ObjectProvider>
}

function FormViewPageInner() {
    const engine = useEngine()
    const Form = engine.Models.Form
    const form = useObject()
    const fillUrl = form.requireAuthentication ? `/fill/${form._id}` : `/pub/fill/${form._id}`
    return <>
        <ModelView Model={Form} buttons={[
            'edit', 
            'clone', 
            <Link key='fill' className='btn btn-success' to={fillUrl}>compila</Link>,
            'index'
            ]} />
        <Tabs className='my-2'>
            <Tab eventKey="fill" title="anteprima">
                <FormFillPageInner enabled={false} showData={true}/>
            </Tab>
            <Tab eventKey="data" title="dati">
                <FormDataView />
            </Tab>
        </Tabs>
    </>
}


function FormDataView() {
    const engine = useEngine()
    const form = useObject()
    const Form = engine.Models.Form

    return <>
        <LoadTable 
            path={`${Form.code}/${form._id}/data`}
            columns={['createdAt', 'email', 'firstName', 'lastName', 'data']}
        />
    </>
}
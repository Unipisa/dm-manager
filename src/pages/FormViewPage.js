import { useParams, Link } from 'react-router-dom'
import { Tabs, Tab } from 'react-bootstrap'

import { useEngine } from '../Engine'
import ModelView from '../components/ModelView'
import { ObjectProvider, useObject } from '../components/ObjectProvider'
import FormFillPage from './FormFillPage'
import LoadTable from '../components/LoadTable'

export default function FormViewPage() {
    const params = useParams()
    const id = params.id
    const engine = useEngine()
    const Form = engine.Models.Form

    return <ObjectProvider path={Form.code} id={id}>
        <ModelView Model={Form} buttons={[
            'edit', 
            'clone', 
            <Link key='fill' className='btn btn-success' to='fill'>compila</Link>,
            'index'
            ]} />
        <Tabs className='my-2'>
            <Tab eventKey="fill" title="anteprima">
                <FormFillPage enabled={false} showData={true}/>
            </Tab>
            <Tab eventKey="data" title="dati">
                <FormDataView />
            </Tab>
        </Tabs>
    </ObjectProvider>
}

function FormDataView() {
    const engine = useEngine()
    const form = useObject()
    const Form = engine.Models.Form

    return <LoadTable 
        path={`${Form.viewUrl(form._id)}/data`}
        columns={['createdAt', 'email', 'firstName', 'lastName', 'data']}
    />
}
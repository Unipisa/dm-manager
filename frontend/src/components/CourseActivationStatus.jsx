import { Form } from 'react-bootstrap'
import { useInputId } from './Input'

const labels = {
    '': 'Non monitorata',
    pending: 'Da confermare',
    confirmed: 'Confermata',
}

export function formatActivationStatus(value) {
    return labels[value ?? ''] ?? value
}

export default function CourseActivationStatus({ id, value, setValue }) {
    const inputId = useInputId()

    return <>
        <Form.Select
            id={id ?? inputId}
            value={value ?? ''}
            onChange={event => setValue(event.target.value || null)}
        >
            {Object.entries(labels).map(([value, label]) =>
                <option key={value} value={value}>{label}</option>
            )}
        </Form.Select>
        <Form.Text muted>
            Lasciare «Non monitorata» se il dottorato non gestisce separatamente l’attivazione dei corsi.
        </Form.Text>
    </>
}

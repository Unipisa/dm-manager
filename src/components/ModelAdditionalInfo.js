import { Card } from 'react-bootstrap'
import { useObject } from './ObjectProvider'

export default function ModelAdditionalInfo({ Model }) {
    const obj = useObject()

    const additionalInfo = Model.additionalInfo ? Model.additionalInfo(obj) : null

    if (! additionalInfo) {
        return []
    }

    return <Card className="my-2">
        <Card.Header><h4>Informazioni aggiuntive</h4></Card.Header>
        <Card.Body>
            {additionalInfo}
        </Card.Body>
    </Card>
}
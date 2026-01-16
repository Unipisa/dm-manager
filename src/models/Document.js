import Model from './Model'
import { Button } from 'react-bootstrap'
import { useEngine } from '../Engine'

// Separate functional component that can use hooks
const DocumentAdditionalInfo = ({ obj }) => {
    const externalLink = `${window.location.origin}/process/document/${obj._id}`
    const { addInfoMessage } = useEngine()
    
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(externalLink)
            addInfoMessage("link copiato")
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <div>
            <strong>Link esterno al documento: </strong> 
            <a href={`/process/document/${obj._id}`}>
                {externalLink}
            </a>
            {' '}
            <Button className="btn-primary" onClick={handleCopy}>
                copia link
            </Button>
        </div>
    )
}

export default class Document extends Model {
    constructor() {
        super()
        this.code = 'document'
        this.name = "documento"
        this.oa = "o"
        this.articulation = {
            'oggetto': "documento", 
            'oggetti': "documenti",
            'l\'oggetto': "il documento",
            'gli oggetti': "i documenti", 
            'un oggetto': "un documento",
        }
        this.ModelName = 'Document'
        this.managerRoles = ['admin', 'document-manager']
        this.indexDefaultFilter = {'_sort': 'name', '_limit': 10}
        this.columns = {
            'name': "nome",
            'date': "data",
            'group_codes': "codici gruppi",
            'updatedAt': "modificato",
        }
    }

    describe(obj) { return `${obj.name}` }

    additionalInfo(obj) {
        return <DocumentAdditionalInfo obj={obj} />
    }
}
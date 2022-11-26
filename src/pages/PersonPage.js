import ModelPage from './ModelPage'

export default function PersonPage() {
    return <ModelPage
        ModelName = 'Person'
        objCode = 'person'
        objName = 'persona'
        indexUrl = '/persons'
        oa = 'a'
        describe = {obj => obj?.lastName} 
    />
}

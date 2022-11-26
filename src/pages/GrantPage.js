import ModelPage from './ModelPage'

export default function GrantPage() {
    return <ModelPage
        ModelName = 'Grant'
        objCode = 'grant'
        objName = 'grant'
        indexUrl = '/grants'
        oa = 'o'
        describe = {grant => grant?.name}
    />
}

import ModelPage from './ModelPage'

export default function UserPage() {
    return <ModelPage
        ModelName = 'User'
        objCode = 'user'
        objName = 'utente'
        indexUrl = '/users'
        oa = 'o'
        describe = {obj => obj?.username} 
    />
}

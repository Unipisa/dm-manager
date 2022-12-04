import ModelPage from './ModelPage'

export default function RoomAssignementPage() {
    return <ModelPage
        ModelName = 'RoomAssignement'
        objCode = 'roomAssignement'
        objName = 'assegnazione stanza'
        indexUrl = '/rooms'
        oa = 'a'
        describe = {obj => `{obj.person?.lastName} {obj.room?.number} {obj.room?.building} {obj.room?.floor}`}
    />
}

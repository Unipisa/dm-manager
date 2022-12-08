import ModelPage from './ModelPage'

export default function RoomAssignmentPage() {
    return <ModelPage
        ModelName = 'RoomAssignment'
        objCode = 'roomAssignment'
        objName = 'assegnazione stanza'
        indexUrl = '/assignments'
        oa = 'a'
        describe = {obj => `${obj.person?.lastName} ${obj.room?.number} ${obj.room?.building} ${obj.room?.floor}`}
    />
}

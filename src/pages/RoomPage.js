import ModelPage from './ModelPage'

export default function RoomPage() {
    return <ModelPage
        ModelName = 'Room'
        objCode = 'room'
        indexUrl = '/rooms'
        objName = 'stanza'
        oa = 'a'
        describe = {room => `${room.number} ${room.floor} ${room.building}`}
    />
}

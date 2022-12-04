import ModelPage from './ModelPage'

export default function RoomPage() {
    return <ModelPage
        ModelName = 'Room'
        objCode = 'room'
        objName = 'room'
        indexUrl = '/rooms'
        oa = 'a'
        describe = {room => `${room.number} ${room.floor} ${room.building}`}
    />
}

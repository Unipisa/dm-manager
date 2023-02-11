import Grant from './Grant'
import RoomLabel from './RoomLabel'
import Room from './Room'
import RoomAssignment from './RoomAssignment'
import Visit from './Visit'
import Person from './Person'
import User from './User'
import Token from './Token'
import Staff from './Staff'
import Group from './Group'
import Form from './Form'
import Log from './Log'

const Models = { 
    RoomLabel: new RoomLabel(),
    Form: new Form(),
    Room: new Room(),
    RoomAssignment: new RoomAssignment(),
    Visit: new Visit(),
    Grant: new Grant(),
    Staff: new Staff(),
    Group: new Group(),
    Person: new Person(),
    User: new User(),
    Token: new Token(),
    Log: new Log(),
}

export default Models
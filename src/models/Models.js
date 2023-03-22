import Grant from './Grant'
import RoomLabel from './RoomLabel'
import Room from './Room'
import RoomAssignment from './RoomAssignment'
import Visit from './Visit'
import Person from './Person'
import Institution from './Institution'
import User from './User'
import Token from './Token'
import Staff from './Staff'
import Group from './Group'
import Form from './Form'
import Log from './Log'
import Thesis from './Thesis'

const Models = { 
    // amministrazione:
    Token: new Token(),
    User: new User(),
    Log: new Log(),

    // personale:
    Person: new Person(),
    Group: new Group(),
    Staff: new Staff(),

    // ricerca:
    Grant: new Grant(),
    Thesis: new Thesis(),
    Visit: new Visit(),
    Institution: new Institution(),

    // stanze:
    RoomAssignment: new RoomAssignment(),
    RoomLabel: new RoomLabel(),
    Room: new Room(),

    // altro:
    Form: new Form(),
}

export default Models
import Grant from './Grant'
import RoomLabel from './RoomLabel'
import Room from './Room'
import ConferenceRoom from './ConferenceRoom'
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
import Url from './Url'
import Document from './Document'
import Upload from './Upload'
import Timesheet from './Timesheet'
import EventSeminar from './EventSeminar'
import EventConference from './EventConference'
import EventPhdCourse from './EventPhdCourse'
import SeminarCategory from './SeminarCategory'

const Models = { 
    // amministrazione:
    Token: new Token(),
    User: new User(),
    Log: new Log(),
    Url: new Url(),

    // personale:
    Person: new Person(),
    Group: new Group(),
    Staff: new Staff(),
    Document: new Document(),

    // ricerca:
    Grant: new Grant(),
    Thesis: new Thesis(),
    Visit: new Visit(),
    Institution: new Institution(),
    Timesheet: new Timesheet(),

    // stanze:
    RoomAssignment: new RoomAssignment(),
    RoomLabel: new RoomLabel(),
    Room: new Room(),
    ConferenceRoom: new ConferenceRoom(),

    // altro:
    Form: new Form(),
    Upload: new Upload(),

    // eventi:
    EventSeminar: new EventSeminar(),
    EventConference: new EventConference(),
    EventPhdCourse: new EventPhdCourse(),
    
    SeminarCategory: new SeminarCategory(),
}

export default Models
// A small, consistent department used by the client contract tests.
// Records are created through the Mongoose models, so they must satisfy the
// current schemas. Dates are relative to now: every query that depends on
// "today" (current staff, upcoming seminars, ...) keeps its meaning.

const DAY = 24 * 60 * 60 * 1000

function daysFromNow(days, hour = 0) {
    const date = new Date(Date.now() + days * DAY)
    date.setHours(hour, 0, 0, 0)
    return date
}

async function seedFixtures() {
    const Institution = require('../../models/Institution')
    const Person = require('../../models/Person')
    const Staff = require('../../models/Staff')
    const Room = require('../../models/Room')
    const RoomAssignment = require('../../models/RoomAssignment')
    const ConferenceRoom = require('../../models/ConferenceRoom')
    const SeminarCategory = require('../../models/SeminarCategory')
    const Group = require('../../models/Group')
    const Grant = require('../../models/Grant')
    const Visit = require('../../models/Visit')
    const Thesis = require('../../models/Thesis')
    const EventSeminar = require('../../models/EventSeminar')
    const EventConference = require('../../models/EventConference')
    const EventPhdCourse = require('../../models/EventPhdCourse')
    const Document = require('../../models/Document')

    const pisa = await Institution.create({ name: 'Università di Pisa', country: 'Italy', city: 'Pisa' })
    const abroad = await Institution.create({ name: 'Example University', country: 'France', city: 'Paris' })

    const person = (firstName, lastName, extra = {}) => Person.create({
        firstName, lastName,
        email: `${firstName.toLowerCase()}@example.test`,
        affiliations: [pisa._id],
        ...extra,
    })

    // Internal full professor: room, group chair, grant PI, advisor, lecturer.
    const alice = await person('Alice', 'Rossi', { gender: 'Donna', orcid: '0000-0000-0000-0001' })
    // Current collaborator and expired collaborator (mailing list sync).
    const bruno = await person('Bruno', 'Bianchi')
    const carla = await person('Carla', 'Verdi')
    // Foreign visitor and seminar speaker.
    const dmitri = await person('Dmitri', 'Ivanov', { affiliations: [abroad._id] })
    // PhD student, thesis author.
    const elena = await person('Elena', 'Neri')

    const staff = {
        alice: await Staff.create({
            person: alice._id, matricola: 'a000001', qualification: 'PO', isInternal: true,
            startDate: daysFromNow(-1000), endDate: null, SSD: ['MATH-02/A'],
        }),
        bruno: await Staff.create({
            person: bruno._id, qualification: 'Collaboratore', isInternal: true,
            startDate: daysFromNow(-100), endDate: daysFromNow(100),
        }),
        carla: await Staff.create({
            person: carla._id, qualification: 'Collaboratore', isInternal: true,
            startDate: daysFromNow(-400), endDate: daysFromNow(-10),
        }),
        elena: await Staff.create({
            person: elena._id, matricola: 'a000005', qualification: 'Dottorando in Matematica', isInternal: true,
            startDate: daysFromNow(-400), endDate: daysFromNow(700), SSD: ['MATH-02/A'],
        }),
    }

    const studio = await Room.create({
        number: '101', floor: '1', building: 'A', nSeats: 2,
        description: 'Studio', polygon: '[[0,0],[1,0],[1,1],[0,1]]',
    })
    const guestRoom = await Room.create({ number: '102', floor: '1', building: 'A', nSeats: 4, description: 'Ospiti' })
    // Reserved for write contracts (planimetrie editor), so reads stay stable.
    const editableRoom = await Room.create({ number: '201', floor: '2', building: 'B', nSeats: 1 })
    const lectureHall = await Room.create({ number: '001', floor: '0', building: 'A', nSeats: 200 })

    await RoomAssignment.create({ person: alice._id, room: studio._id, startDate: daysFromNow(-100), endDate: null })
    await RoomAssignment.create({ person: dmitri._id, room: guestRoom._id, startDate: daysFromNow(-2), endDate: daysFromNow(5) })

    const aulaMagna = await ConferenceRoom.create({ name: 'Aula Magna', room: lectureHall._id })
    const category = await SeminarCategory.create({ name: 'Seminario di Analisi', label: 'seminari-analisi' })

    const council = await Group.create({
        name: 'Consiglio di Dipartimento', code: 'consiglio-dipartimento',
        members: [alice._id, bruno._id], chair: alice._id, chair_title: 'Presidente',
        vice: bruno._id, vice_title: 'Vicepresidente', startDate: null, endDate: null,
    })

    const grant = await Grant.create({
        name: 'Example PRIN', identifier: 'PRIN-0001', projectType: 'PRIN', funds: 'National',
        fundingEntity: 'MUR', pi: alice._id, localCoordinator: alice._id, members: [alice._id, bruno._id],
        startDate: daysFromNow(-200), endDate: daysFromNow(500), SSD: ['MATH-02/A'],
        webSite: 'https://prin.example.test', budgetAmount: '100000', description: 'A research project.',
    })

    const visits = {
        current: await Visit.create({
            person: dmitri._id, affiliations: [abroad._id], startDate: daysFromNow(-2), endDate: daysFromNow(5),
            referencePeople: [alice._id], grants: [grant._id], collaborationTheme: 'Elliptic equations',
            publish: true, SSD: 'MATH-02/A',
        }),
        past: await Visit.create({
            person: dmitri._id, affiliations: [abroad._id], startDate: daysFromNow(-60), endDate: daysFromNow(-50),
            referencePeople: [alice._id], publish: true,
        }),
        future: await Visit.create({
            person: dmitri._id, affiliations: [abroad._id], startDate: daysFromNow(10), endDate: daysFromNow(15),
            referencePeople: [alice._id], publish: true,
        }),
    }

    const thesis = await Thesis.create({
        person: elena._id, title: 'On elliptic equations', advisors: [alice._id],
        date: daysFromNow(-30), institutions: [pisa._id], SSD: 'MATH-02/A',
    })

    const seminars = {
        upcoming: await EventSeminar.create({
            title: 'Upcoming seminar', speakers: [dmitri._id], organizers: [alice._id],
            conferenceRoom: aulaMagna._id, startDatetime: daysFromNow(1, 14), duration: 60,
            category: [category._id], grants: [grant._id], abstract: 'We prove a theorem.',
        }),
        past: await EventSeminar.create({
            title: 'Past seminar', speakers: [dmitri._id], organizers: [alice._id],
            conferenceRoom: aulaMagna._id, startDatetime: daysFromNow(-10, 14), duration: 60,
            category: [], grants: [], abstract: 'An older theorem.',
        }),
    }

    const conference = await EventConference.create({
        title: 'Workshop on PDE', organizers: [alice._id], startDate: daysFromNow(3), endDate: daysFromNow(5),
        SSD: ['MATH-02/A'], url: 'https://workshop.example.test', conferenceRoom: aulaMagna._id,
        institution: pisa._id, isOutreach: false, grants: [grant._id], description: 'Three days of talks.',
    })

    const course = await EventPhdCourse.create({
        title: 'Topics in PDE', phd: 'Matematica', courseType: 'Thematic', activationStatus: 'confirmed',
        coordinators: [alice._id], lecturers: [alice._id], description: 'Advanced course.',
        startDate: daysFromNow(-5), endDate: daysFromNow(30),
        lessons: [
            { date: daysFromNow(2, 10), duration: 120, conferenceRoom: aulaMagna._id, lecturers: [alice._id] },
            { date: daysFromNow(40, 10), duration: 120, conferenceRoom: aulaMagna._id, lecturers: [alice._id] },
        ],
    })

    // Dates as sent by tools/upload-documents.js: "YYYY-MM-DD", i.e. UTC midnight.
    const documents = {
        restricted: await Document.create({
            name: 'Verbale del Consiglio', date: new Date(isoDay(-20)), description: 'Seduta ordinaria',
            access_codes: ['consiglio-dipartimento'], owners: [], attachments: [],
        }),
        public: await Document.create({
            name: 'Verbale della Commissione Paritetica', date: new Date(isoDay(-40)),
            access_codes: ['pubblico'], owners: [], attachments: [],
        }),
    }

    return {
        institutions: { pisa, abroad },
        people: { alice, bruno, carla, dmitri, elena },
        staff,
        rooms: { studio, guestRoom, editableRoom, lectureHall },
        aulaMagna, category, council, grant, visits, thesis, seminars, conference, course, documents,
    }
}

// "YYYY-MM-DD" (local calendar day), the format used by most clients.
function isoDay(days = 0) {
    const date = daysFromNow(days)
    const pad = n => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

module.exports = { seedFixtures, daysFromNow, isoDay }

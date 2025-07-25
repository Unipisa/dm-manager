const express = require('express')
const RoomAssignment = require('../../models/RoomAssignment')
const Person = require('../../models/Person')
const Room = require('../../models/Room')
const { requireUser } = require('../middleware')

const router = express.Router()

// Middleware: solo autenticazione, i permessi sono gestiti globalmente
router.use(requireUser)

// Espone le route di ricerca persona per il widget
require('./personSearch')(router)

// POST /changeRoom: { personId, newRoomId, startDate?, endDate? }
router.post('/', async (req, res) => {
    const { personId, newRoomId, startDate, endDate } = req.body
    if (!personId || !newRoomId) {
        return res.status(400).json({ error: 'Missing personId or newRoomId' })
    }
    try {
        // End all current assignments for this person
        await RoomAssignment.updateMany(
            { person: personId, endDate: null },
            { $set: { endDate: startDate ? new Date(startDate) : new Date() } }
        )
        // Create new assignment
        const assignment = await RoomAssignment.create({
            person: personId,
            room: newRoomId,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            createdBy: req.user?._id,
        })
        res.json({ success: true, assignment })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router

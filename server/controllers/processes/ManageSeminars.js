const express = require('express')
const router = express.Router()

const EventSeminarController = require('../EventSeminarController')
const EventSeminar = require('../../models/EventSeminar')

const controller = new EventSeminarController()

router.get('/', async (req, res) => {    
    if (req.user === undefined) {
        res.status(401).json({
            result: "Unauthorized"
        })
    }
    else {
        controller.performQuery({ createdBy: req.user._id }, res)
    }

})

router.delete('/:id', async (req, res) => {
    const seminar = await EventSeminar.findById(req.params.id)

    if (req.user.equals(seminar.createdBy)) {
        await seminar.delete()
        res.json({})
    }
    else {
        res.status(401).json({
            error: "Cannot delete seminars created by other users"
        })
    }
})

module.exports = router
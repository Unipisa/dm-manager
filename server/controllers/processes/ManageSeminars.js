const express = require('express')
const router = express.Router()

const EventSeminarController = require('../EventSeminarController')

router.get('/', async (req, res) => {    
    const controller = new EventSeminarController()

    if (req.user === undefined) {
        res.status(401).json({
            result: "Unauthorized"
        })
    }
    else {
        controller.performQuery({ createdBy: req.user._id }, res)
    }

})

module.exports = router
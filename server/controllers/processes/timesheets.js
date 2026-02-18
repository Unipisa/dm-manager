const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongoose').Types

const Timesheet = require('../../models/Timesheet')
const TimesheetController = require('../TimesheetController')
const { generateTimesheetPDF } = require('./timesheetPdfGenerator')
const controller = new TimesheetController()
const { log } = require('../middleware')

// Helper: check if user can access a given timesheet
async function canAccessTimesheet(req, timesheet) {
    // Admin can access any timesheet
    if (req.roles?.includes('admin')) {
        return true
    }
    // Employee can only access their own
    if (req.person?._id && timesheet.employee.equals(req.person._id)) {
        return true
    }
    return false
}

// GET /process/timesheets
// Returns the logged-in employee's own timesheet
router.get('/', async (req, res) => {
    if (!req.person?._id) {
        return res.status(403).json({ error: 'No person associated with this user' })
    }

    const pipeline = [
        { $match: { employee: new ObjectId(req.person._id) } },
        ...controller.queryPipeline,
    ]

    const data = await Timesheet.aggregate(pipeline)

    return res.send({
        data: data.length > 0 ? data[0] : null,
    })
})

// GET /process/timesheets/:timesheetId
// Returns a specific timesheet - employee can only access their own, admin can access any
router.get('/:timesheetId', async (req, res) => {
    try {
        const pipeline = [
            { $match: { _id: new ObjectId(req.params.timesheetId) } },
            ...controller.queryPipeline,
        ]

        const data = await Timesheet.aggregate(pipeline)

        if (data.length === 0) {
            return res.status(404).json({ error: 'Timesheet not found' })
        }

        const timesheet = data[0]

        if (!await canAccessTimesheet(req, timesheet)) {
            return res.status(403).json({ error: 'Access denied' })
        }

        return res.send({ data: timesheet })
    } catch (error) {
        console.error(error)
        return res.status(400).json({ error: error.message })
    }
})

// GET /process/timesheets/:timesheetId/:year/:month
// Returns a specific month's data
router.get('/:timesheetId/:year/:month', async (req, res) => {
    const year = parseInt(req.params.year)
    const month = parseInt(req.params.month)

    try {
        const pipeline = [
            { $match: { _id: new ObjectId(req.params.timesheetId) } },
            ...controller.queryPipeline,
        ]

        const data = await Timesheet.aggregate(pipeline)

        if (data.length === 0) {
            return res.status(404).json({ error: 'Timesheet not found' })
        }

        const timesheet = data[0]

        if (!await canAccessTimesheet(req, timesheet)) {
            return res.status(403).json({ error: 'Access denied' })
        }

        const monthData = timesheet.months?.find(m => m.year === year && m.month === month)

        if (!monthData) {
            return res.status(404).json({ error: 'Month not found' })
        }

        return res.send({
            timesheet: {
                _id: timesheet._id,
                employee: timesheet.employee,
                grants: timesheet.grants,
                role: timesheet.role,
                startDate: timesheet.startDate,
                endDate: timesheet.endDate,
            },
            month: monthData,
        })
    } catch (error) {
        console.error(error)
        return res.status(400).json({ error: error.message })
    }
})

// PATCH /process/timesheets/:timesheetId/:year/:month
// Updates a specific month's hours
router.patch('/:timesheetId/:year/:month', async (req, res) => {
    const year = parseInt(req.params.year)
    const month = parseInt(req.params.month)

    try {
        const timesheet = await Timesheet.findById(req.params.timesheetId)

        if (!timesheet) {
            return res.status(404).json({ error: 'Timesheet not found' })
        }

        if (!await canAccessTimesheet(req, timesheet)) {
            return res.status(403).json({ error: 'Access denied' })
        }

        const monthData = timesheet.months.find(m => m.year === year && m.month === month)

        if (!monthData) {
            return res.status(404).json({ error: 'Month not found' })
        }

        if (monthData.locked) {
            return res.status(403).json({ error: 'This month is locked and cannot be modified' })
        }

        if (req.body.days) {
            const was = { ...monthData.toObject() }
            monthData.days = req.body.days
            await timesheet.save()
            await log(req, was, req.body)
        }

        if (req.body.activityDescription !== undefined) {
            monthData.activityDescription = req.body.activityDescription
            await timesheet.save()
        }

        return res.send({
            success: true,
            month: monthData,
        })
    } catch (error) {
        console.error(error)
        return res.status(400).json({ error: error.message })
    }
})

// GET /process/timesheets/:timesheetId/:year/:month/pdf
router.get('/:timesheetId/:year/:month/pdf', async (req, res) => {
    const year = parseInt(req.params.year)
    const month = parseInt(req.params.month)

    try {
        const pipeline = [
            { $match: { _id: new ObjectId(req.params.timesheetId) } },
            ...controller.queryPipeline,
        ]

        const data = await Timesheet.aggregate(pipeline)

        if (data.length === 0) {
            return res.status(404).json({ error: 'Timesheet not found' })
        }

        const timesheet = data[0]

        if (!await canAccessTimesheet(req, timesheet)) {
            return res.status(403).json({ error: 'Access denied' })
        }

        const monthData = timesheet.months?.find(m => m.year === year && m.month === month)

        if (!monthData) {
            return res.status(404).json({ error: 'Month not found' })
        }

        // Generate and stream PDF
        await generateTimesheetPDF(timesheet, monthData, year, month, res)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Error generating PDF' })
    }
})

module.exports = router
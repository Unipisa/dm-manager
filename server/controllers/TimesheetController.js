const Timesheet = require('../models/Timesheet')
const Controller = require('./Controller')
const { ObjectId } = require('mongoose').Types

class TimesheetController extends Controller {
    constructor() {
        super(Timesheet)
        this.path = 'timesheet'
        this.managerRoles.push('timesheet-manager')
        this.supervisorRoles.push('timesheet-manager', 'timesheet-supervisor')
        this.searchFields = ['employee.lastName', 'employee.firstName', 'fiscalCode']

        this.indexPipeline = [
            {
                $lookup: {
                    from: 'people',
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'employee',
                    pipeline: [
                        { $project: { firstName: 1, lastName: 1 } },
                        { $sort: { lastName: 1 } }
                    ]
                }
            },
            {
                $unwind: {
                    path: '$employee',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]
    }

    // Register custom routes
    register(router) {
        const routes = super.register(router)
        
        router.patch(`/${this.path}/:id/month/:year/:month/lock`,
            this.requireSomeRole(...this.managerRoles),
            (req, res) => this.toggleLockMonth(req, res, req.params.id, req.params.year, req.params.month, true)
        )
        
        router.patch(`/${this.path}/:id/month/:year/:month/unlock`,
            this.requireSomeRole(...this.managerRoles),
            (req, res) => this.toggleLockMonth(req, res, req.params.id, req.params.year, req.params.month, false)
        )
        
        router.patch(`/${this.path}/:id/month/:year/:month/upload-pdf`,
            this.requireSomeRole(...this.managerRoles),
            (req, res) => this.uploadSignedPdf(req, res, req.params.id, req.params.year, req.params.month)
        )
        
        return routes
    }

    // Helper to require roles (from middleware)
    requireSomeRole(...roles) {
        const { requireSomeRole } = require('./middleware')
        return requireSomeRole(...roles)
    }

    // Toggle lock/unlock month
    async toggleLockMonth(req, res, id, year, month, locked) {
        try {
            const timesheet = await Timesheet.findById(id)
            
            if (!timesheet) {
                return res.status(404).send({ error: 'Timesheet not found' })
            }
            
            const monthData = timesheet.months.find(m => 
                m.year === parseInt(year) && m.month === parseInt(month)
            )
            
            if (!monthData) {
                return res.status(404).send({ error: 'Month not found' })
            }
            
            monthData.locked = locked
            await timesheet.save()
            
            // Return updated timesheet using the same pipeline as get
            this.get(req, res, id)
        } catch (error) {
            console.error(error)
            res.status(400).send({ error: error.message })
        }
    }

    // Upload signed PDF for a month
    async uploadSignedPdf(req, res, id, year, month) {
        try {
            const timesheet = await Timesheet.findById(id)
            
            if (!timesheet) {
                return res.status(404).send({ error: 'Timesheet not found' })
            }
            
            const monthData = timesheet.months.find(m => 
                m.year === parseInt(year) && m.month === parseInt(month)
            )
            
            if (!monthData) {
                return res.status(404).send({ error: 'Month not found' })
            }
            
            // Get the upload ID from request body
            const uploadId = req.body.signedPdf._id
            
            if (!uploadId) {
                return res.status(400).send({ error: 'No PDF upload ID provided' })
            }
            
            // Delete old PDF if exists
            if (monthData.signedPdf) {
                const Upload = require('../models/Upload')
                await Upload.findByIdAndDelete(monthData.signedPdf)
            }
            
            // Set new PDF
            monthData.signedPdf = new ObjectId(uploadId)
            await timesheet.save()
            
            // Return updated timesheet
            this.get(req, res, id)
        } catch (error) {
            console.error(error)
            res.status(400).send({ error: error.message })
        }
    }

    // Helper to get number of days in a month
    getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate()
    }

    // Helper function to generate months with all days pre-populated
    generateMonths(startDate, endDate, grants) {
        const months = []
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        // Get all unique year-month combinations in the range
        const current = new Date(start.getFullYear(), start.getMonth(), 1)
        const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1)
        
        while (current <= lastMonth) {
            const year = current.getFullYear()
            const month = current.getMonth() + 1 // 1-12
            const daysInMonth = this.getDaysInMonth(year, month)
            
            const days = []
            
            // Generate all days for this month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month - 1, day)
                
                // Only include days within the employment period
                if (date >= start && date <= end) {
                    const dayOfWeek = date.getDay()
                    const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'weekday'
                    
                    // Pre-populate grantHours with all grants set to 0
                    const grantHours = grants.map(grantId => ({
                        grant: grantId,
                        hours: 0
                    }))
                    
                    days.push({
                        day: day,
                        date: date,
                        dayType: dayType,
                        grantHours: grantHours,
                        teachingHours: 0,
                        institutionalHours: 0,
                        otherHours: 0
                    })
                }
            }
            
            months.push({
                year: year,
                month: month,
                locked: false,
                days: days
            })
            
            // Move to next month
            current.setMonth(current.getMonth() + 1)
        }
        
        return months
    }

    async put(req, res) {
        // Generate months if startDate, endDate, and grants are provided
        if (req.body.startDate && req.body.endDate) {
            const grants = req.body.grants || []
            const months = this.generateMonths(
                new Date(req.body.startDate),
                new Date(req.body.endDate),
                grants
            )
            req.body.months = months
        }
        
        return super.put(req, res)
    }

    async patch(req, res, id) {
        const existing = await Timesheet.findById(id)
        
        if (!existing) {
            return res.status(404).send({ error: 'Timesheet not found' })
        }
        
        // Check if dates or grants changed
        const startDate = req.body.startDate ?? existing.startDate
        const endDate   = req.body.endDate   ?? existing.endDate
        const grants    = req.body.grants    ?? existing.grants

        if (startDate && endDate) {
            const oldStart = existing.startDate?.getTime()
            const oldEnd   = existing.endDate?.getTime()
            const newStart = new Date(startDate).getTime()
            const newEnd   = new Date(endDate).getTime()
            
            // Also check if grants changed
            const grantsChanged = JSON.stringify(grants) !== JSON.stringify(existing.grants)

            if (oldStart !== newStart || oldEnd !== newEnd || grantsChanged) {
                const months = this.generateMonths(
                    new Date(startDate),
                    new Date(endDate),
                    grants
                )
                req.body.months = months
            }
        }
        
        return super.patch(req, res, id)
    }
}

module.exports = TimesheetController
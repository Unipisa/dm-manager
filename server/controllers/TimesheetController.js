const Timesheet = require('../models/Timesheet')
const Controller = require('./Controller')
const { ObjectId } = require('mongoose').Types
const { isItalianHoliday } = require('./processes/italianHolidays')

class TimesheetController extends Controller {
    constructor() {
        super(Timesheet)
        this.path = 'timesheet'
        this.managerRoles.push('timesheet-manager')
        this.supervisorRoles.push('timesheet-manager', 'timesheet-supervisor')
        this.searchFields = ['employee.lastName', 'employee.firstName']

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
            },
            {
                $lookup: {
                    from: 'grants',
                    localField: 'grants',
                    foreignField: '_id',
                    as: 'grants',
                    pipeline: [
                        { $project: { name: 1 } },
                        { $sort: { name: 1 } }
                    ]
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

    // Get dayType for a given date
    getDayType(date) {
        const dayOfWeek = date.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend'
        if (isItalianHoliday(date)) return 'public-holiday'
        return 'weekday'
    }

    // Create a fresh day entry
    createDayEntry(date, grants) {
        return {
            day: date.getDate(),
            date: date,
            dayType: this.getDayType(date),
            grantHours: grants.map(grantId => ({ grant: grantId, hours: 0 })),
            roleHours: 0,
            teachingHours: 0,
            institutionalHours: 0,
            otherHours: 0,
        }
    }

    // Generate all months from scratch (used on create)
    generateMonths(startDate, endDate, grants) {
        const months = []
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        const current = new Date(start.getFullYear(), start.getMonth(), 1)
        const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1)
        
        while (current <= lastMonth) {
            const year = current.getFullYear()
            const month = current.getMonth() + 1
            const daysInMonth = this.getDaysInMonth(year, month)
            
            const days = []
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month - 1, day)
                if (date >= start && date <= end) {
                    days.push(this.createDayEntry(date, grants))
                }
            }
            
            months.push({ year, month, locked: false, days })
            current.setMonth(current.getMonth() + 1)
        }
        
        return months
    }

    // Update existing months preserving data (used on edit)
    updateMonths(existingMonths, oldStart, oldEnd, newStart, newEnd, oldGrants, newGrants) {
        // Figure out which grant IDs were added/removed
        const oldGrantIds = oldGrants.map(g => g._id)
        const newGrantIds = newGrants.map(g => g._id)
        const addedGrants = newGrantIds.filter(id => !oldGrantIds.includes(id))
        const removedGrants = oldGrantIds.filter(id => !newGrantIds.includes(id))
        const grantsChanged = addedGrants.length > 0 || removedGrants.length > 0

        // Build a map of existing months for easy lookup: "year-month" -> monthData
        const existingMap = {}
        for (const m of existingMonths) {
            existingMap[`${m.year}-${m.month}`] = m
        }

        const months = []
        const current = new Date(newStart.getFullYear(), newStart.getMonth(), 1)
        const lastMonth = new Date(newEnd.getFullYear(), newEnd.getMonth(), 1)

        while (current <= lastMonth) {
            const year = current.getFullYear()
            const month = current.getMonth() + 1
            const key = `${year}-${month}`
            const daysInMonth = this.getDaysInMonth(year, month)

            const existing = existingMap[key]

            if (existing) {
                // Month already exists - update days preserving data
                const existingDaysMap = {}
                for (const d of existing.days) {
                    existingDaysMap[d.day] = d
                }

                const days = []
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month - 1, day)
                    if (date >= newStart && date <= newEnd) {
                        if (existingDaysMap[day]) {
                            // Day exists - preserve data, update grants if needed
                            const existingDay = existingDaysMap[day]
                            
                            if (grantsChanged) {
                                // Remove deleted grants
                                existingDay.grantHours = existingDay.grantHours.filter(
                                    gh => !removedGrants.includes(gh._id)
                                )
                                // Add new grants
                                for (const grantId of addedGrants) {
                                    existingDay.grantHours.push({ grant: grantId, hours: 0 })
                                }
                            }
                            
                            days.push(existingDay)
                        } else {
                            // Day is new (date range extended) - create fresh
                            days.push(this.createDayEntry(date, newGrants))
                        }
                    }
                    // Days outside new range are simply not included (deleted)
                }

                months.push({
                    year,
                    month,
                    locked: existing.locked,
                    signedPdf: existing.signedPdf,
                    activityDescription: existing.activityDescription,
                    days,
                })
            } else {
                // Month is entirely new - create fresh
                const days = []
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month - 1, day)
                    if (date >= newStart && date <= newEnd) {
                        days.push(this.createDayEntry(date, newGrants))
                    }
                }
                months.push({ year, month, locked: false, days })
            }

            current.setMonth(current.getMonth() + 1)
        }

        return months
    }

    async put(req, res) {
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
            const oldStart = existing.startDate
            const oldEnd   = existing.endDate
            const newStart = new Date(startDate)
            const newEnd   = new Date(endDate)
            
            const datesChanged = oldStart.getTime() !== newStart.getTime() || 
                                 oldEnd.getTime() !== newEnd.getTime()
            const grantsChanged = JSON.stringify(grants) !== JSON.stringify(existing.grants)

            if (datesChanged || grantsChanged) {
                req.body.months = this.updateMonths(
                    existing.months,
                    oldStart, oldEnd,
                    newStart, newEnd,
                    existing.grants,
                    grants
                )
            }
        }
        
        return super.patch(req, res, id)
    }
}

module.exports = TimesheetController
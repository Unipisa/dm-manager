const { 
    model, 
    Schema, 
    ObjectId,
    startDate,
    endDate, 
    createdBy, 
    updatedBy,
} = require('./Model')

// Single day entry within a month
const dayEntrySchema = new Schema({
    day: { type: Number, required: true, min: 1, max: 31, label: 'Giorno' },
    date: { type: Date, required: true },
    dayType: { 
        type: String, 
        enum: ['weekday', 'weekend', 'holiday'], 
        default: 'weekday',
        label: 'Tipo giorno'
    },
    
    // Hours per grant
    grantHours: [{
        grant: { type: ObjectId, ref: 'Grant' },
        hours: { type: Number, min: 0, max: 24, default: 0 }
    }],
    
    // Fixed activity categories
    teachingHours: { type: Number, min: 0, max: 24, default: 0, label: 'Ore didattica' },
    institutionalHours: { type: Number, min: 0, max: 24, default: 0, label: 'Ore istituzionali' },
    otherHours: { type: Number, min: 0, max: 24, default: 0, label: 'Altre ore' },
}, { _id: false })

// Month with all its days and metadata
const monthSchema = new Schema({
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    locked: { type: Boolean, default: false, label: 'Bloccato' },
    signedPdf: { type: ObjectId, ref: 'Upload', label: 'PDF firmato' },
    
    // All days in this month
    days: {
        type: [dayEntrySchema],
        default: []
    }
}, { _id: false })

const timesheetSchema = new Schema({
    // Employee info
    employee: { type: ObjectId, ref: 'Person', label: 'Dipendente' },
    fiscalCode: { type: String, label: 'Codice fiscale' },
    beneficiary: { type: String, label: 'Beneficiario' },
    headOfDepartment: { type: ObjectId, ref: 'Person', label: 'Direttore' },
    
    // Employment details
    employmentType: { 
        type: String, 
        enum: ['full-time', 'part-time'], 
        default: 'full-time',
        label: 'Tipo contratto'
    },
    role: { type: String, label: 'Ruolo/Qualifica' },
    
    // Period
    startDate,
    endDate,
    
    // Grants assigned to this employee
    grants: [{type: ObjectId, label: 'grants', ref: 'Grant'}],

    // Months with daily entries and metadata
    months: {
        type: [monthSchema],
        widget: 'hidden',
    },
    
    createdBy,
    updatedBy,
}, {
    timestamps: true
})


const Timesheet = model('Timesheet', timesheetSchema)
Timesheet.relatedModels = []

module.exports = Timesheet

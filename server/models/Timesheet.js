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
        enum: ['weekday', 'weekend', 'sick-leave', 'public-holiday', 'annual-holiday', 'other-absence'], 
        default: 'weekday',
        label: 'Tipo giorno'
    },
    grantHours: [{
        grant: { type: ObjectId, ref: 'Grant' },
        hours: { type: Number, min: 0, max: 24, default: 0 }
    }],
    // Fixed activity categories
    roleHours: { 
        type: Number, 
        min: 0, 
        max: 24, 
        default: 0, 
        label: 'Ore dedicate alla ricerca o attività amministrativa',
        help: 'per il personale dedicato alla ricerca (professori e ricercatori) identifica l\'attività di ricerca, per il personale tecnico amministrativo identifica l\'attività amministrativa ordinaria'
    },
    teachingHours: { 
        type: Number, 
        min: 0, 
        max: 24, 
        default: 0, 
        label: 'Ore didattica', 
        help: 'Ore di didattica (frontale e non)' 
    },
    institutionalHours: { 
        type: Number, 
        min: 0, 
        max: 24, 
        default: 0, 
        label: 'Ore istituzionali',
        help: 'Consigli di Dipartimento, di corso di studio, consigli di dottorato, ecc.'
    },
    otherHours: { 
        type: Number, 
        min: 0, 
        max: 24, 
        default: 0, 
        label: 'Altre ore',
        help: 'Tutte le attività che non rientrano nelle voci precedenti' 
    },
}, { _id: false })

// Month with all its days and metadata
const monthSchema = new Schema({
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    locked: { type: Boolean, default: false, label: 'Bloccato' },
    signedPdf: { type: ObjectId, ref: 'Upload', label: 'PDF firmato' },
    activityDescription: { 
        type: String, 
        label: 'Descrizione attività del mese', 
        widget: 'text',
        default: ''
    },
    days: {
        type: [dayEntrySchema],
        default: []
    }
}, { _id: false })

const timesheetSchema = new Schema({
    employee: { 
        type: ObjectId, 
        ref: 'Person', 
        label: 'Dipendente', 
        required: true, 
        help: 'il soggetto che lavora al progetto' 
    },
    fiscalCode: { 
        type: String, 
        label: 'Codice fiscale', 
        help: 'il codice fiscale del soggetto che lavora al progetto' 
    },
    beneficiary: { 
        type: String, 
        label: 'Beneficiario', 
        help: 'es. UNIPI - Dipartimento di Matematica' 
    },
    headOfDepartment: { 
        type: ObjectId, 
        ref: 'Person', 
        label: 'Direttore',
        help: 'il Direttore del Dipartimento/Centro di afferenza del dipendente'
    },    
    employmentType: { 
        type: String, 
        enum: ['full-time', 'part-time'], 
        default: 'full-time',
        label: 'Contratto'
    },
    role: {
        type: String,
        enum: ['research', 'administrative'],
        label: 'Ruolo',
        default: 'research',
        help: 'Selezionare "research" per personale dedicato alla ricerca (usa "Institutional research") o "administrative" per personale tecnico amministrativo (usa "Administrative activities")'
    },
    startDate,
    endDate,
    grants: [{
        type: ObjectId, 
        label: 'grants', 
        ref: 'Grant',
        help: 'i progetti/grant afferenti al dipendente'
    }],
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

// Ensure one timesheet per employee
timesheetSchema.index({ employee: 1 }, { unique: true })

const Timesheet = model('Timesheet', timesheetSchema)
Timesheet.relatedModels = []

module.exports = Timesheet

const mongoose = require('mongoose-schema-jsonschema')()
const config = require('mongoose-schema-jsonschema/config')

const fieldOptionsMapping = {
    label: 'label',
    widget: 'widget',
}
  
config({ fieldOptionsMapping })

const { Schema } = mongoose

const { ObjectId } = Schema.Types

// common fields...
const SSD = {
    type: String,
    label: 'SSD',
    enum: ["MAT/01", "MAT/02", "MAT/03", "MAT/04", "MAT/05", "MAT/06", "MAT/07", "MAT/08", "MAT/09",""],
    default: "",
}

const multipleSSDs = {
    type: [String],
    label: 'SSD',
    enum: ["MAT/01", "MAT/02", "MAT/03", "MAT/04", "MAT/05", "MAT/06", "MAT/07", "MAT/08", "MAT/09"], 
    default: [],
}

const notes = {type: String, label: 'note', widget: 'text'}
const createdBy = { type: ObjectId, ref: 'User' }
const updatedBy = { type: ObjectId, ref: 'User' }
const startDate = {type: Date, label: 'data inizio'}
const endDate = {type: Date, label: 'data fine'}

const model = mongoose.model

module.exports = { 
    mongoose, 
    model, 
    Schema, 
    ObjectId, 
    notes, 
    startDate, 
    endDate, 
    createdBy, 
    updatedBy, 
    SSD, 
    multipleSSDs,
    notes,
 }
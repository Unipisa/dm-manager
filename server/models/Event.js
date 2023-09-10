const { 
    model, 
    Schema, 
    ObjectId, 
    startDate, 
    endDate,
    SSD, 
    createdBy, 
    updatedBy,
} = require('./Model')

const eventSchema = new Schema({
    title:  {type: String, label: 'titolo'},
    startDate,
    endDate,
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Event = model('Event', eventSchema)
module.exports = Event

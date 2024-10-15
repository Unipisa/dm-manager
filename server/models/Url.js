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

const urlSchema = new Schema({
    url: { type: String, label: 'url', required: true }, // web.dm.unipi.it/walker
    ref: { type: String, label: 'ref', required: true }, // a0123456@login:public_html
    disabled: { type: Boolean, label: 'disabled', default: false },
    notes: {type: String, label: 'note', widget: 'text', default: ""},
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Url = model('Url', urlSchema)
module.exports = Url


const { 
    model, 
    Schema, 
    createdBy, 
    updatedBy,
} = require('./Model')

const urlSchema = new Schema({
    alias: { type: String, label: 'alias', required: true },
    destination: { type: String, label: 'destination', required: true, default: "public_html"},
    index: { type: Boolean, label: 'indicizza', required: true, default: false}, 
    owner: { type: String, label: 'owner', required: true},
    notes: {type: String, label: 'note', widget: 'text', default: ""},
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Url = model('Url', urlSchema)
module.exports = Url


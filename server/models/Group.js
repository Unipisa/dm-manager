const {
    Schema, 
    model, 
    ObjectId,
    startDate, 
    endDate,
    createdBy, 
    updatedBy, 
    notes
} = require('./Model')

const schema = new Schema({
    name: {type: String, label: 'nome'},
    startDate,
    endDate,
    members: [{ type: ObjectId, label: 'membri', ref: 'Person' }],
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Group = model('Group', schema)
Group.relatedModels = []

module.exports = Group

const Person = require('./Person')

Person.relatedModels.push({
    model: Group,
    modelName: 'Group',
    url: 'group',
    field: 'members',
})


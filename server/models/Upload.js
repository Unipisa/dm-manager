const {
    Schema, 
    model, 
    ObjectId,
    createdBy, 
    updatedBy, 
} = require('./Model')

const schema = new Schema({
    filename: String,
    mimetype: String,
    private: { type: Boolean, default: false },
    createdBy,
    updatedBy,
}, {
    timestamps: true // adds fields: createdAt, updatedAt
})

const Upload = model('Upload', schema)
Upload.relatedModels = []

module.exports = Upload

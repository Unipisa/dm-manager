const { 
    model, 
    Schema, 
    ObjectId, 
    createdBy, 
    updatedBy,
    notes,
} = require('./Model')

// Recap, cicli di seminari standard:
// 
// - "algebra-seminar"
// - "algebraic-and-arithmetic-geometry-seminar"
// - "analysis-seminar"
// - "baby-geometri-geometry-and-topology-seminar"
// - "dynamical-systems-seminar"
// - "geometry-seminar"
// - "logic-seminar"
// - "probability-stochastic-analysis-and-statistics-seminar"
// - "seminar-on-combinatorics-lie-theory-and-topology"
// - "seminar-on-numerical-analysis"
// - "seminari-map"

const seminarCategorySchema = new Schema({
    name: { type: String, label: 'Nome', required: true },
    // 09/04/2025: hiding as not used anymore, CDP
    //label: { type: String, label: 'Label (Wordpress)', required: true },
    //old_id: { type: Number, label: 'ID (vecchio sito)', required: false },
    notes,

    createdBy,
    updatedBy,
}, { 
    timestamps: true
})

const SeminarCategory = model('SeminarCategory', seminarCategorySchema)
SeminarCategory.relatedModels = []

module.exports = SeminarCategory

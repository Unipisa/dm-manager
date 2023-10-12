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
// 
// TODO: Magari si può aggiungere una regola nelle migrazioni per creare
// automaticamente tutte le categorie di base.

const seminarCategorySchema = new Schema({
    name: { type: String, label: 'Nome', required: true },
    label: { type: String, label: 'Label (Wordpress)', required: true },
    notes,

    createdBy,
    updatedBy,
}, { 
    timestamps: true
})

const SeminarCategory = model('SeminarCategory', seminarCategorySchema)

module.exports = SeminarCategory

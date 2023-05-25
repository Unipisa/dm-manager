const mongoose = require('mongoose-schema-jsonschema')()
const config = require('mongoose-schema-jsonschema/config')

const fieldOptionsMapping = {
    label: 'label',
    widget: 'widget',
    hidden: 'hidden',
    can_sort: 'can_sort',
    can_filter: 'can_filter',
    can_edit_in_profile: 'can_edit_in_profile',
    match_ids: 'match_ids',
    help: 'help',
    href: 'href',
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
    can_filter: true,
}

const notes = {type: String, label: 'note', widget: 'text', default: ''}
const createdBy = { type: ObjectId, ref: 'User' }
const updatedBy = { type: ObjectId, ref: 'User' }
const date = {type: Date, label: 'data', default: null}
const startDate = {...date, label: 'data inizio'}
const endDate = {...date, label: 'data fine',
    validate: {
        validator: function(v) {
            return v===null || this.startDate===null || v >= this.startDate
        },
        message: props => `endDate must be greater than startDate`
    }
}

const model = function(name, schema) {
    const M = mongoose.model(name, schema)
    const obj = schema.obj
    const info = M.jsonSchema()
    M._schema_info = info
    M._profile_editable_fields = Object.entries(info.properties)
        .filter(([field, field_info]) => field_info?.can_edit_in_profile)
        .map(([field, field_info]) => field)

    function set_if_undefined(obj, update) {
        for (const prop in update) {
            if (obj[prop] === undefined) obj[prop] = update[prop]
        }
    }

    set_if_undefined(info.properties._id, {
        can_sort: true,
        can_filter: true,
        match_ids: true,
    })

    Object.entries(obj)
        .forEach(([field, field_info]) => {
            if (field === 'updatedBy') return
            if (field === 'createdBy') return
            const out = field_from_model_info(field_info)
            if (out) {
                set_if_undefined(info.properties[field], out)
            }
        })

    // console.log(`### ${JSON.stringify(info, null, 2)}`)

    if (schema.options.timestamps) {
        set_if_undefined(info.properties.updatedAt, { can_sort: true })
        set_if_undefined(info.properties.createdAt, { can_sort: true })
    }

    return M
}

/***
 * Try to construct the fields information structure
 * needed by controller to build the queries
 * by inspecting the Model.
 * The derived class will have the ability 
 * to ignore or override these settings
 ***/
function field_from_model_info(info) {
    if (Array.isArray(info)) {
        if (info.length !== 1) return
        info = info[0]
        if (info.ref) {
            // elenco di ObjectId di documenti collegati
            return {
                can_filter: true,
                related_field: true,
                related_many: true,
            }
        }
        return
    }
    if (typeof info !== 'object') {
        return
    }
    if (info.ref === 'Person') {
        return {
            can_sort: ['lastName', 'firstName'],
            can_filter: true,
            related_field: true,
        }
    } else if (info.ref === 'Room') {
        return {
            can_sort: ['building', 'floor', 'number'],
            can_filter: true,
            related_field: true,
        }
    } else if (info.ref === 'Institution') {
        return {
            can_sort: ['name'],
            can_filter: true,
            related_field: true,
        }
    } else {
        switch(info.type) {
            case Number: // fall through
            case String: return {
                    can_sort: true,
                    can_filter: true,
                }
            case Date: return {
                    can_sort: true,
                    can_filter: true,
                    match_date: true,
                }
            case Boolean: return {
                can_sort: true,
                can_filter: true,
                match_boolean: true,
            }
        }
    }
}

module.exports = { 
    mongoose, 
    model, 
    Schema, 
    ObjectId, 
    notes, 
    date,
    startDate, 
    endDate, 
    createdBy, 
    updatedBy, 
    SSD, 
    multipleSSDs,
    notes,
 }
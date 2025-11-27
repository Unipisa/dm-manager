import Model from './Model'

export default class Upload extends Model {
    describe(obj) { return `${obj.filename}` }
    viewUrl(id) {return `/api/v0/upload/${id}`}
}
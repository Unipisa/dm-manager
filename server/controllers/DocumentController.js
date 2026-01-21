const Document = require('../models/Document')
const Controller = require('./Controller')
const Upload = require('../models/Upload')
const config = require('../config')
const Group = require('../models/Group')
const { startDate } = require('../models/Model')
const { requireUser } = require('./middleware')
const { ObjectId } = require('mongoose').Types

class DocumentController extends Controller {
    constructor() {
        super(Document)
        this.path = 'document'
        this.managerRoles.push('document-manager')
        this.supervisorRoles.push('document-manager', 'document-supervisor')
        this.searchFields = [ 'name', 'access_codes' ]
    }

    register(router) {
        super.register(router)
        router.get("/document/:id/download", 
            requireUser,
            (req, res) => this.download(req, res, req.params.id))
        router.get("/document/:id/details", requireUser, 
            (req, res) => this.getDocument(req, res, req.params.id)
        )
        return []
    }

    async checkPermission(req, document) {
        const access_codes = document.access_codes || []

        // If "pubblico" is in access_codes, allow access to anyone
        if (access_codes.includes('pubblico')) {
            return true
        }

        // Allow admin access, and owner access
        if (req.roles?.includes('admin') || (document.owners || []).some(ownerId => ownerId._id.equals(req.user._id))) {
            return true
        }

        // If "utente-con-credenziali-manage" is in access_codes, allow access to logged-in users with person
        if (access_codes.includes('utente-con-credenziali-manage')) {
            return req.user?.person ? true : false
        }

        // If no access_codes are selected (and not pubblico/utente-con-credenziali-manage), refuse access
        if (access_codes.length === 0) {
            return false
        }

        // For any other access codes, user must have a person associated
        if (!req.user?.person) {
            return false
        }

        // Check if user is member of any of the specified groups
        const today = new Date()

        const valid_groups = await Group.aggregate([
            {
                $match: {
                    code: { $in: access_codes },
                    members: req.user.person._id,
                    $or: [
                        // We check if the user was member of the group 
                        // at the document's date
                        { $and: [
                            { $or: [
                                { startDate: null },
                                { startDate: { $lte: document.date } }
                            ]},
                            { $or: [
                                { endDate: null },
                                { endDate: { $gte: document.date } }
                            ]}
                        ]},
                        // Also check if the user is currently member of the group
                        { $and: [
                            { $or: [
                                { startDate: null },
                                { startDate: { $lte: today } }
                            ]},
                            { $or: [
                                { endDate: null },
                                { endDate: { $gte: today } }
                            ]}
                        ]}
                    ]                    
                }
            }
        ])

        return valid_groups.length > 0
    }

    async getDocument(req, res, id) {
        const documents = await Document.aggregate([
            { $match: { _id: new ObjectId(id) } },
            ...this.queryPipeline,
        ])

        if (documents.length === 0) {
            res.status(404)
            res.send({ error: "Document not found" })
            return
        }

        const document = documents[0]

        const allowed = await this.checkPermission(req, document)
        
        res.send({ 
            document, 
            allowed 
        })
    }

    async download(req, res, id) {
        const document = await Document.findById(id)

        if (! document) {
            res.status(404)
            res.send({ error: "Document not found" })
            return
        }

        if (! await this.checkPermission(req, document)) {
            res.status(403)
            res.send({ error: "You don't have permission to access this document" })
            return
        }

        if (! document.attachment) {
            res.status(404)
            res.send({ error: "Document has no attachment" })
            return
        }

        // Find the upload with the given ID
        const upload = await Upload.findById(document.attachment)

        if (! upload) {
            res.status(404)
            res.send({ error: "Attachment not found" })
            return
        }

        res.sendFile(upload._id.toString(), {
            root: config.UPLOAD_DIRECTORY + "/private/", 
            headers: {
                'Content-Type': upload.mimetype, 
                'Content-Disposition': `attachment; filename="${upload.filename}"`
            }
        })

        return
    }
}

module.exports = DocumentController
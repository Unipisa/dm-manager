const Document = require('../models/Document')
const Controller = require('./Controller')
const Upload = require('../models/Upload')
const config = require('../config')
const Group = require('../models/Group')
const { startDate } = require('../models/Model')
const { requireUser } = require('./middleware')

class DocumentController extends Controller {
    constructor() {
        super(Document)
        this.path = 'document'
        this.managerRoles.push('document-manager')
        this.supervisorRoles.push('document-manager', 'document-supervisor')
        this.searchFields = [ 'name' ]
    }

    register(router) {
        super.register(router)
        router.get("/document/:id/download", 
            requireUser,
            (req, res) => this.download(req, res, req.params.id))
        router.get("/document/:id", requireUser, 
            (req, res) => this.getDocument(req, res, req.params.id)
        )
        return []
    }

    async checkPermission(req, document) {
        if (! req.user.person) {
            return false
        }

        const valid_groups = await Group.aggregate([
            {
                $match: {
                    code: { $in: document.group_codes },
                    members: req.user.person._id,
                    $and: [
                        { $or: [
                            { startDate: null },
                            { startDate: { $lte: document.date } }
                        ]},
                        { $or: [
                            { endDate: null },
                            { endDate: { $gte: document.date } }
                        ]}
                    ]
                }
            }
        ]);

        if (valid_groups.length === 0) {            
            return false
        }

        return true
    }

    async getDocument(req, res, id) {
        const document = await Document.findById(id)

        if (! document) {
            res.status(404)
            res.send({ error: "Document not found" })
            return
        }

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
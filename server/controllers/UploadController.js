const config = require('../config')
const Upload = require('../models/Upload')
const fs = require('fs/promises');
const Document = require('../models/Document')
const DocumentController = require('./DocumentController');
const { createdBy } = require('../models/Model');

const valid_mimetypes = [
    'text/plain', 
    'image/png',
    'image/jpeg',
    'application/pdf'
]

class UploadController {

    register(router) {
        router.get('/upload', (req, res) => res.send({ config })),
        router.get('/upload/:id', (req, res) => this.getPhoto(req, res, req.params.id))
        router.post('/upload', (req, res) => this.postPhoto(req, res))
        return []
    }

    async getPhoto(req, res, id) {
        const upload = await Upload.findById(id)
        console.log(upload)
        
        if (! upload) {
            res.status(404)
            res.send({ error: "File not found" })
            return
        }

        // We need to check for permissions before serving private files.
        if (upload.private) {
            let allowed = false
            if (req.user._id.equals(upload.createdBy)) {
                allowed = true
            }

            if (! allowed) {
                const documentcontroller = new DocumentController()
                // Try to find a document that references this upload
                const documents = await Document.find({ attachments: upload._id })
                for (let doc of documents) {
                    if (await documentcontroller.checkPermission(req, doc)) {
                        allowed = true
                        break
                    }
                }
            }
            
            if (! allowed ) {
                res.status(403)
                res.send({ error: "You don't have permission to access this file" })
                return
            }
        }
        
        res.sendFile(id, {
            root: config.UPLOAD_DIRECTORY, 
            headers: {
                'Content-Type': upload.mimetype, 
                'Content-Disposition': `attachment; filename="${upload.filename}"`
            }
        })
    }

    async postPhoto(req, res) {
        const data = req.body

        if (! data.data) {
            res.status(400)
            res.send({ error: "Failed to upload the file, content missing" })
            return
        }
        else {            
            const filedata = new Buffer.from(data.data, 'base64')

            if (!valid_mimetypes.includes(data.mimetype)) {
                res.status(400)
                res.send({ error: "Invalid mimetype: " + data.mimetype})
                return
            }

            if (!data.filename) {
                res.status(400)
                res.send({ error: "Invalid or missing filename" })
                return
            }

            const upload = await Upload.create({
                filename: data.filename, 
                mimetype: data.mimetype,
                private: data.private || false,
                createdBy: req.user._id,
                updatedBy: req.user._id,
            })

            try {
                await fs.writeFile(config.UPLOAD_DIRECTORY + "/" + upload._id, filedata)
            } catch (err) {
                console.log(err)
                await upload.remove()
                res.status(400)
                res.send({ error: "Failed writing the file to disk"})
                return
            }

            const url = `${config.BASE_URL}${config.API_PATH}/upload/${upload._id}`;

            res.send({ 
                upload, 
                url
            })
        }
    }

}

module.exports = UploadController;
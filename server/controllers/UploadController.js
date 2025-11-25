const config = require('../config')
const Upload = require('../models/Upload')
const fs = require('fs/promises');

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
        
        if (! upload) {
            res.status(404)
            res.send({ error: "File not found" })
            return
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
            })

            try {
                const subfolder = upload.private ? "/private/" : "/";
                await fs.writeFile(config.UPLOAD_DIRECTORY + subfolder + upload._id, filedata)
            } catch (err) {
                console.log(err)
                await upload.remove()
                res.status(400)
                res.send({ error: "Failed writing the file to disk"})
                return
            }

            const url = upload.private ? 
                `${upload._id}` : `${config.BASE_URL}${config.API_PATH}/upload/${upload._id}`;

            res.send({ 
                upload, 
                url
            })
        }
    }

}

module.exports = UploadController;
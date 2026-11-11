const express = require('express')
const path = require('path')

const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) return res.status(401).send({ error: 'not logged in' })
    if (!req.user.roles?.includes('admin')) {
        return res.status(403).send({ error: 'admin role required' })
    }
    res.set('Cache-Control', 'private, no-store')
    next()
})

// Deployment packages a copy outside public/ so every asset stays admin-only.
router.use(express.static(path.resolve(__dirname, '../widgets-gallery'), { cacheControl: false }))
// Local development uses the existing widgets build directly.
router.use(express.static(path.resolve(__dirname, '../../widgets/public'), { cacheControl: false }))
router.use((req, res) => {
    res.status(404).send({ error: 'Gallery file not found. Build the gallery with npm --prefix widgets run build.' })
})

module.exports = router

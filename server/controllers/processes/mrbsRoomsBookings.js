const express = require('express')
const router = express.Router()
const axios = require('axios')
const config = require('../../config')

router.post('/', async (req, res) => {
    try {
        const { action, ...params } = req.body

        const baseUrl = config.MRBS_API_URL
        const token = config.MRBS_API_TOKEN
        const headers = {
            'Authorization': `Bearer ${token}`
        }

        let response

        switch (action) {

            case 'query':
                response = await axios.post(
                    `${baseUrl}/api.php?q=query&start_time=${params.start_time}&end_time=${params.end_time}`,
                    null,
                    { headers }
                )
                console.log('[QUERY] Response:', response.data)
            break
            
            case 'book':
                response = await axios.post(
                    `${baseUrl}/api.php?q=book`,
                    {
                        name: params.name,
                        room_id: params.room_id,
                        start_time: params.start_time,
                        end_time: params.end_time,
                        repeat_rule: 'none'
                    },
                    { 
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json'
                        }
                    }
                )
                console.log('[BOOK] Response:', response.data)
            break

            case 'details':
                response = await axios.get(
                    `${baseUrl}/api.php?q=details&id=${params.id}`,
                    null,
                    { headers }
                )
                break

            case 'delete':
                response = await axios.delete(
                    `${baseUrl}/api.php?q=delete&id=${params.id}`,
                    { headers }
                )
                break

            default:
                return res.status(400).json({ error: 'Invalid action' })
        }

        res.json(response.data)
    } catch (error) {
        console.error('MRBS API Error:', error)
        if (error.response?.status === 404) {
            res.status(404).json({ error: 'Resource not found' })
        } else {
            res.status(500).json({ error: error.message })
        }
    }
})

module.exports = router
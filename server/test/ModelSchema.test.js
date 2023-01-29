const { ModelSchemas } = require('../api')

describe('grant_SSD_can_filter', () => {
    it('can_filter', async () => {
        expect(ModelSchemas.Grant.fields.SSD.can_filter).toBe(true)
    })
})

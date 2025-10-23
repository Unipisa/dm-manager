const { ModelSchemas } = require('../api')

describe('grant_SSD_can_filter', () => {
    it('can_filter', async () => {
        expect(ModelSchemas.Grant.fields.SSD.can_filter).toBe(true)
    })
})

describe('staff_SSD_is_array', () => {
    it('is array type', async () => {
        expect(ModelSchemas.Staff.fields.SSD.type).toBe('array')
    })
    
    it('can_filter', async () => {
        expect(ModelSchemas.Staff.fields.SSD.can_filter).toBe(true)
    })
})

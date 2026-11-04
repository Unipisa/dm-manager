// Keep this mapping self-contained: historical migrations must not depend on models.
const codes = {
    'MAT/01': 'MATH-01/A',
    'MAT/02': 'MATH-02/A',
    'MAT/03': 'MATH-02/B',
    'MAT/04': 'MATH-01/B',
    'MAT/05': 'MATH-03/A',
    'MAT/06': 'MATH-03/B',
    'MAT/07': 'MATH-04/A',
    'MAT/08': 'MATH-05/A',
    'MAT/09': 'MATH-06/A',
}

module.exports = async function migrateSSDs(db) {
    const convert = value => ({
        $switch: {
            branches: Object.entries(codes).map(([oldCode, newCode]) => ({
                case: { $eq: [value, oldCode] },
                then: newCode,
            })),
            default: value,
        },
    })

    for (const name of ['staffs', 'grants', 'eventconferences', 'visits', 'theses']) {
        await db.collection(name).updateMany(
            { SSD: { $in: Object.keys(codes) } },
            [{ $set: { SSD: {
                $cond: {
                    if: { $isArray: '$SSD' },
                    then: { $map: { input: '$SSD', as: 'code', in: convert('$$code') } },
                    else: convert('$SSD'),
                },
            } } }]
        )
    }

    return true
}

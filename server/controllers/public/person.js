const Person = require("../../models/Person")
const ObjectId = require('mongoose').Types.ObjectId
const fetch = require('node-fetch')
const config = require('../../config');

/** @param {import('@types/express').Request} req */
async function personQuery(req, res) {
    let _id;
    try {
        _id = new ObjectId(req.params.id);
    } catch {
        return res.status(404).json({ error: 'person not found' });
    }

    const matchActive = [
        { $or: [ { $eq: ["$endDate", null] }, { $gte: ["$endDate", "$$NOW"] } ] },
        { $or: [ { $eq: ["$startDate", null] }, { $lte: ["$startDate", "$$NOW"] } ] }
    ];

    const lookupPipeline = (from, localField, foreignField, as, additionalPipeline = []) => ({
        $lookup: {
            from,
            localField,
            foreignField,
            as,
            pipeline: additionalPipeline
        }
    });

    const projectFields = (fields) => ({ $project: fields });

    const personPipeline  = [
        { $match: { _id } },        
        lookupPipeline('institutions', 'affiliations', '_id', 'affiliations'),
        lookupPipeline('staffs', '_id', 'person', 'staffs', [
            { $match: { $expr: { $and: matchActive } } }
        ]),
        lookupPipeline('roomassignments', '_id', 'person', 'roomAssignments', [
            { $match: { $expr: { $and: matchActive } } },
            lookupPipeline('rooms', 'room', '_id', 'roomDetails'),
            { $unwind: { path: "$roomDetails", preserveNullAndEmptyArrays: true } },
            projectFields({
                room: 1,
                startDate: 1,
                endDate: 1,
                roomDetails: { building: 1, floor: 1, number: 1, code: 1 }
            })
        ]),
        {
            $lookup: {
                from: 'groups',
                as: 'groups',
                let: { person_id: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [
                        { $or: [
                            { $eq: ["$$person_id", "$chair"] },
                            { $eq: ["$$person_id", "$vice"] },
                            { $in: ["$$person_id", "$members"] }
                        ] },
                        ...matchActive
                    ] } } },
                    { $addFields: { memberCount: { $size: "$members" } } },
                    projectFields({ memberCount: 1, name: 1, chair: 1, chair_title: 1, vice: 1, vice_title: 1 })
                ]
            }
        },
        {
            $lookup: {
                from: 'grants',
                as: 'grants',
                let: { person_id: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [
                        { $or: [
                            { $eq: ["$$person_id", "$pi"] },
                            { $eq: ["$$person_id", "$localCoordinator"] },
                            { $in: ["$$person_id", "$members"] }
                        ] },
                        ...matchActive
                    ] } } },
                    lookupPipeline('people', 'pi', '_id', 'piDetails'),
                    { $unwind: { path: "$piDetails", preserveNullAndEmptyArrays: true } },
                    projectFields({ name: 1, projectType: 1, pi: 1, startDate: 1, endDate: 1, piDetails: { firstName: 1, lastName: 1 } })
                ]
            }
        },
        projectFields({
            firstName: 1, lastName: 1, affiliations: { _id: 1, name: 1 }, gender: 1, email: 1, phone: 1, personalPage: 1, 
            google_scholar: 1, orcid: 1, mathscinet: 1, arxiv_orcid: 1, photoUrl: 1, about_it: 1, about_en: 1,
            staffs: { qualification: 1, SSD: 1, matricola: 1, isInternal: 1 },
            roomAssignments: { room: 1, startDate: 1, endDate: 1, roomDetails: { building: 1, floor: 1, number: 1, code: 1 } },
            groups: { name: 1, chair: 1, chair_title: 1, vice: 1, vice_title: 1, memberCount: 1 },
            grants: { name: 1, projectType: 1, pi: 1, startDate: 1, endDate: 1, piDetails: { firstName: 1, lastName: 1 } }
        })
    ];

    const basicPersonData = await Person.aggregate(personPipeline);

    if (basicPersonData.length === 0) {
        return res.status(404).json({ error: 'Person not found' });
    }

    const personData = basicPersonData[0];

    const staff = personData.staffs.find(staff => staff.matricola);
    const id = staff ? staff.matricola.substring(1) : null;

    if (!id) {
        return res.json({ data: personData });
    }

    let anno = new Date().getFullYear();
    if (new Date().getMonth() < 10) {
        anno = anno - 1;
    }

    const fetchFromAPI = async (url, token, key, processFn = (data) => data) => {
        try {
            const apiResponse = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (apiResponse.ok) {
                const data = await apiResponse.json();
                return processFn(data[key]);
            } else {
                return [];
            }
        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error);
            return [];
        }
    };
    
    const fetchPromises = [
        fetchFromAPI(
            `${config.UNIPI_API_URL}registri/1.0/elenco/${id}?anno=${anno}`,
            config.UNIPI_TOKEN,
            'results',
            (results) => results?.registro ?? []
        ),
        fetchFromAPI(
            `${config.UNIPI_API_URL}uniarpi/1.0/linkRicerca/${id}`,
            config.UNIPI_TOKENARPILINK,
            'linkToArpi',
            (link) => link ?? null
        ),
        fetchFromAPI(
            `${config.UNIPI_API_URL}arpicineca/1.0/getElencoPeriodo/${id}/${new Date().getFullYear()}`,
            config.UNIPI_TOKENARPI,
            'entries',
            (entries) => entries?.entry ?? []
        )
    ];

    try {
        const [registri, arpiLink, arpiPublications] = await Promise.all(fetchPromises);

        personData.registri = registri;
        personData.arpiLink = arpiLink;
        personData.arpiPublications = arpiPublications;
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    res.json({ data: personData });
}

module.exports = personQuery
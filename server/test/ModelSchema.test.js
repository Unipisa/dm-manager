const { ModelSchemas } = require('../api')

describe('grant_SSD_can_filter', () => {
    it('can_filter', async () => {
        expect(ModelSchemas.Grant.fields.SSD.can_filter).toBe(true)
    })
})

describe('ModelSchema', () => {
    it('static check', async () => {
        expect(JSON.stringify(ModelSchemas, null, 2)).toEqual(JSON.stringify(expected, null, 2))
    })
})

const expected = {
    "RoomLabel": {
      "fields": {
        "names": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "number": {
          "type": "string"
        },
        "size": {
          "type": "number"
        },
        "state": {
          "type": "string",
          "enum": [
            "submitted",
            "managed"
          ],
          "default": "submitted",
          "can_sort": true,
          "can_filter": true
        },
        "createdBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "updatedBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "_id": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": true,
          "can_filter": true,
          "match_ids": true
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "__v": {
          "type": "number"
        }
      },
      "related": [],
      "modelName": "RoomLabel",
      "path": "roomLabel",
      "managerRoles": [
        "admin",
        "label-manager"
      ],
      "supervisorRoles": [
        "admin",
        "supervisor",
        "@any-logged-user"
      ]
    },
    "Room": {
      "fields": {
        "number": {
          "type": "string",
          "label": "numero",
          "can_sort": true,
          "can_filter": true
        },
        "floor": {
          "type": "string",
          "enum": [
            "0",
            "1",
            "2"
          ],
          "label": "piano",
          "can_sort": true,
          "can_filter": true
        },
        "building": {
          "type": "string",
          "enum": [
            "A",
            "B",
            "X"
          ],
          "label": "edificio",
          "can_sort": true,
          "can_filter": true
        },
        "nSeats": {
          "type": "number",
          "default": 0,
          "label": "numero posti"
        },
        "notes": {
          "type": "string",
          "label": "note",
          "widget": "text",
          "can_sort": true,
          "can_filter": true
        },
        "createdBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "updatedBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "_id": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": true,
          "can_filter": true,
          "match_ids": true
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "__v": {
          "type": "number"
        }
      },
      "related": [
        {
          "multiple": false,
          "modelName": "RoomAssignment",
          "url": "roomAssignment",
          "field": "room"
        }
      ],
      "modelName": "Room",
      "path": "room",
      "managerRoles": [
        "admin",
        "room-manager"
      ],
      "supervisorRoles": [
        "admin",
        "supervisor",
        "room-manager",
        "room-supervisor",
      ]
    },
    "RoomAssignment": {
      "fields": {
        "person": {
          "type": "string",
          "x-ref": "Person",
          "description": "Refers to Person",
          "label": "persona",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": [
            "lastName",
            "firstName"
          ],
          "can_filter": true,
          "related_field": true
        },
        "room": {
          "type": "string",
          "x-ref": "Room",
          "description": "Refers to Room",
          "label": "stanza",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": [
            "building",
            "floor",
            "number"
          ],
          "can_filter": true,
          "related_field": true
        },
        "startDate": {
          "type": "string",
          "label": "data inizio",
          "format": "date-time",
          "can_sort": true,
          "can_filter": true,
          "match_date": true
        },
        "endDate": {
          "type": "string",
          "label": "data fine",
          "format": "date-time",
          "can_sort": true,
          "can_filter": true,
          "match_date": true
        },
        "notes": {
          "type": "string",
          "label": "note",
          "widget": "text",
          "can_sort": true,
          "can_filter": true
        },
        "createdBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "updatedBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "_id": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": true,
          "can_filter": true,
          "match_ids": true
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "__v": {
          "type": "number"
        }
      },
      "related": [],
      "modelName": "RoomAssignment",
      "path": "roomAssignment",
      "managerRoles": [
        "admin",
        "assignment-manager"
      ],
      "supervisorRoles": [
        "admin",
        "supervisor",
        "assignment-manager",
        "assignment-supervisor"
      ]
    },
    "Visit": {
      "fields": {
        "person": {
          "type": "string",
          "x-ref": "Person",
          "description": "Refers to Person",
          "label": "visitatore",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": [
            "lastName",
            "firstName"
          ],
          "can_filter": true,
          "related_field": true
        },
        "affiliation": {
          "type": "string",
          "label": "affiliazione",
          "can_sort": true,
          "can_filter": true
        },
        "startDate": {
          "type": "string",
          "label": "data inizio",
          "format": "date-time",
          "can_sort": true,
          "can_filter": true,
          "match_date": true
        },
        "endDate": {
          "type": "string",
          "label": "data fine",
          "format": "date-time",
          "can_sort": true,
          "can_filter": true,
          "match_date": true
        },
        "referencePeople": {
          "type": "array",
          "items": {
            "type": "string",
            "x-ref": "Person",
            "description": "Refers to Person",
            "label": "referenti",
            "pattern": "^[0-9a-fA-F]{24}$"
          },
          "can_filter": true,
          "related_field": true,
          "related_many": true
        },
        "grants": {
          "type": "array",
          "items": {
            "type": "string",
            "x-ref": "Grant",
            "description": "Refers to Grant",
            "label": "grants",
            "pattern": "^[0-9a-fA-F]{24}$"
          }
        },
        "SSD": {
          "type": "string",
          "enum": [
            "MAT/01",
            "MAT/02",
            "MAT/03",
            "MAT/04",
            "MAT/05",
            "MAT/06",
            "MAT/07",
            "MAT/08",
            "MAT/09",
            ""
          ],
          "default": "",
          "label": "SSD",
          "can_sort": true,
          "can_filter": true
        },
        "publish": {
          "type": "boolean",
          "default": true,
          "label": "pubblica sul web",
          "can_sort": true,
          "can_filter": true,
          "match_boolean": true
        },
        "notes": {
          "type": "string",
          "label": "note",
          "widget": "text",
          "can_sort": true,
          "can_filter": true
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "enum": [
            "INdAM Visiting Fellow",
            "UniPi Visiting Fellow"
          ],
          "default": [],
          "label": "tags"
        },
        "createdBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "updatedBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "_id": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": true,
          "can_filter": true,
          "match_ids": true
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "__v": {
          "type": "number"
        }
      },
      "related": [],
      "modelName": "Visit",
      "path": "visit",
      "managerRoles": [
        "admin",
        "visit-manager"
      ],
      "supervisorRoles": [
        "admin",
        "supervisor",
        "visit-manager",
        "visit-supervisor"
      ]
    },
    "Grant": {
      "fields": {
        "name": {
          "type": "string",
          "label": "nome",
          "can_sort": true,
          "can_filter": true
        },
        "identifier": {
          "type": "string",
          "label": "identificativo",
          "can_sort": true,
          "can_filter": true
        },
        "projectType": {
          "type": "string",
          "label": "tipo progetto",
          "can_sort": true,
          "can_filter": true
        },
        "funds": {
          "type": "string",
          "enum": [
            "National",
            "International"
          ],
          "default": "National",
          "label": "finanziamento",
          "can_sort": true,
          "can_filter": true
        },
        "fundingEntity": {
          "type": "string",
          "label": "ente finanziatore",
          "can_sort": true,
          "can_filter": true
        },
        "pi": {
          "type": "string",
          "x-ref": "Person",
          "description": "Refers to Person",
          "label": "principal investigator",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": [
            "lastName",
            "firstName"
          ],
          "can_filter": true,
          "related_field": true
        },
        "localCoordinator": {
          "type": "string",
          "x-ref": "Person",
          "description": "Refers to Person",
          "label": "coordinatore locale",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": [
            "lastName",
            "firstName"
          ],
          "can_filter": true,
          "related_field": true
        },
        "members": {
          "type": "array",
          "items": {
            "type": "string",
            "x-ref": "Person",
            "description": "Refers to Person",
            "label": "partecipanti",
            "pattern": "^[0-9a-fA-F]{24}$"
          },
          "can_filter": true,
          "related_field": true,
          "related_many": true
        },
        "startDate": {
          "type": "string",
          "label": "data inizio",
          "format": "date-time",
          "can_sort": true,
          "can_filter": true,
          "match_date": true
        },
        "endDate": {
          "type": "string",
          "label": "data fine",
          "format": "date-time",
          "can_sort": true,
          "can_filter": true,
          "match_date": true
        },
        "webSite": {
          "type": "string",
          "label": "URL sito web",
          "can_sort": true,
          "can_filter": true
        },
        "budgetAmount": {
          "type": "string",
          "label": "budget",
          "can_sort": true,
          "can_filter": true
        },
        "description": {
          "type": "string",
          "label": "descrizione",
          "widget": "text",
          "can_sort": true,
          "can_filter": true
        },
        "SSD": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "enum": [
            "MAT/01",
            "MAT/02",
            "MAT/03",
            "MAT/04",
            "MAT/05",
            "MAT/06",
            "MAT/07",
            "MAT/08",
            "MAT/09"
          ],
          "default": [],
          "label": "SSD",
          "can_filter": true
        },
        "notes": {
          "type": "string",
          "label": "note",
          "widget": "text",
          "can_sort": true,
          "can_filter": true
        },
        "createdBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "updatedBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "_id": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": true,
          "can_filter": true,
          "match_ids": true
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "__v": {
          "type": "number"
        }
      },
      "related": [
        {
          "multiple": true,
          "modelName": "Visit",
          "url": "visit",
          "field": "grants"
        }
      ],
      "modelName": "Grant",
      "path": "grant",
      "managerRoles": [
        "admin",
        "grant-manager"
      ],
      "supervisorRoles": [
        "admin",
        "supervisor",
        "grant-manager",
        "grant-supervisor"
      ]
    },
    "User": {
      "fields": {
        "firstName": {
          "type": "string",
          "label": "cognome",
          "can_sort": true,
          "can_filter": true
        },
        "lastName": {
          "type": "string",
          "label": "nome",
          "can_sort": true,
          "can_filter": true,
          "match_regex": true
        },
        "email": {
          "type": "string",
          "label": "email",
          "can_sort": true,
          "can_filter": true
        },
        "username": {
          "type": "string",
          "label": "username",
          "can_sort": true,
          "can_filter": true
        },
        "roles": {
          "type": "array",
          "items": {
            "type": "string",
            "label": "ruoli"
          }
        },
        "_id": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": true,
          "can_filter": true,
          "match_ids": true
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "__v": {
          "type": "number"
        }
      },
      "related": [],
      "modelName": "User",
      "path": "user",
      "managerRoles": [
        "admin"
      ],
      "supervisorRoles": [
        "admin",
        "supervisor"
      ]
    },
    "Token": {
      "fields": {
        "name": {
          "type": "string"
        },
        "token": {
          "type": "string",
          "can_sort": true,
          "can_filter": true
        },
        "roles": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "createdBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "updatedBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "_id": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": true,
          "can_filter": true,
          "match_ids": true
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "__v": {
          "type": "number"
        }
      },
      "related": [],
      "modelName": "Token",
      "path": "token",
      "managerRoles": [
        "admin"
      ],
      "supervisorRoles": [
        "admin",
        "supervisor"
      ]
    },
    "Group": {
      "fields": {
        "name": {
          "type": "string",
          "label": "nome",
          "can_sort": true,
          "can_filter": true
        },
        "startDate": {
          "type": "string",
          "label": "data inizio",
          "format": "date-time",
          "can_sort": true,
          "can_filter": true,
          "match_date": true
        },
        "endDate": {
          "type": "string",
          "label": "data fine",
          "format": "date-time",
          "can_sort": true,
          "can_filter": true,
          "match_date": true
        },
        "members": {
          "type": "array",
          "items": {
            "type": "string",
            "x-ref": "Person",
            "description": "Refers to Person",
            "label": "membri",
            "pattern": "^[0-9a-fA-F]{24}$"
          },
          "can_filter": true,
          "related_field": true,
          "related_many": true
        },
        "createdBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "updatedBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "_id": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": true,
          "can_filter": true,
          "match_ids": true
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "__v": {
          "type": "number"
        }
      },
      "related": [],
      "modelName": "Group",
      "path": "group",
      "managerRoles": [
        "admin",
        "group-manager"
      ],
      "supervisorRoles": [
        "admin",
        "supervisor",
        "group-manager",
        "group-supervisor"
      ]
    },
    "Person": {
      "fields": {
        "firstName": {
          "type": "string",
          "label": "nome",
          "can_sort": true,
          "can_filter": true
        },
        "lastName": {
          "type": "string",
          "label": "cognome",
          "can_sort": true,
          "can_filter": true
        },
        "affiliation": {
          "type": "string",
          "label": "affiliazione",
          "can_sort": true,
          "can_filter": true
        },
        "gender": {
          "type": "string",
          "enum": [
            "Uomo",
            "Donna",
            "Non Specificato"
          ],
          "default": "Non Specificato",
          "label": "genere",
          "can_sort": true,
          "can_filter": true
        },
        "country": {
          "type": "string",
          "label": "nazione",
          "can_sort": true,
          "can_filter": true
        },
        "email": {
          "type": "string",
          "label": "email",
          "can_sort": true,
          "can_filter": true
        },
        "phone": {
          "type": "string",
          "label": "telefono",
          "can_sort": true,
          "can_filter": true
        },
        "notes": {
          "type": "string",
          "label": "note",
          "widget": "text",
          "can_sort": true,
          "can_filter": true
        },
        "personalPage": {
          "type": "string",
          "label": "URL pagina personale",
          "can_sort": true,
          "can_filter": true
        },
        "orcid": {
          "type": "string",
          "label": "orcid",
          "can_sort": true,
          "can_filter": true
        },
        "arxiv_orcid": {
          "type": "boolean",
          "default": false,
          "label": "arxiv_orcid",
          "can_sort": true,
          "can_filter": true,
          "match_boolean": true
        },
        "google_scholar": {
          "type": "string",
          "label": "google_scholar",
          "can_sort": true,
          "can_filter": true
        },
        "mathscinet": {
          "type": "string",
          "label": "mathscinet",
          "can_sort": true,
          "can_filter": true
        },
        "createdBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "updatedBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "_id": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": true,
          "can_filter": true,
          "match_ids": true
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "__v": {
          "type": "number"
        }
      },
      "related": [
        {
          "multiple": false,
          "modelName": "RoomAssignment",
          "url": "roomAssignment",
          "field": "person"
        },
        {
          "multiple": false,
          "modelName": "Visit",
          "url": "visit",
          "field": "person"
        },
        {
          "multiple": true,
          "modelName": "Visit",
          "url": "visit",
          "field": "referencePeople"
        },
        {
          "multiple": false,
          "modelName": "Grant",
          "url": "grant",
          "field": "pi"
        },
        {
          "multiple": false,
          "modelName": "Grant",
          "url": "grant",
          "field": "localCoordinator"
        },
        {
          "multiple": true,
          "modelName": "Grant",
          "url": "grant",
          "field": "members"
        },
        {
          "multiple": false,
          "modelName": "Staff",
          "url": "staff",
          "field": "person"
        },
        {
          "multiple": false,
          "modelName": "Group",
          "url": "group",
          "field": "members"
        }
      ],
      "modelName": "Person",
      "path": "person",
      "managerRoles": [
        "admin",
        "person-manager"
      ],
      "supervisorRoles": [
        "admin",
        "supervisor",
        "person-manager",
        "person-supervisor"
      ]
    },
    "Staff": {
      "fields": {
        "person": {
          "type": "string",
          "x-ref": "Person",
          "description": "Refers to Person",
          "label": "persona",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": [
            "lastName",
            "firstName"
          ],
          "can_filter": true,
          "related_field": true
        },
        "matricola": {
          "type": "string",
          "label": "matricola",
          "can_sort": true,
          "can_filter": true
        },
        "qualification": {
          "type": "string",
          "enum": [
            "PO",
            "PA",
            "RIC",
            "RTDb",
            "RTDa",
            "Assegnista",
            "Dottorando",
            "PTA",
            "Collaboratore e Docente Esterno",
            "Professore Emerito"
          ],
          "label": "qualifica",
          "can_sort": true,
          "can_filter": true
        },
        "startDate": {
          "type": "string",
          "label": "data inizio",
          "format": "date-time",
          "can_sort": true,
          "can_filter": true,
          "match_date": true
        },
        "endDate": {
          "type": "string",
          "label": "data fine",
          "format": "date-time",
          "can_sort": true,
          "can_filter": true,
          "match_date": true
        },
        "SSD": {
          "type": "string",
          "enum": [
            "MAT/01",
            "MAT/02",
            "MAT/03",
            "MAT/04",
            "MAT/05",
            "MAT/06",
            "MAT/07",
            "MAT/08",
            "MAT/09",
            ""
          ],
          "default": "",
          "label": "SSD",
          "can_sort": true,
          "can_filter": true
        },
        "publish": {
          "type": "boolean",
          "default": true,
          "label": "pubblica sul web",
          "can_sort": true,
          "can_filter": true,
          "match_boolean": true
        },
        "wordpressId": {
          "type": "string"
        },
        "cn_ldap": {
          "type": "string",
          "label": "cn_ldap",
          "can_sort": true,
          "can_filter": true
        },
        "notes": {
          "type": "string",
          "label": "note",
          "widget": "text",
          "can_sort": true,
          "can_filter": true
        },
        "createdBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "updatedBy": {
          "type": "string",
          "x-ref": "User",
          "description": "Refers to User",
          "pattern": "^[0-9a-fA-F]{24}$"
        },
        "_id": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$",
          "can_sort": true,
          "can_filter": true,
          "match_ids": true
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "can_sort": true
        },
        "__v": {
          "type": "number"
        }
      },
      "related": [],
      "modelName": "Staff",
      "path": "staff",
      "managerRoles": [
        "admin",
        "staff-manager"
      ],
      "supervisorRoles": [
        "admin",
        "supervisor",
        "staff-manager",
        "staff-supervisor"
      ]
    }
  }

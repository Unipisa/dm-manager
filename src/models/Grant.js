import Model from './Model'

import { useState, useCallback } from 'react'
import { Card, Form, Table, Button, ButtonGroup } from 'react-bootstrap'
import { Route, useParams, useNavigate, Link, Navigate } from 'react-router-dom'

import { useEngine, myDateFormat, useQueryFilter } from '../Engine'
import { Th } from '../components/Table'
import { BooleanInput, ListInput, PersonInput, DateInput, SelectInput, StringInput, TextInput } from '../components/Input'


export default class Grant extends Model {
    static code = 'grant'
    static name = "grant"
    static names = "grants"
    static ModelName = 'Grant'
    static oa = 'o'
    static indexDefaultFilter = {'_sort': '-startDate', '_limit': 10}
    static managerRoles = ['admin', 'grant-manager']
    static columns = {                              
        'startDate': "dal",
        'endDate': "al",
        'name': "nome",
        'identifier': "id",
        'projectType': "tipo",
        'pi': "pi",
        'updatedAt': "modificato",
    }

    static describe(grant) { return grant?.name }

}




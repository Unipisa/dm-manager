import assert from 'node:assert/strict'
import { test } from 'node:test'
import api from './api.js'
import { apiPath, joinPath } from './apiPath.js'

test('API paths support empty prefixes and scoped process paths', () => {
    for (const prefix of ['', undefined, null, '/', '///']) {
        assert.equal(apiPath(prefix, 'room'), '/api/v0/room')
        assert.equal(apiPath(prefix, 'roomAssignment', 'assignment-id'), '/api/v0/roomAssignment/assignment-id')
    }
    assert.equal(apiPath('/process//visits/', '/roomAssignment/'), '/api/v0/process/visits/roomAssignment')
    assert.equal(apiPath('process/my/visits', 'roomAssignment'), '/api/v0/process/my/visits/roomAssignment')
    assert.equal(apiPath(), '/api/v0')
})

test('resource paths give reads, mutations, and cache keys the same spelling', () => {
    const resource = joinPath('', 'roomAssignment')
    assert.equal(resource, 'roomAssignment')
    assert.equal(apiPath(resource), '/api/v0/roomAssignment')
    assert.equal(apiPath(resource, 'assignment-id'), '/api/v0/roomAssignment/assignment-id')
    assert.equal(joinPath('', 'person'), 'person')
    assert.equal(joinPath('/process//visits/', 'person'), 'process/visits/person')
})

test('path joining preserves encoded data and supports numeric segments', () => {
    assert.equal(apiPath('upload', 'a%2Fb'), '/api/v0/upload/a%2Fb')
    assert.equal(apiPath('timesheet', 'id', 2026, 0), '/api/v0/timesheet/id/2026/0')
})

test('fetch methods send canonical URLs while preserving query values', async (t) => {
    const requests = []
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        requests.push({ url, options })
        return { status: 200, json: async () => ({}) }
    })
    const resource = apiPath('', 'roomAssignment')
    const filter = {
        endDate__gte_or_null: '2026-04-01T00:00:00.000Z',
        link: 'https://example.com/a//b',
    }
    await api.get(resource, filter)
    await api.put(resource, {})
    await api.patch(apiPath('', 'roomAssignment', 'id'), {})
    await api.del(apiPath('', 'roomAssignment', 'id'))

    assert.deepEqual(requests.map(({ url }) => url.split('?')[0]), [
        resource, resource, resource + '/id', resource + '/id',
    ])
    assert.deepEqual(Object.fromEntries(new URLSearchParams(requests[0].url.split('?')[1])), filter)
    assert.deepEqual(requests.map(({ options }) => options.method || 'GET'), ['GET', 'PUT', 'PATCH', 'DELETE'])
    assert.ok(requests.every(({ options }) => options.credentials === 'include'))
})

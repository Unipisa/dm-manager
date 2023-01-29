const request = require('supertest')
const { createApp, setupDatabase, create_admin_user, createOrUpdateUser } = require('../server')
const http = require('http')
const supertest = require('supertest')

let app = null
let connection = null

beforeAll(async () => {
  connection = await setupDatabase()
  await connection.db.dropDatabase()
  // console.log(`test database dropped`)
  connection = await setupDatabase()
  const server = createApp()
  app = supertest.agent(server)
  await createOrUpdateUser({
    username: 'admin',
    password: 'secret',
    roles: ['admin'],
  })
  await createOrUpdateUser({
    username: 'visit-manager',
    password: 'secret',
    roles: ['visit-manager'],
  })
})

afterAll(() => {
  connection.close()
})

describe ('sanity checks', () => {
  it('NODE_ENV should be test', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })
  it('test database responding', () => {
    expect(connection).toBeTruthy()
  })
})

describe('test non logged user', () => {
  it('should respond', async () => {
    await app
      .get('/api/v0/')
      .send({})
      .expect(200)
  })
  it('should check password ', async () => {
    await app
      .post('/login/password')
      .send({ username: 'admin', password: 'invalid' })
      .expect(401)
  })
  it('should reject listing', async () => {
    await app
      .get('/api/v0/visit')
      .expect(401)
  })
})

describe('test admin user', () => {
  it('can login ', async () => {
    await app
      .post('/login/password')
      .send({ username: 'admin', password: 'secret' })
      .expect(200)
  })
  it('can list visits', async () => {
    await app
      .get('/api/v0/visit')
      .expect(200)
  })
  it('can search people', async () => {
    await app
      .get('/api/v0/person/search?_search=foo')
      .expect(200)
  })
})

describe('test visit-manager', () => {
  it('can login', async () => {
    await app
      .post('/login/password')
      .send({ username: 'visit-manager', password: 'secret' })
      .expect(200)
  })
  it('cannot list users', async () => {
    await app
      .get('/api/v0/user')
      .expect(403)
  })
  it('can search people', async () => {
    await app
      .get('/api/v0/person/search?_search=foo')
      .expect(200)
  })
})

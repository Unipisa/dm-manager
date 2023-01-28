const request = require('supertest')
const { createApp, setupDatabase, create_admin_user } = require('../server')
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
  await create_admin_user()
  // console.log(`setup finished`)
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

describe('test API', () => {
  it('should respond', async () => {
    const res = await app
      .get('/api/v0/')
      .send({})
      .expect(200)
  })
  it('should check password ', async () => {
    const res = await app
      .post('/login/password')
      .send({ username: 'admin', password: 'invalid' })
      .expect(401)
  })
  it('should reject listing to unauthorized users', async () => {
    const res = await app
      .get('/api/v0/visit')
      .expect(401)
  })
  it('should let admin login ', async () => {
    const res = await app
      .post('/login/password')
      .send({ username: 'admin', password: 'secret' })
      .expect(200)
  })
  it('should let admin list visits', async () => {
    const res = await app
      .get('/api/v0/visit')
      .expect(200)
  })
})
/*

curl 'http://localhost:8000/login/password' --data-raw '{"username":"admin","password":"secret"}'
*/
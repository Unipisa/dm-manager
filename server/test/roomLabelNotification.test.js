const { setupDatabase, createOrUpdateUser } = require('../database')
const RoomLabel = require('../models/RoomLabel')
const User = require('../models/User')

let connection = null

beforeAll(async () => {
  connection = await setupDatabase()
  await connection.db.dropDatabase()
  connection = await setupDatabase()
  
  // Create a test user with the roomLabels role
  await createOrUpdateUser({
    username: 'roomlabel-manager',
    password: 'secret',
    email: 'roomlabel-manager@example.com',
    roles: ['notify/process/roomLabels'],
  })
})

afterAll(async () => {
  if (connection) {
    await connection.close()
  }
})

describe('RoomLabel notification tests', () => {
  it('should find users with notify/process/roomLabels role', async () => {
    const users = await User.find({ roles: { $regex: '^notify/process/roomLabels($|/)' } })
    expect(users.length).toBeGreaterThan(0)
    expect(users[0].email).toBe('roomlabel-manager@example.com')
  })

  it('should query submitted RoomLabels', async () => {
    // Create a test RoomLabel with submitted state
    const user = await User.findOne({ username: 'roomlabel-manager' })
    const label = new RoomLabel({
      names: ['Test Room'],
      number: '101',
      size: 4,
      format: 'square',
      state: 'submitted',
      createdBy: user._id,
      updatedBy: user._id,
    })
    await label.save()

    // Query for submitted labels
    const submittedLabels = await RoomLabel.find({ state: 'submitted' })
    expect(submittedLabels.length).toBeGreaterThan(0)
    expect(submittedLabels[0].state).toBe('submitted')
    expect(submittedLabels[0].names[0]).toBe('Test Room')
  })

  it('should not find managed RoomLabels when querying for submitted', async () => {
    // Create a managed label
    const user = await User.findOne({ username: 'roomlabel-manager' })
    const managedLabel = new RoomLabel({
      names: ['Managed Room'],
      number: '102',
      size: 4,
      format: 'rectangle',
      state: 'managed',
      createdBy: user._id,
      updatedBy: user._id,
    })
    await managedLabel.save()

    // Query for submitted labels only
    const submittedLabels = await RoomLabel.find({ state: 'submitted' })
    const isManaged = submittedLabels.some(label => label.state === 'managed')
    expect(isManaged).toBe(false)
  })
})

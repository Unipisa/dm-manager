const axios = require('axios')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
const should = chai.should()

const config = require('./config')

chai.use(chaiAsPromised)

let foo = 'bar'
let beverages = { tea: [ 'chai', 'matcha', 'oolong' ] }

expect(foo).to.be.a('string')
expect(foo).to.equal('bar')
expect(beverages).to.have.property('tea').with.lengthOf(3)

const API = `${config.REACT_APP_SERVER_URL}/api/v0`
const SECRET = config.TOKEN_SECRET

expect(SECRET).to.be.not.null

// return expect(axios.get(`${URL}/visit`)).to.eventually.be.rejected

async function main() {
    console.log(`main`)

    let url = API
    let response
    
    console.log(`* GET ${url}`)
    response = await axios.get(url)
    console.log(`${JSON.stringify(response.data)}`)

    url = `${API}/visit`
    // expect(axios.get(url)).to.eventually.throw
    console.log(`* GET ${url} without token`)
    try {
        await axios.get(url)
        throw new Error('error expected!')
    } catch(error) {
        expect(error.code).to.be.equal('ERR_BAD_REQUEST')
        console.log(`error (as expected): ${error.message}`)
    }

    url = `${API}/visit`
    console.log(`* GET ${url} with authorization token`)
    response = await axios.get(url, {
        headers: {
            'Authorization': `Bearer ${SECRET}`
        }
    })
    console.log(JSON.stringify(response.data))
}

main()
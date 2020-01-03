const { expect, assert } = require('chai')
const crypto = require('crypto')
const { getDatabaseUri } = require("./base")
const { 
  getAllQuestionIds,
  getQuestion,
  saveQuestion,
  updateQuestion,
  deleteQuestion
} = require('./index')

let id, rev
const cryptoName = crypto.randomBytes(16).toString('hex')
const randomNumber = Math.round(Math.random()*100)

describe('index.js', () => {

  describe('saveQuestion', () => {
    it('should respond in a correct format', async () => {
      const resp = await saveQuestion({ name: cryptoName, age: randomNumber })
      expect(resp).to.have.keys(['ok', 'id', 'rev'])
      expect(resp.ok).to.be.equal(true)
      expect(resp.id).to.match(/^[0-9a-f]{1,}$/)
      expect(resp.rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)
      id = resp.id
      rev = resp.rev
    })
  })

  describe('getAllQuestionIds', () => {
    it('should respond in correct format', async () => {

      const resp = await getAllQuestionIds()
      expect(resp).to.have.keys(['total_rows', 'offset', 'rows'])
      expect(resp.total_rows).to.be.greaterThan(0)
      expect(resp.rows).to.be.an('array')
      for (const row of resp.rows){
        expect(row).to.have.keys(['id', 'key', 'value'])
        expect(row.id).to.match(/^[0-9a-f]{1,}$/)
        expect(row.key).to.match(/^[0-9a-f]{1,}$/)
      }
    })
  })

  describe('getQuestion', () => {
    it('should respond in correct format', async () => {
      if (!id) throw new Error(`id was not defined`)
      const resp = await getQuestion({ id })
      expect(resp).to.have.keys(['_id', '_rev', 'name', 'age'])
      expect(resp._id).to.match(/^[0-9a-f]{1,}$/)
      expect(resp._rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)
      expect(resp.name).to.equal(cryptoName)
      expect(resp.age).to.equal(randomNumber)
    })
  })

  describe('deleteQuestion', () => {
    it('should respond in correct format', async () => {
      if (!rev) throw new Error(`rev was not defined`)
      const resp = await deleteQuestion({ id, rev })
      expect(resp).to.have.keys(['ok', 'id', 'rev'])
      expect(resp.ok).to.be.equal(true)
      expect(resp.id).to.match(/^[0-9a-f]{1,}$/)
      expect(resp.rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)
    })
    it('should delete the document', async () => {
      try {
        await getQuestion({ id })
        assert(false, 'getQuestion should fail after deletion')
      } catch (e) {
        assert(true)
      }
    })
  })
})
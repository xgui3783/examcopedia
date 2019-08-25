const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const { getCollection } = require('../db')
const crypto = require('crypto')

router.get('/', async (req, res) => {
  const questions = await getCollection('questions')
  const cursor = await questions.all()
  const all = await cursor.all()
  res.status(200).json(all)
})

router.get('/:questionId', (req, res) => {
  /**
   * TODO
   */
})

/**
 * create new question
 */
router.post('/', bodyParser.json(), async (req, res) => {
  const { body } = req

  const id = crypto.randomBytes(16).toString('hex')
  const questionToBeSaved =  {...body, id, _key: id }
  const questions = await getCollection('questions')
  await questions.save(questionToBeSaved)
  res.status(200).json(questionToBeSaved)
})

/**
 * update existing question
 */
router.put('/:questoinId', bodyParser.json(), async (req, res) => {
  const { body } = req
  const { id, ...rest } = body
  const questions = await getCollection('questions')

  /**
   * TODO
   * versioning of old questions
   */
  const oldQuestion = await questions.update(id, {
    ...rest
  })
  res.status(200).send(body)
})

/**
* delete existing question
*/
router.delete('/:quesitonId', (req, res) => {

})

module.exports = router
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')

const testObj = {
  id: 'testCategoryId',
  name: 'test category name',
}

/**
 * get all categry by questionId
 */
router.get('/questionId/:questionId', (req, res) => {
  const { params } = req
  res.status(200).json([ testObj ])
})

/**
 * get all questions from categoryId
 */
router.get('/categoryId/:categoryId', (req, res) => {

})

/**
 * categorise
 */
router.put('/categoryId/:categoryId', bodyParser.json() , (req, res) => {

})

/**
 * decategorise
 */
router.delete('/categoryId/:categoryId', bodyParser.json(), (req, res) => {
  console.log(req.body)
  res.status(200).end()
})

module.exports = router
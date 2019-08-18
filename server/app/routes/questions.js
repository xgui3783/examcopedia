const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')

router.get('/:questionId', (req, res) => {

})

/**
 * create new question
 */
router.pust('/:questionId', bodyParser.json(), (req, res) => {

})

/**
 * update existing question
 */
 router.put('/:questoinId', bodyParser.json(), (req, res) => {

 })

 /**
  * delete existing question
  */
 router.delete('/:quesitonId', (req, res) => {

 })

module.exports = router
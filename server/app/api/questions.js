const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const { 
  saveQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestion,
  getAllQuestionIds
} = require('../db')

router.get('/', async (req, res) => {
  try {
    const { rows } = await getAllQuestionIds()
    const docs = rows.map(({ value, ...rest }) => {
      const { rev } = value
      return {
        ...rest,
        rev
      }
    })
    res.status(200).json(docs)
  } catch (e) {
    res.status(500).send(e)
  }
})

router.get('/:questionId', async (req, res) => {
  const { questionId } = req.params
  try {
    const doc = await getQuestion({ id: questionId })
    res.status(200).json(doc)
  } catch (e) {
    res.status(500).send(e)
  }
})

/**
 * create new question
 */
router.post('/', bodyParser.json(), async (req, res) => {
  const { body } = req

  const { ok, id, rev, error } = await saveQuestion(body)
  if (ok) {
    res.status(200).json({ 
      id,
      rev,
      ...body
    })
  } else {
    res.status(500).json(error)
  }
})

/**
 * update existing question
 */
router.put('/:questoinId', bodyParser.json(), async (req, res) => {
  const { body } = req
  const { id, rev, ...rest } = body
  const { ok, id: newId, rev: newRev, error } = await updateQuestion({ id, _rev: rev, ...rest })
  
  if (ok) {
    res.status(200).json({
      id,
      rev: newRev,
      ...rest
    })
  } else {
    res.status(500).json(error)
  }
})

/**
* delete existing question
*/
router.delete('/:quesitonId', bodyParser.json(), async (req, res) => {
  const { body } = req
  const { id, rev } = body
  try {
    await deleteQuestion({ id: questionId, rev })
    res.status(200).end()
  } catch (e) {
    res.status(500).send(e)
  }
})

module.exports = router
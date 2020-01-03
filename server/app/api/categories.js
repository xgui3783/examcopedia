const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const { getCollection, getEdgeCollection, getDb } = require('../db')
const crypto = require('crypto')
const { aql } = require('arangojs')

const testObj = {
  id: 'testCategoryId',
  name: 'test category name',
}

/**
 * get all categry by questionId
 */
router.get('/questionId/:questionId', async (req, res) => {
  const { questionId } = req.params
  await getEdgeCollection('categorisedUnder')
  const db = await getDb()
  const cursor = await db.query(aql`
    FOR q IN questions
      FILTER q.id == ${questionId}
      FOR c IN OUTBOUND q._id categorisedUnder
      RETURN c
  `)
  const all = await cursor.all()
  res.status(200).json(all)
})

/**
 * form links
 */
router.post('/questionId/:questionId/categoryId/:categoryId', async (req, res) => {
  const { questionId, categoryId } = req.params
  const categorisedUnder = await getEdgeCollection('categorisedUnder')
  const questions = await getCollection('questions')
  const questionExists = await questions.documentExists(`questions/${questionId}`)
  const dotPoints = await getCollection('dotPoints')
  const dotPointExists = await dotPoints.documentExists(`dotPoint/${categoryId}`)
  if (!questionExists || !dotPointExists) return res.status(404).end()
  const result = await categorisedUnder.save({}, `questions/${questionId}`, `dotPoint/${categoryId}`)
  return res.status(200).json(result)
})

/**
 * remove links
 */
router.delete('/questionId/:questionId/categoryId/:categoryId', async (req, res) => {
  const { questionId, categoryId } = req.params

  const db = await getDb()
  const categorisedUnder = await getEdgeCollection('categorisedUnder')
  console.log('delete called', { questionId, categoryId })
  const cursor = await db.query(aql`
  FOR c IN categorisedUnder
  FILTER c._to == "dotPoint/${categoryId}"
  FILTER c._from == "questions/${questionId}"
  RETURN c
  `)
  const results = await cursor.all()
  console.log({ results })
  if (results.length === 0) {
    return res.status(404).end()
  } else {
    const delCursor = await db.query(aql`
    FOR key IN ${JSON.stringify(results)}
    REMOVE key IN categorisedUnder
    `)
    const delResult = await delCursor.all()
    console.log({ delResult })
    return res.status(200).end()
  }
})

/**
 * Get all questions from a category
 */
router.get('/:categoryId', async (req, res) => {
  const { categoryId } = req.params
  const db = await getDb()
  const cursor = await db.query(aql`
    FOR c IN dotPoint
    FILTER c.id == ${categoryId}
    RETURN MERGE(c, {
      children: (
        FOR child IN OUTBOUND c._id dotPointHierarchy
        RETURN {
          name: child.name,
          id: child.id
        }
      )
    })
  `)

  if(!cursor.hasNext()) return res.status(404).end()
  const doc = await cursor.next()
  if(cursor.hasNext()) return res.status(409).end()
  res.status(200).json(doc)
})

/**
 * Get all root level categories
 */
router.get('/', async (req, res) => {
  /**
   * if dotPoint doesn't exist, create it
   */
  await getCollection('dotPoint')

  const db = await getDb()
  const cursor = await db.query(aql`
    FOR c IN dotPoint
    FILTER c.root == true
    RETURN c
    `)
  const allRootDp = await cursor.all()
  return res.status(200).json(allRootDp)
})

/**
 * get all questions from categoryId
 */
router.get('/:categoryId/questions', (req, res) => {

})

/**
 * CREATE a new dot point
 */
router.post('/', bodyParser.json(), async (req, res) => {
  
  const { body } = req
  const { parent } = body
  const dotPoint = await getCollection('dotPoint')
  const id = crypto.randomBytes(16).toString('hex')
  const dpToBeSaved = {
    ...body,
    root: !parent,
    id,
    _key: id
  }

  const savedDotPoint = await dotPoint.save(dpToBeSaved)

  /**
   * if parent is undefined, save as root node, 
   * ie do not draw any edges
   */
  if (!parent) return res.status(200).json(savedDotPoint)

  
  const dotPtHierarchy = await getEdgeCollection('dotPointHierarchy')
  const parentExists = await dotPoint.documentExists(`dotPoint/${parent}`)

  /**
   * if the parent does not exist, returns 409 conflict
   */
  if (!parentExists) return res.status(409).json(savedDotPoint)

  dotPtHierarchy.save({
    relationship: 'hasChild'
  }, `dotPoint/${parent}`, savedDotPoint)

  res.status(200).json(savedDotPoint)
})

/**
 * categories
 */
router.post('/categoryId/:categoryId', bodyParser.json() , (req, res) => {

})

/**
 * decategories
 */
router.delete('/categoryId/:categoryId', bodyParser.json(), (req, res) => {
  console.log(req.body)
  res.status(200).end()
})

module.exports = router
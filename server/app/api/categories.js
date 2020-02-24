const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const { 
  getAllQuestionIds,
  getQuestion,
  saveQuestion,
  updateQuestion,
  deleteQuestion,
  
  // categories
  getCategoryInfo,
  createNewCategory,
  updateCategory,
  deleteCategory,
  
  // categories
  getAllCategoriesFromQuestionId,
  categoriseQuestion,
  uncategorise,
  getAllQuestionsFromCategoryId
} = require('../db')
const crypto = require('crypto')
const logging = require('../../log')

/**
 * get all categry by questionId
 */
router.get('/questionId/:questionId', async (req, res) => {
  const { questionId } = req.params
  try {
    const { docs } = await getAllCategoriesFromQuestionId({ id: questionId })
    res.status(200).json(docs)
  } catch(e){
    logging.error(e)
    res.status(500).send(e)
  }
})

/**
 * form links
 */
router.post('/questionId/:questionId/categoryId/:categoryId', async (req, res) => {
  const { questionId, categoryId } = req.params
  try{
    await categoriseQuestion({id: questionId}, { id: categoryId })
    res.status(202).end()
  } catch (e) {
    logging.error(e)
    res.status(500).send(e)
  }
})

/**
 * remove links
 */
router.delete('/questionId/:questionId/categoryId/:categoryId', async (req, res) => {
  const { questionId, categoryId } = req.params

  try {
    await uncategorise({ id: questionId}, { id: categoryId })
    res.status(202).end()
  } catch (e) {
    logging.error(e)
    res.status(500).send(e)
  }
})

/**
 * Get all questions from a category
 */
router.get('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params
    const result = await getCategoryInfo({ id: categoryId })
    res.status(200).json(result)
  } catch (e) {
    logging.error(e)
    return res.status(500).send(e)
  }
})

/**
 * Get all root level categories
 */
router.get('/', async (req, res) => {
  try {
    const { children } = await getCategoryInfo()
    res.status(200).json(children)
  } catch (e) {
    logging.error(e)
    res.status(500).send(e)
  }
})

/**
 * get all questions from categoryId
 */
router.get('/:categoryId/questions', async (req, res) => {
  try {
    const { categoryId } = req.params
    const {docs: questions} = await getAllQuestionsFromCategoryId({ id: categoryId })
    res.status(200).json(questions.map(({_id, ...rest}) => {
      return {
        _id,
        id: _id,
        ...rest
      }
    }))
  } catch (e) {
    logging.error(e)
    res.status(500).send(e)
  }
})

/**
 * CREATE a new dot point
 */
router.post('/', bodyParser.json(), async (req, res) => {
  
  try {

    const { body } = req
    const { parent } = body
    
    await createNewCategory(body, parent)
    res.status(202).end()
  } catch (e) {
    logging.error(e)
    res.status(500).send(e)
  }
})

/**
 * categories
 */
router.post('/:categoryId', async (req, res) => {
  try{
    const { categoryId } = req.params
    const category = await getCategoryInfo({ id: categoryId })
    res.status(200).json(category)
  } catch (e) {
    logging.error(e)
    res.status(500).send(e)
  }
})

/**
 * decategories
 */
router.delete('/:categoryId', bodyParser.json(), async (req, res) => {
  try {
    const { categoryId } = req.params
    const { id, rev, _rev } = req.body
    if (id !== categoryId) return res.status(400).send(`id and categoryId must match!`)
    await deleteCategory({
      id,
      _rev,
      rev
    })
    res.status(202).end()
  }catch (e) {
    logging.error(e)
    res.status(500).send(e)
  }
})

module.exports = router
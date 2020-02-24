const { getDatabaseUri, init } = require('./base')
const { QUESTION, CATEGORY, QUESTION_CATEGORISATION } = require('../db/constants')
const request = require('request')
const { log, error, warn } = require('../../log')

const acceptHeader = {
  Accept: 'application/json'
}

const requestUtil = async ({ headers, ...arg}) => new Promise((rs, rj) => {
  request({
    method: 'get',
    ...arg,
    headers: {
      ...acceptHeader,
      ...headers
    }
  }, (err, resp, body) => {
    if (err) return rj(err)
    if (resp.statusCode >= 400) return rj(body)
    rs(JSON.parse(body))
  })
})

const getAllQuestionIds = async () => {
  const uri = getDatabaseUri({ name: QUESTION, suffix: '_all_docs' })
  return requestUtil({
    method: 'get',
    uri
  })
}

const getQuestion = async ({ id }) => {
  const uri = getDatabaseUri({ name: QUESTION, suffix: id })
  return requestUtil({
    method: 'get',
    uri
  })
}

const saveQuestion = async (question) => {
  const uri = getDatabaseUri({ name: QUESTION })
  return requestUtil({
    method: 'post',
    uri,
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(question)
  })
}

const updateQuestion = async ({ id, ...question }) => {
  const uri = getDatabaseUri({ name: QUESTION, suffix: id })
  return requestUtil({
    method: 'put',
    uri,
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(question)
  })
}

const deleteQuestion = async ({ id, rev, _rev }) => {
  if (!id) throw new Error(`id is required for deleting question`)
  if ((!rev) && (!_rev)) throw new Error(`rev is required for deleting question`)
  const uri = getDatabaseUri({ name: QUESTION, suffix: id })
  await uncategorise({ id })
  return requestUtil({
    method: 'delete',
    uri,
    headers: {
      'If-Match': rev || _rev
    }
  })
}

const getAllCategoriesFromQuestionId = async ({ id: qId }) => {
  const uri = getDatabaseUri({ name: QUESTION_CATEGORISATION, suffix: '_find' })
  const { docs } = await requestUtil({
    method: 'post',
    uri,
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      selector: {
        questionId: qId,
      }
    })
  })

  const body = {
    docs: docs.map(({ categoryId }) => ({id: categoryId}))
  }

  const questionUri = getDatabaseUri({ name: CATEGORY, suffix: '_bulk_get' })
  const { results } = await requestUtil({
    method: 'post',
    uri: questionUri,
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  return {
    docs: results
      .map(({ docs }) => {
        if (docs.length > 1) warn(`getAllCategoriesFromQuestionId length > 1`)
        const doc = docs[0]
        if (doc.error) error(`getAllCategoriesFromQuestionId error`, doc.error)
        return doc.ok
      })
      .filter(v => !!v)
  } 
}

const categoriseQuestion = async ({ id: qId }, { id: cId }) => {
  const { docs } = await getAllCategoriesFromQuestionId({ id: qId })
  if (docs.map(({ categoryId }) => categoryId).indexOf(cId) >= 0) throw new Error(`categorisation already exists!`)

  const uri = getDatabaseUri({ name: QUESTION_CATEGORISATION })
  return requestUtil({
    method: 'post',
    uri,
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      questionId: qId,
      categoryId: cId
    })
  })
}

const uncategorise = async (question, category = {}) => {
  const { id: questionId } = question || {}
  const { id: categoryId } = category || {}

  if ((!categoryId) && (!questionId)) throw new Error(`either question or category is required for uncategorise`)
  
  const categoriseUri = getDatabaseUri({ name: QUESTION_CATEGORISATION, suffix: '_find' })
  const findBody = {
    selector: {
      ...(questionId ? { questionId } : {}),
      ...(categoryId ? { categoryId } : {})
    }
  }
  const { docs } = await requestUtil({
    method: 'post',
    uri: categoriseUri,
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(findBody)
  })

  const uri = getDatabaseUri({ name: QUESTION_CATEGORISATION, suffix: '_bulk_docs' })
  const body = {
    docs: docs.map(entry => {
      return {
        ...entry,
        _deleted: true
      }
    })
  }
  return requestUtil({
    method: 'post',
    uri,
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(body)
  })
}

const getAllQuestionsFromCategoryId = async ({ id: cId }) => {
  const uri = getDatabaseUri({ name: QUESTION_CATEGORISATION, suffix: '_find' })
  const { docs } = await requestUtil({
    method: 'post',
    uri,
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      selector: {
        categoryId: cId
      }
    })
  })

  const body = {
    docs: docs.map(({ questionId }) => ({id: questionId}))
  }

  const questionUri = getDatabaseUri({ name: QUESTION, suffix: '_bulk_get' })
  const { results } = await requestUtil({
    method: 'post',
    uri: questionUri,
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  return {
    docs: results
      .map(({ docs }) => {
        if (docs.length > 1) warn(`getAllCategoriesFromQuestionId length > 1`)
        const doc = docs[0]
        if (doc.error) error(`getAllCategoriesFromQuestionId error`, doc.error)
        return doc.ok
      })
      .filter(v => !!v)
  } 
}

/**
 * 
 * @optional @param {id} id of category.
 * @returns the populated info about a category. If the argument is empty, 
 * returns the root categories.
 * 
 */
const getCategoryInfo = async ({ id: cId } = {}) => {

  const uri = getDatabaseUri({ name: CATEGORY, suffix: cId })
  const getInfoPr = cId
    ? requestUtil({
        method: 'get',
        uri
      })
    : Promise.resolve({})

  const findUri = getDatabaseUri({ name: CATEGORY, suffix: '_find' })
  const getChildrenPr = requestUtil({
    method: 'post',
    uri: findUri,
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      selector: {
        parentId: cId || null
      }
    })
  })

  return Promise.all([
    getInfoPr,
    getChildrenPr
  ]).then(([ obj, { docs: children, ...rest } ]) => {
    return {
      ...obj,
      children: children || []
    }
  })
}

const createNewCategory = async (category, {id: parentCId} = {}) => {
  
  try{
    parentCId && await getCategoryInfo({ id: parentCId })
  }catch(e) {
    error(`createNewCategory find parent category error.`)
    throw e
  }

  const uri = getDatabaseUri({ name: CATEGORY })
  return requestUtil({
    method: 'post',
    uri,
    headers: {
      'Content-type':'application/json'
    },
    body: JSON.stringify({
      ...category,
      parentId: parentCId || null
    })
  })
}

const updateCategory = async ({id, ...category}, { id: parentCId } = {}) => {

  try{
    parentCId
      ? await getCategoryInfo({ id: parentCId })
      : null
  }catch(e) {
    error(`createNewCategory find parent category error.`)
    throw e
  }

  const uri = getDatabaseUri({ name: CATEGORY, suffix: id })
  return requestUtil({
    method: 'put',
    uri,
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(category)
  })
}

const deleteCategory = async ({ id, rev, _rev }) => {
  if (!id) throw new Error(`id is required for deleting categories`)
  if ((!rev) && (!_rev)) throw new Error(`rev is required for deleting categories`)

  const { children } = await getCategoryInfo({ id })
  for (const { _id: childId, _rev: childRev } of children) {
    await deleteCategory({ id: childId, _rev: childRev })
  }

  const uri = getDatabaseUri({ name: CATEGORY, suffix: id })
  await uncategorise(null, { id })
  return requestUtil({
    method: 'delete',
    uri,
    headers: {
      'If-Match': rev || _rev
    }
  })
}

try {
  log(`Initializing server, attempting to create couchdb db's`)
  init()
} catch(e) {
  error(`error while creating db`, e)
  throw e
}


module.exports = {

  // questions
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
}

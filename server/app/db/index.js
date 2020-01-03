const { getDatabaseUri, init } = require('./base')
const { QUESTION } = require('../db/constants')
const request = require('request')
const { log, error } = require('../../log')


// const intervalId = setInterval(async () => {
//   try {
//     dbHandle = await init()
//     clearInterval(intervalId)
//   } catch (e) {
//     console.log(`db init error, retry in ${TIMEOUT}ms`, e)
//   }
// }, TIMEOUT)

// exports.getCollection = async collectionName => {
//   if (!dbHandle) throw new Error('dbHandle not yet defined')
//   const collection = dbHandle.collection(collectionName)
//   const exists = await collection.exists()
//   if (!exists) await collection.create()
//   return collection
// }

// exports.getEdgeCollection = async edgeCollectionName => {
//   if (!dbHandle) throw new Error('dbHandle not yet defined')
//   const collection = dbHandle.edgeCollection(edgeCollectionName)
//   const exists = await collection.exists()
//   if (!exists) await collection.create()
//   return collection
// }

// exports.getDb = async () => {
//   if (!dbHandle) throw new Error('dbHandle not yet defined')
//   return dbHandle
// }

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

}

const deleteQuestion = async ({ id, rev }) => {
  if (!id) throw new Error(`id is required for deleting question`)
  if (!rev) throw new Error(`rev is required for deleting question`)
  const uri = getDatabaseUri({ name: QUESTION, suffix: id })
  return requestUtil({
    method: 'delete',
    uri,
    headers: {
      'If-Match': rev
    }
  })
}

const getAllCategoriesFromQustionId = async ({ id: qId }) => {

}

const categoriseQuestion = async ({ id: qId }, { id: cId }) => {

}

const uncategoriseQuestion = async ({ id: qId }, { id: cId }) => {
  
}

const getAllQuestionsFromCategory = async ({ id: cId }) => {

}

/**
 * 
 * @optional @param {id} id of category.
 * @returns the populated info about a category. If the argument is empty, 
 * returns the root categories.
 * 
 */
const getCategoryInfo = async ({ id: cId } = {}) => {

}

const createNewCategory = async ({id: parentCId} = {}, category) => {

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
  getAllCategoriesFromQustionId,
  categoriseQuestion,
  uncategoriseQuestion,
  getAllQuestionsFromCategory,
  getCategoryInfo,
  createNewCategory

}

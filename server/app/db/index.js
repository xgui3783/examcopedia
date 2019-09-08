const init = require('./base')

const TIMEOUT = Number(process.env.PORT || '5000') || 5000
let dbHandle

const intervalId = setInterval(async () => {
  try {
    dbHandle = await init()
    clearInterval(intervalId)
  } catch (e) {
    console.log(`db init error, retry in ${TIMEOUT}ms`, e)
  }
}, TIMEOUT)

exports.getCollection = async collectionName => {
  if (!dbHandle) throw new Error('dbHandle not yet defined')
  const collection = dbHandle.collection(collectionName)
  const exists = await collection.exists()
  if (!exists) await collection.create()
  return collection
}

exports.getEdgeCollection = async edgeCollectionName => {
  if (!dbHandle) throw new Error('dbHandle not yet defined')
  const collection = dbHandle.edgeCollection(edgeCollectionName)
  const exists = await collection.exists()
  if (!exists) await collection.create()
  return collection
}

exports.getDb = async () => {
  if (!dbHandle) throw new Error('dbHandle not yet defined')
  return dbHandle
}
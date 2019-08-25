const init = require('./base')

let dbHandle
init()
  .then(handle => {
    dbHandle = handle
  }).catch(console.error)

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
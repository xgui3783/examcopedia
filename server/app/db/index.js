const init = require('./base')

let dbHandle
init()
  .then(handle => {
    dbHandle = handle
  }).catch(console.error)

module.exports = async collectionName => {
  if (!dbHandle) throw new Error('dbHandle not yet defined')
  const collection = dbHandle.collection(collectionName)
  const exists = await collection.exists()
  if (!exists) await collection.create()
  return collection
}
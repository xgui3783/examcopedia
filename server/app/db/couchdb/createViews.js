const request = require('request')
const { getDatabaseUri }  = require('./base')
const { QUESTION_CATEGORISATION, QUESTION, CATEGORY } = require('../constants')
const { CAT_TO_NO_Q, CAT_GET_ALL_CHILDREN } = require('./constants')
const { emit } = require('../../app')
const acceptHeader = {
  Accept: 'application/json'
}

// should only be run once

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

const replaceConst = input => {
  let output = input
  const replaceKeyVal = {
    QUESTION_CATEGORISATION, QUESTION, CATEGORY
  }
  for (const key in replaceKeyVal) {
    const re = new RegExp(key, 'gm')
    output = output.replace(re, JSON.stringify(replaceKeyVal[key]))
  }
  return output
}

const main = async () => {
  // TODO add sanity check that db has no design doc
  

  /**
   * QUESTION_CATEGORISATION views
   */
  await (async () => {

    /**
     * get rev if index exists
     * if exists, simply update
     */
    const uri = getDatabaseUri({
      name: QUESTION_CATEGORISATION,
      suffix: `_design/${CAT_TO_NO_Q}`
    })

    let rev
    try {
      const resp = await requestUtil({
        uri,
      })
      rev = resp._rev
    } catch (e){

    }

    /**
     * category to question index
     */
    await (async () => {

      const mapFunction = function(doc){
        if (doc.type === QUESTION_CATEGORISATION) {
          if (doc.categoryId) {
            emit(doc.categoryId, 1)
          }
        }
      }
      const mapString = replaceConst(mapFunction.toString())
      const jsonPayload = {
        views: {
          [CAT_TO_NO_Q]: {
            map: mapString,
            reduce: '_count'
          }
        }
      }
      
      // await requestUtil({
      //   method: 'put',
      //   uri,
      //   headers: {
      //     ... (rev ? {'If-Match': rev} : {})
      //   },
      //   body: JSON.stringify(jsonPayload)
      // })

    })()
  })()

  /**
   * CATEGORY views
   */

   await (async () => {

    /**
     * get rev if index exists
     * if exists, simply update
     */
    const uri = getDatabaseUri({
      name: CATEGORY,
      suffix: `_design/${CAT_GET_ALL_CHILDREN}`
    })
    let rev
    try {
      const resp = await requestUtil({
        uri,
      })
      rev = resp._rev
    } catch (e){

    }

    /**
     * create index
     */
    await (async () => {

      const mapFunction = function(doc){
        if (doc.type === CATEGORY) {
          const parentId = doc.parentId || (doc.parent && doc.parent.id)
          if (parentId) {
            emit(parentId, doc._id)
          }
        }
      }
      const reduceFunction = function(key, values, rereduce){
        return values.reduce(function(acc, curr){
          return acc.concat(curr)
        }, [])
      }
      const mapString = replaceConst(mapFunction.toString())
      const reduceFunctions = replaceConst(reduceFunction.toString())
      const jsonPayload = {
        views: {
          [CAT_GET_ALL_CHILDREN]: {
            map: mapString,
            reduce: reduceFunctions
          }
        }
      }
      
      await requestUtil({
        method: 'put',
        uri,
        headers: {
          ... (rev ? {'If-Match': rev} : {})
        },
        body: JSON.stringify(jsonPayload)
      })

    })()

   })()

  const uri2 = getDatabaseUri({
    name: CATEGORY,
    suffix: `_design/${CAT_GET_ALL_CHILDREN}/_view/${CAT_GET_ALL_CHILDREN}?group_level=1`
  })
  const resp = await requestUtil({
    uri: uri2
  })
  
  require('fs').writeFileSync('tmp.json', JSON.stringify(resp.rows, null, 2), 'utf-8')
}

main()
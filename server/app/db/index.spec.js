const { expect, assert } = require('chai')
const crypto = require('crypto')
const { init } = require("./base")
const { 
  getAllQuestionIds,
  getQuestion,
  saveQuestion,
  updateQuestion,
  deleteQuestion,

  createNewCategory,
  updateCategory,
  getCategoryInfo,
  deleteCategory,

  categoriseQuestion,
  uncategorise,
  getAllCategoriesFromQuestionId,
  getAllQuestionsFromCategoryId
} = require('./index')


describe('index.js', () => {
  describe('questions CRUD', () => {

    let id, rev
    const cryptoName = crypto.randomBytes(16).toString('hex')
    const randomNumber = Math.round(Math.random()*100)
    const cryptoName2 = crypto.randomBytes(16).toString('hex')
    const randomNumber2 = Math.round(Math.random()*100)

    describe('saveQuestion', () => {
      it('should respond in a correct format', async () => {
        const resp = await saveQuestion({ name: cryptoName, age: randomNumber })
        expect(resp).to.have.keys(['ok', 'id', 'rev'])
        expect(resp.ok).to.be.equal(true)
        expect(resp.id).to.match(/^[0-9a-f]{1,}$/)
        expect(resp.rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)
        id = resp.id
        rev = resp.rev
      })
    })
  
    describe('getAllQuestionIds', () => {
      it('should respond in correct format', async () => {
  
        const resp = await getAllQuestionIds()
        expect(resp).to.have.keys(['total_rows', 'offset', 'rows'])
        expect(resp.total_rows).to.be.greaterThan(0)
        expect(resp.rows).to.be.an('array')
        for (const row of resp.rows){
          expect(row).to.have.keys(['id', 'key', 'value'])
          expect(row.id).to.match(/^[0-9a-f]{1,}$/)
          expect(row.key).to.match(/^[0-9a-f]{1,}$/)
        }
      })
    })
  
    describe('getQuestion', () => {
      it('should respond in correct format', async () => {
        if (!id) throw new Error(`id was not defined`)
        const resp = await getQuestion({ id })
        expect(resp).to.have.keys(['_id', '_rev', 'name', 'age'])
        expect(resp._id).to.match(/^[0-9a-f]{1,}$/)
        expect(resp._rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)
        expect(resp.name).to.equal(cryptoName)
        expect(resp.age).to.equal(randomNumber)
      })
    })
  
    describe('updateQuestion', () => {
      it('should update the question', async () => {
        const resp = await updateQuestion({ 
          id,
          name: cryptoName2,
          age: randomNumber2,
          _rev: rev // _rev is necessary for couchdb for update
        })
        
        expect(resp).to.have.keys(['ok', 'id', 'rev'])
        expect(resp.id).to.match(/^[0-9a-f]{1,}$/)
        expect(resp.rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)
        rev = resp.rev
      })
    })
  
    describe('deleteQuestion', () => {
      it('should respond in correct format', async () => {
        if (!rev) throw new Error(`rev was not defined`)
        const resp = await deleteQuestion({ id, rev })
        expect(resp).to.have.keys(['ok', 'id', 'rev'])
        expect(resp.ok).to.be.equal(true)
        expect(resp.id).to.match(/^[0-9a-f]{1,}$/)
        expect(resp.rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)
      })
      it('should delete the document', async () => {
        try {
          await getQuestion({ id })
          assert(false, 'getQuestion should fail after deletion')
        } catch (e) {
          assert(true)
        }
      })

    })
  })

  describe('categories CRUD', () => {
    
    let id, rev
    const cryptoName = crypto.randomBytes(16).toString('hex')
    const randomNumber = Math.round(Math.random()*100)
    const cryptoName2 = crypto.randomBytes(16).toString('hex')
    const randomNumber2 = Math.round(Math.random()*100)

    describe('createNewCategory', () => {
      
      it('should respond in correct format', async () => {
        const resp = await createNewCategory({ name: cryptoName, desc: randomNumber })
        expect(resp).to.have.keys(['ok', 'id', 'rev'])
        expect(resp.ok).to.be.equal(true)
        expect(resp.id).to.match(/^[0-9a-f]{1,}$/)
        expect(resp.rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)
        id = resp.id
        rev = resp.rev
      })
    })

    describe('getCategoryInfo', () => {
      it('should respond in correct format', async () => {
        const resp = await getCategoryInfo({ id })
        expect(resp).to.have.keys(['_id', '_rev', 'name', 'desc', 'parentId', 'children'])
        expect(resp.children).to.be.an('array')
        expect(resp._id).to.match(/^[0-9a-f]{1,}$/)
        expect(resp._rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)
        expect(resp.name).to.equal(cryptoName)
        expect(resp.desc).to.equal(randomNumber)
        expect(resp.parentId).to.equal(null)
      })
    })

    describe('updateCategory', () => {
      it('should respond in correct format', async () => {
        const resp = await updateCategory({ id, _rev: rev, name: cryptoName2, desc: randomNumber2 })

        expect(resp).to.have.keys(['ok', 'id', 'rev'])
        expect(resp.id).to.match(/^[0-9a-f]{1,}$/)
        expect(resp.rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)
        rev = resp.rev
      })

      it('should have updated the entry', async () => {
        const resp = await getCategoryInfo({ id })
        expect(resp).to.have.keys(['_id', '_rev', 'name', 'desc', 'children'])
        expect(resp._id).to.match(/^[0-9a-f]{1,}$/)
        expect(resp._rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)
        expect(resp.name).to.equal(cryptoName2)
        expect(resp.desc).to.equal(randomNumber2)
      })
    })

    describe('deleteCategory', () => {
      it('should respond in correct format', async () => {
        if (!rev) throw new Error(`rev was not defined`)
        const resp = await deleteCategory({ id, rev })
        expect(resp).to.have.keys(['ok', 'id', 'rev'])
        expect(resp.ok).to.be.equal(true)
        expect(resp.id).to.match(/^[0-9a-f]{1,}$/)
        expect(resp.rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)
      })
      it('should delete the document', async () => {
        try {
          await getCategoryInfo({ id })
          assert(false, 'deleteCategory should fail after deletion')
        } catch (e) {
          assert(true)
        }
      })
    })
  })

  describe('categorisation CRUD', () => {
    let questionId, categoryId, linkId,
      questionRev, categoryRev, linkRev

    before(async () => {
      const { id: qId, rev: qRev } = await saveQuestion({ name: '', age: 1 })
      const { id: cId, rev: cRev } = await createNewCategory({ name: '', desc: 33 })
      questionId = qId
      questionRev = qRev
      
      categoryId = cId
      categoryRev = cRev

    })
    after(async () => {
      await deleteQuestion({ id: questionId, rev: questionRev })
      await deleteCategory({ id: categoryId, rev: categoryRev })
    })

    describe('categoriseQuestion', () => {

      it('should form the link', async () => {
        const resp = await categoriseQuestion({ id: questionId }, { id: categoryId })

        expect(resp).to.have.keys(['ok', 'id', 'rev'])
        expect(resp.ok).to.be.equal(true)
        expect(resp.id).to.match(/^[0-9a-f]{1,}$/)
        expect(resp.rev).to.match(/^[0-9]{1,}\-[0-9a-f]{1,}$/)

        linkId = resp.id
        linkRev = resp.rev
      })

      it('attempt to form an additional link should throw error', async () => {
        try {
          await categoriseQuestion({ id: questionId }, { id: categoryId })
          assert(false, 'attempt to form an additional link did not throw error')
        }catch(e) {
          assert(true)
        }
      })
    })

    describe('getAllCategoriesFromQuestionId', () => {
      it('should fetch the newly formed link', async () => {
        const { docs } = await getAllCategoriesFromQuestionId({ questionId })
        for (const doc of docs){
          expect(doc).to.have.keys(['_id', '_rev', 'name', 'desc', 'parentId'])
        }
        expect(docs.map(({ _id }) => _id)).to.contain.members([categoryId])
      })
    })

    describe('getAllQuestionsFromCategoryId', () => {
      it('should fetch the newly formed link', async () => {
        const { docs } = await getAllQuestionsFromCategoryId({ id: categoryId })
        for (const doc of docs){
          expect(doc).to.have.keys(['_id', '_rev', 'name', 'age'])
        }
        expect(docs.map(({ _id }) => _id)).to.contain.members([questionId])
      })
    })

    describe('uncategorise', () => {

    })
  })

  describe('complex interactions', () => {
    describe('deleting question should also delete all links formed', () => {
      let categoryName, questionName,
        categoryId, categoryRev,
        questionId, questionRev,
        question2Id, question2Rev,
        linkId, linkRev,
        link2Id, link2Rev
      before(async () => {
        categoryName = crypto.randomBytes(16).toString('hex')
        const { id: cId, rev: cRev } = await createNewCategory({ name: categoryName, desc: 13 })
        categoryId = cId
        categoryRev = cRev

        questionName = crypto.randomBytes(16).toString('hex')
        const { id: qId, rev: qRev } = await saveQuestion({ name: questionName, age: 33 })
        questionId = qId
        questionRev = qRev

        question2Name = crypto.randomBytes(16).toString('hex')
        const { id: q2Id, rev: q2Rev } = await saveQuestion({ name: question2Name, age: 55 })
        question2Id = q2Id
        question2Rev = q2Rev

        const { id: lId, rev: lRev } = await categoriseQuestion({ id: questionId }, { id: categoryId })
        linkId = lId
        linkRev = lRev
        
        const { id: l2Id, rev: l2Rev } = await categoriseQuestion({ id: question2Id }, { id: categoryId })
        link2Id = l2Id
        link2Rev = l2Rev
      })

      after(async () => {
        
      })

      it('linked question can be queried', async () => {
        const { docs } = await getAllQuestionsFromCategoryId({ id: categoryId })
        const docIds = docs.map(({ _id }) => _id)
        expect(docIds).contain.members([questionId, question2Id])
        const docNames = docs.map(({ name }) => name)
        expect(docNames).contain.members([ questionName, question2Name ])
        expect(docs).to.have.length(2)
      })

      it('upon question deletion, link should be also deleted', async () => {
        await deleteQuestion({ id: questionId, rev: questionRev })

        const { docs } = await getAllQuestionsFromCategoryId({ id: categoryId })

        const docIds = docs.map(({ _id }) => _id)
        expect(docIds).contain.members([question2Id])
        const docNames = docs.map(({ name }) => name)
        expect(docNames).contain.members([ question2Name ])
        expect(docs).to.have.length(1)

      })

      it('upon category deletion, link should be also deleted', async () => {

        const { docs:pDocs } = await getAllCategoriesFromQuestionId({ id: question2Id })
        expect(pDocs).to.have.length(1)

        await deleteCategory({ id: categoryId, rev: categoryRev })

        const { docs } = await getAllCategoriesFromQuestionId({ id: question2Id })
        expect(docs).to.have.length(0)
      })
    })

    describe('categories hierarchy', () => {
      let categoryId, categoryRev,
        category2Id, category2Rev,
        fetchedCategory
      before(async () => {
        const {id: id1, rev: rev1} = await createNewCategory({ name: '', desc: 11 })
        categoryId = id1
        categoryRev = rev1

        const {id: id2, rev: rev2} = await createNewCategory({ name: '', desc: 11 }, { id: categoryId })
        category2Id = id2
        category2Rev = rev2
        
        fetchedCategory = await getCategoryInfo({ id: categoryId })
      })

      it('fetching parent hierarchy should populate children', async () => {
        expect(fetchedCategory).to.have.keys(['_id', '_rev', 'name', 'desc', 'parentId', 'children'])
        expect(fetchedCategory.children).to.be.an('array')
        expect(fetchedCategory.children).to.have.length(1)
      })

      it('the children nodes does not have children field populated', () => {
        expect(fetchedCategory.children[0]).to.have.keys(['_id', '_rev', 'name', 'desc', 'parentId'])
      })

      it('deleting parent hierarchy should result in deleting children hierarchy', async () => {
        await deleteCategory({ id: categoryId, rev: categoryRev })
        try {
          await getCategoryInfo({ id: category2Id })
          assert(false, 'deleting parent hierarchy did not result in deletion of child hierarchy')
        } catch (e) {
          assert(true)
        }
      })
    })
  })
})
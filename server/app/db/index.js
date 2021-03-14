const USE_DB = process.env.USE_DB

const {
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
} = require('./couchdb')

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

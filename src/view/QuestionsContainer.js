import { Question } from '../components/Question'
import React, { useEffect, useState } from 'react'
import CircularProgress from '@material-ui/core/CircularProgress'
import { BACKENDURL } from '../util'

const allQUrl = `${BACKENDURL}/api/questions/`

const getAllQuestionsUnderCategory = ({ id, _id }) => new Promise((rs, rj) => {
  const categoryId = _id || id
  fetch(`${BACKENDURL}/api/categories/${categoryId}/questions`)
    .then(res => res.json())
    .then(rs)
    .catch(rj)
})

export const QuestionsContainer = ({ categoryFilters = [] } = { categoryFilters: [] }) => {

  const [fetchingInProgress, setFetchingInProgress] = useState(false)
  const [questions, setQuestions] = useState([])

  const updateQuestions = () => {
    setFetchingInProgress(true)
    const fetchPr = categoryFilters.length === 0
      ? fetch(allQUrl).then(res => res.json())
      : Promise.all(
          categoryFilters.map(getAllQuestionsUnderCategory)
        ).then(arrOfArr => arrOfArr.reduce((acc, curr) => acc.concat(curr), []))
    
    fetchPr
      .then(setQuestions)
      .then(() => setFetchingInProgress(false))
      .catch(console.error)
  }

  useEffect(updateQuestions, [ categoryFilters ])

  return <>
  {
    fetchingInProgress
      ? <CircularProgress />
      : questions.slice(0, 20).map(q => <div key={q.id} className="mb-1">
          <Question
            renderMeta={true}
            question={q} />
        </div>)
  }
  </>
}
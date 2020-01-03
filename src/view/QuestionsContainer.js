import { Question } from '../components/Question'
import React, { useEffect, useState } from 'react'
import CircularProgress from '@material-ui/core/CircularProgress'

const BACKENDURL = process.env.BACKENDURL || 'http://localhost:3001'
const allQUrl = `${BACKENDURL}/api/questions/`

export const QuestionsContainer = () => {

  const [fetchingInProgress, setFetchingInProgress] = useState(false)
  const [questions, setQuestions] = useState([])

  const updateQuestions = () => {
    setFetchingInProgress(true)
    fetch(allQUrl)
      .then(res => res.json())
      .then(setQuestions)
      .then(() => setFetchingInProgress(false))
      .catch(console.error)
  }

  useEffect(updateQuestions, [])

  return <>
  {
    fetchingInProgress
      ? <CircularProgress />
      : questions.map(q => <div key={q.id} className="mb-1">
          <Question
            renderMeta={true}
            question={q} />
        </div>)
  }
  </>
}
import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent } from '@material-ui/core'
import { BACKENDURL } from '../util'

const questionUrl = `${BACKENDURL}/api/questions`

export const QuestionPreview = ({ question }) => {

  const {
    question: questionText,
    questionHtml,
    answer,
    answerHtml,
    id,
    ...rest
  } = question

  const [ stateFetchingInProgress, setStateFetchingInProgress ] = useState(false)
  const [ stateId, setStateId ] = useState(id)

  const [ stateQuestionText, setStateQuestionText ] = useState(questionText)
  const [ stateAnswerText, setStateAnswerText ] = useState(answer)
  const [ stateQuestionHtml, setStateQuestionHtml ] = useState(questionHtml)
  const [ stateAnswerHtml, setStateAnswerHtml ] = useState(answerHtml)

  const updateQuestion = ({
    question,
    questionHtml,
    answer,
    answerHtml,
    id,
    ...rest
  }) => {
    if(id) setStateId(id)
    setStateAnswerText(answer)
    setStateQuestionText(question)
    setStateQuestionHtml(questionHtml)
    setStateAnswerHtml(answerHtml)
  }

  // on init, if question and answer not populated, fetch it

  useEffect(() => {
    if (!stateId) return
    if (!!stateQuestionText || stateQuestionText === '') return
    if (!!stateAnswerText || stateAnswerText === '') return
    setStateFetchingInProgress(true)
    fetch(`${questionUrl}/${stateId}?renderMarkdown=true`)
      .then(res => res.json())
      .then(updateQuestion)
      .catch(console.error)
      .finally(() => setStateFetchingInProgress(false))
  }, [ stateId ])

  return <Card>
    <CardHeader title="Preview" />
    <CardContent>
      {/*
        NB
        this this relies on backend to sanitize parsed markdown
      */}
      <div dangerouslySetInnerHTML={{__html: stateQuestionHtml}}></div>
    </CardContent>
  </Card>
}
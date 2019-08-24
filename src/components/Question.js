import React, { useState, useEffect } from 'react'
import { RenderMarkup } from './RenderMarkup'
import Chip from '@material-ui/core/Chip'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import { UserContext } from '../context/User'
import { getFetchHeader } from '../util'

const BACKENDURL = process.env.BACKENDURL || 'http://localhost:3001'
const getGetCategoriseUrl = ({ questionId }) => `${BACKENDURL}/api/categorise/questionId/${questionId}`
const getPutDeleteCategoriseUrl = ({ categoryId }) => `${BACKENDURL}/api/categorise/categoryId/${categoryId}`
const questionUrl = `${BACKENDURL}/api/questions`
/**
 * As this component may need to listen to socket message, it may not be suitable as a functional component
 */

export const Question = ({ question, renderMeta }) => {

  const { question: questionText, answer, id } = question

  const [ stateQuestionText, setStateQuestionText ] = useState(questionText)
  const [ stateAnswerText, setStateAnswerText ] = useState(answer)
  const [ stateId, setStateId ] = useState(id)

  /**
   * UPDATE the question itself
   */

  const valueChangeHandler = ({previous, current}, mode) => {
    if (previous === current) return
    const questionToBeSaved = {
      id: stateId,
      question: mode === 'question' ? current : stateQuestionText,
      answer: mode === 'answer' ? current : stateAnswerText
    }

    fetch(`${questionUrl}/${stateId ? stateId : ''}`, {
      method: stateId ? 'PUT' : 'POST',
      headers: getFetchHeader(),
      body: JSON.stringify(questionToBeSaved)
    })
      .then(res => res.json())
      .then(({ question, answer, id }) => {
        setStateId(id)
        setStateAnswerText(answer)
        setStateQuestionText(question)
      })
      .catch(console.error)
  }

  const [ categories, setCategories ] = useState([])

  const updateCategory = () => {
    if (!stateId) return
    fetch(getGetCategoriseUrl({ questionId: stateId }))
      .then(res => res.json())
      .then(arr =>setCategories(arr))
      .catch(console.error)
  }

  useEffect(updateCategory, [])

  const onCategoryDeleteHandler = (ev, category) => {
    const { id: categoryId } = category
    fetch(getPutDeleteCategoriseUrl({ categoryId }), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ id }])
    })
      .then(updateCategory)
      .catch(console.error)
  }

  const getEditable = user => user && user.admin && user.admin > 1
  return <UserContext.Consumer>
    {user => <Card>
      <CardContent>

        <RenderMarkup
          valueChangeHandler={event => valueChangeHandler(event, 'question')}
          markup={stateQuestionText}
          editable={getEditable(user)}/>

        <Divider />

        <RenderMarkup
          valueChangeHandler={event => valueChangeHandler(event, 'answer')}
          markup={stateAnswerText} 
          editable={getEditable(user)}/>

      </CardContent>
      {
        renderMeta
          ? <>
            <Divider />
            <CardActions>
              <Button>
                + add
              </Button>
              {categories.map(c => (
                <Chip
                  onDelete={ev => onCategoryDeleteHandler(ev, c)}
                  key={c.id}
                  label={c.name} />))}
            </CardActions>
            </>
          : null
      }
    </Card>}
  </UserContext.Consumer>
}
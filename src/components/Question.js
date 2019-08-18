import React, { useState, useEffect } from 'react'
import { RenderMarkup } from './RenderMarkup'
import Chip from '@material-ui/core/Chip'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import { UserContext } from '../context/User'

const BACKENDURL = process.env.BACKENDURL || 'http://localhost:3001'
const getGetCategoriseUrl = ({ questionId }) => `${BACKENDURL}/routes/categorise/questionId/${questionId}`
const getPutDeleteCategoriseUrl = ({ categoryId }) => `${BACKENDURL}/routes/categorise/categoryId/${categoryId}`
/**
 * As this component may need to listen to socket message, it may not be suitable as a functional component
 */

export const Question = ({ question, renderMeta, onQuestionUpdate }) => {

  const { question: questionText, answer, id } = question

  /**
   * UPDATE the question itself
   */
  const valueChangeHandler = ({previous, current}, mode) => {
    if (previous === current) return
    onQuestionUpdate({
      id,
      question: mode === 'question' ? current : questionText,
      answer: mode === 'answer' ? current : answer
    })
  }

  const [ categories, setCategories ] = useState([])

  const updateCategory = () => {
    fetch(getGetCategoriseUrl({ questionId: id }))
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
          markup={questionText}
          editable={getEditable(user)}/>

        <Divider />

        <RenderMarkup
          valueChangeHandler={event => valueChangeHandler(event, 'answer')}
          markup={answer} 
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
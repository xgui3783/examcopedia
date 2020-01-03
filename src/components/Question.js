import React, { useState, useEffect } from 'react'
import { RenderMarkup } from './RenderMarkup'
import Chip from '@material-ui/core/Chip'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import Modal from '@material-ui/core/Modal'
import Backdrop from '@material-ui/core/Backdrop'
import Button from '@material-ui/core/Button'
import Fade from '@material-ui/core/Fade'
import Divider from '@material-ui/core/Divider'
import { UserContext } from '../context/User'
import { getFetchHeader } from '../util'

import { Syllabus } from './Syllabus'
import { QuestionContext } from '../context/QuestionContext'

import CircularProgress from '@material-ui/core/CircularProgress'

const BACKENDURL = process.env.BACKENDURL || 'http://localhost:3001'
const getGetCategoriesUrl = ({ questionId }) => `${BACKENDURL}/api/categories/questionId/${questionId}`
const getPutDeleteCategoriesUrl = ({ categoryId }) => `${BACKENDURL}/api/categories/categoryId/${categoryId}`
const questionUrl = `${BACKENDURL}/api/questions`
/**
 * As this component may need to listen to socket message, it may not be suitable as a functional component
 */

export const Question = ({ question, renderMeta }) => {

  const { question: questionText, answer, id } = question

  const [ stateQuestionText, setStateQuestionText ] = useState(questionText)
  const [ stateAnswerText, setStateAnswerText ] = useState(answer)
  const [ stateId, setStateId ] = useState(id)
  const [ modalOpen, setModalOpen ] = useState(false)

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
  const [ fetchingCategories, setFetchCategories ] = useState(false)

  const updateCategory = () => {
    if (!stateId) return
    setFetchCategories(true)
    fetch(getGetCategoriesUrl({ questionId: stateId }))
      .then(res => res.json())
      .then(setCategories)
      .then(() => setFetchCategories(false))
      .catch(console.error)
  }

  useEffect(updateCategory, [])

  const onCategoryDeleteHandler = (ev, category) => {
    const { id: categoryId } = category
    fetch(getPutDeleteCategoriesUrl({ categoryId }), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ id }])
    })
      .then(updateCategory)
      .catch(console.error)
  }

  const handleModalClose = () => {
    setModalOpen(false)
  }

  const handleModalOpen = () => {
    setModalOpen(true)
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
              <Button onClick={handleModalOpen}>
                + add
              </Button>
              <Modal
                onClose={handleModalClose}
                closeAfterTransition
                className="d-flex align-items-center justify-content-center"
                BackdropComponent={Backdrop}
                BackdropProps={{timeout: 500}}
                open={modalOpen}>
                <Fade in={modalOpen}>
                  <QuestionContext.Provider value={{id: stateId, categorisedUnder: categories}}>
                    <div className="w-80vw mh-90vh overflow-auto">
                      <Syllabus />
                    </div>
                  </QuestionContext.Provider>
                </Fade>
              </Modal>
              {fetchingCategories
                ? <CircularProgress />
                : null
              }
              {categories.map(c => (
                <Chip
                  color={fetchingCategories ? 'default' : 'primary'}
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
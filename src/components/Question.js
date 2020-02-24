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
import { BtnModal } from './BtnModal'

import { Syllabus } from './Syllabus'
import { SyllabusContext } from '../context/SyllabusContex'

import CircularProgress from '@material-ui/core/CircularProgress'

const BACKENDURL = process.env.BACKENDURL || 'http://localhost:3001'
const getGetCategoriesUrl = ({ questionId }) => `${BACKENDURL}/api/categories/questionId/${questionId}`
const getPutDeleteCategoriesUrl = ({ categoryId, questionId }) => `${BACKENDURL}/api/categories/questionId/${questionId}/categoryId/${categoryId}`
const questionUrl = `${BACKENDURL}/api/questions`
const dotpointUrl = `${BACKENDURL}/api/categories`

/**
 * As this component may need to listen to socket message, it may not be suitable as a functional component
 */

export const Question = ({ question, renderMeta }) => {

  const { question: questionText, answer, id, ...rest } = question

  const [ stateFetchingInProgress, setStateFetchingInProgress ] = useState(false)
  const [ stateQuestionText, setStateQuestionText ] = useState(questionText)
  const [ stateAnswerText, setStateAnswerText ] = useState(answer)
  const [ stateId, setStateId ] = useState(id)
  const [ stateRest, setStateRest ] = useState(rest)

  const updateQuestion = ({ question, answer, id, ...rest }) => {
    if(id) setStateId(id)
    setStateRest(rest)
    setStateAnswerText(answer)
    setStateQuestionText(question)
  }

  // on init, if question an answer not populated, fetch it

  useEffect(() => {
    if (!stateId) return
    if (!!stateQuestionText || stateQuestionText === '') return
    if (!!stateAnswerText || stateAnswerText === '') return
    setStateFetchingInProgress(true)
    fetch(`${questionUrl}/${stateId}`)
      .then(res => res.json())
      .then(updateQuestion)
      .catch(console.error)
      .finally(() => setStateFetchingInProgress(false))
  }, [])

  /**
   * UPDATE the question itself
   */

  const valueChangeHandler = ({previous, current}, mode) => {
    if (previous === current) return
    const questionToBeSaved = {
      ...stateRest,
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
      .then(updateQuestion)
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
    const { id: cId, _id } = category
    const categoryId = _id || cId
    fetch(getPutDeleteCategoriesUrl({ categoryId, questionId: id }), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(updateCategory)
      .catch(console.error)
  }

  const getToggleFn = currentState => ({ id: cId, _id: c_id }) =>  {
    const categoryId = c_id || cId
    fetch(`${dotpointUrl}/questionId/${id}/categoryId/${categoryId}`, {
      method: currentState ? 'DELETE' : 'POST'
    })
      .catch(e => {
        console.error(`adding or removing dot point error`, e)
      })
      .finally(() => {
        updateCategory()
      })
  }

  const getEditable = user => user && user.admin && user.admin > 1
  return <UserContext.Consumer>
    {user => <Card>
      {
        stateFetchingInProgress
          ? <CircularProgress />
          : <CardContent>
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
      }
      {
        renderMeta
          ? <>
            <Divider />
            <CardActions>
              <BtnModal
                button={<Button>+ add</Button>}
                modal={
                  <SyllabusContext.Provider value={{checked: categories, check: getToggleFn(false), uncheck: getToggleFn(true)}}>
                    <div className="w-80vw mh-90vh overflow-auto">
                      <Syllabus />
                    </div>
                  </SyllabusContext.Provider>
                  }
                />
              {fetchingCategories
                ? <CircularProgress />
                : null
              }
              {categories.map(c => (
                <Chip
                  color={fetchingCategories ? 'default' : 'primary'}
                  onDelete={ev => onCategoryDeleteHandler(ev, c)}
                  key={c._id}
                  label={c.name} />))}
            </CardActions>
            </>
          : null
      }
    </Card>}
  </UserContext.Consumer>
}
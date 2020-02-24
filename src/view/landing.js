import React, { useEffect, useState } from 'react'

import { Question } from '../components/Question'
import { QuestionsContainer } from '../view/QuestionsContainer'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Divider from '@material-ui/core/Divider'
import Grid from '@material-ui/core/Grid'
import Container from '@material-ui/core/Container'
import Button from '@material-ui/core/Button'
import { BtnModal } from '../components/BtnModal'
import { Syllabus } from '../components/Syllabus'
import { SyllabusContext } from '../context/SyllabusContex'
import Chip from '@material-ui/core/Chip'

export const MaterialLandingPage = () => {
  const [newQuestions, setNewQuestoins] = useState([])
  const [categoryFilters, setCategoryFilters] = useState([])

  const addNew = () => {
    setNewQuestoins(newQuestions.concat({
      question: '',
      answer: ''
    }))
  }

  const handleToggleCheckFilter = prevStateChecked => ({ id, _id, ...rest }) => {
    const categoryId = _id || id
    if (prevStateChecked) {
      setCategoryFilters(categoryFilters.filter(({ id: cId, _id: c_id }) => (c_id || cId) !== categoryId ))
    } else {
      setCategoryFilters(
        categoryFilters.concat({ id: categoryId, ...rest })
      )
    }
  }

  return <Container>
  <Grid container justify="center" spacing={2}>
    <Grid item xs={9} s={6} m={4}>
      <Card className="mt-4">
        <CardHeader title="Examcopedia v2.0" />
      </Card>

      <Card className="mt-4">
        <CardContent>

          {/* add filter */}
          <BtnModal
            button={<Button>Filter</Button>}
            modal={
              <SyllabusContext.Provider value={{checked: categoryFilters, check: handleToggleCheckFilter(false), uncheck: handleToggleCheckFilter(true)}}>
                <div className="w-80vw mh-90vh overflow-auto">
                  <Syllabus />
                </div>
              </SyllabusContext.Provider>
              }
            />
          {
            categoryFilters.map(({ name, id, _id }) => (
              <Chip
                onDelete={ev => handleToggleCheckFilter(true)({ id, _id })}
                key={id}
                label={name}/>
            ))
          }
        </CardContent>
      </Card>
      <Card className="mt-4">

        <CardContent>
          <QuestionsContainer categoryFilters={categoryFilters} />
          {
            newQuestions.map((q, idx) => <div key={idx} className="mb-1">
              <Question
                renderMeta={true}
                question={q} />
            </div>)
          }
          <div className="mt-2 mb-2">
            <Button onClick={addNew} color="primary">
              add new
            </Button>
          </div>
          <Divider />
        </CardContent>
      </Card>
    </Grid>
  </Grid>
</Container>
} 
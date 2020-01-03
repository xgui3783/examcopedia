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

export const MaterialLandingPage = () => {
  const [newQuestions, setNewQuestoins] = useState([])


  const addNew = () => {
    setNewQuestoins(newQuestions.concat({
      question: '',
      answer: ''
    }))
  }

  return <Container>
  <Grid container justify="center" spacing={2}>
    <Grid item xs={9} s={6} m={4}>
      <Card>
        <CardHeader title="Examcopedia v2.0" />

        <CardContent>
        <QuestionsContainer />
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
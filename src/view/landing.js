import React, { useEffect, useState } from 'react'

import { Question } from '../components/Question'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Divider from '@material-ui/core/Divider'
import Grid from '@material-ui/core/Grid'
import Container from '@material-ui/core/Container'
import Button from '@material-ui/core/Button'

const BACKENDURL = process.env.BACKENDURL || 'http://localhost:3001'
const allQUrl = `${BACKENDURL}/api/questions/`

export const MaterialLandingPage = () => {
  const [questions, setQuestions] = useState([])
  const [newQuestions, setNewQuestoins] = useState([])

  const updateQuestions = () => {
    fetch(allQUrl)
      .then(res => res.json())
      .then(setQuestions)
      .catch(console.error)
  }

  const addNew = () => {
    setNewQuestoins(newQuestions.concat({
      question: '',
      answer: ''
    }))
  }

  useEffect(updateQuestions, [])
  return <Container>
  <Grid container justify="center" spacing={2}>
    <Grid item xs={9} s={6} m={4}>
      <Card>
        <CardHeader title="Examcopedia v2.0" />

        <CardContent>
          {
            questions.map(q => <div key={q.id} className="mb-1">
              <Question
                renderMeta={true}
                question={q} />
            </div>)
          }
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
import React from 'react'

import { Question } from '../components/Question'
import { Syllabus } from '../components/Syllabus'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Divider from '@material-ui/core/Divider'
import Grid from '@material-ui/core/Grid'
import Container from '@material-ui/core/Container'

const obj = {
  name: 'root',
  children: [{
    name: 'c1'
  },{
    name: 'c2'
  }]
}

const question = {
  id: 'testid',
  question: 'hello world',
  answer: 'rabbit jimmy 2'
}

const onQuestionUpdate = ({ id, question, answer }) => {
  console.log({
    id,
    question,
    answer
  })
}

export const MaterialLandingPage = () => <Container>
    <Grid container justify="center" spacing={2}>
      <Grid item xs={9} s={6} m={4}>
        <Card>
          <CardHeader title="Examcopedia v2.0" />

          <CardContent>
            <Question
              renderMeta={true}
              question={question}
              onQuestionUpdate={onQuestionUpdate} />
            <Divider />
            <Syllabus lvl={0} syllabus={obj} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Container>
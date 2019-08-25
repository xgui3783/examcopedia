import React, { useState, useEffect } from 'react'
import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import Button from '@material-ui/core/Button'
import { UserContext } from '../context/User'
import { DotPoints } from './DotPoint'
import { RenderMarkup } from './RenderMarkup'
import { getFetchHeader } from '../util';
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelDetail from '@material-ui/core/ExpansionPanelDetails'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import Typography from '@material-ui/core/Typography'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'

// TODO use arango for syllabus
// one way edge for hierarchy description

const BACKENDURL = process.env.BACKENDURL || 'http://localhost:3001'
const dotpointUrl = `${BACKENDURL}/api/categories`

export const Syllabus = ({selected = [], onToggle, onClick} = {}) => {
  // use effect to retrieve next hiearchy

  // nested Syllabus, instead of div element

  // hover to add / remove syllabus dot points

  // show warning, deleting branch delete all children nodes (and questions that gets unlinked)

  // hover also allow for rename

  const [rootSyllabi, setRootSyllabi] = useState([])
  const [renderMarkupKey, setRenderMarkupKgy] = useState(new Date().toString())
  const [focusedSyllabus, setFocusedSyllabus] = useState(null)

  /**
   * use effect must either return null or function. cannot return promise
   */
  const updateRootSyllabus = () => fetch(`${dotpointUrl}/`)
    .then(res => res.json())
    .then(setRootSyllabi)
    .catch(console.error) && setRenderMarkupKgy(new Date().toString())

  useEffect(updateRootSyllabus, [])

  const handleNewRootDotPoint = ({ previous, current }) => {
    if (current === previous || current === '') return
    fetch(`${dotpointUrl}/`, {
      method: 'POST',
      headers: getFetchHeader(),
      body: JSON.stringify({
        name: current
      })
    })
      .then(updateRootSyllabus)
      .catch(console.error)
  }

  const handleToggleSyllabus = id => (ev, isExpanded) => setFocusedSyllabus(isExpanded ? id : null)

  return <UserContext.Consumer>
    {user => <Card>
      <CardHeader title="Available Syllabi" />
      <CardContent>
        {
          rootSyllabi.map(s => <ExpansionPanel
            TransitionProps={{unmountOnExit:true}}
            expanded={focusedSyllabus === s.id}
            onChange={handleToggleSyllabus(s.id)}
            key={s.id}>
            <ExpansionPanelSummary>
              <Typography>
                {s.name}
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetail>
              <List className="w-100">
                <DotPoints parentId={s.id} />
              </List>
            </ExpansionPanelDetail>
          </ExpansionPanel>)
        }
        <List>
          <ListItem className="w-100">
            <RenderMarkup key={renderMarkupKey} valueChangeHandler={handleNewRootDotPoint} />
          </ListItem>
        </List>
      </CardContent>
    </Card>}
  </UserContext.Consumer>
}
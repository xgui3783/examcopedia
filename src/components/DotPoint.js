import React, { useState, useEffect } from 'react'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import IconButton from '@material-ui/core/IconButton'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import CheckBox from '@material-ui/core/Checkbox'
import { RenderMarkup } from './RenderMarkup'
import { getFetchHeader, populateKeyProp } from '../util';
import Collapse from '@material-ui/core/Collapse'
import { QuestionContext } from '../context/QuestionContext'

import CircularProgress from '@material-ui/core/CircularProgress'

// TODO use arango for syllabus
// one way edge for hierarchy description

const BACKENDURL = process.env.BACKENDURL || 'http://localhost:3001'
const dotpointUrl = `${BACKENDURL}/api/categories`

const DotPointLetListItemChildren = ({ id, isOpen }) => <Collapse
    key={`${id}-children`}
    in={isOpen}
    timeout="auto"
    unmountOnExit>
    <ListItemText inset>
      <DotPoints parentId={id} />
    </ListItemText>
  </Collapse>

const DotPointLetListItem = ({ name, id, toggleCollapse, isOpen }) => {

  const [formingLink, setFormingLink] = useState(false)

  const getHandleToggleCheckBox = ({ contextId, id }) => ev => {
    const { target = {} } = ev
    const { checked } = target
    if (checked === null || typeof checked === 'undefined') return console.error(`handleCheckboxToggle Error. ev.target.checked is undefined`)

    /**
     * truthy, form the link
     */

    setFormingLink(true)
    fetch(`${dotpointUrl}/questionId/${contextId}/categoryId/${id}`, {
      method: !!checked ? 'POST' : 'DELETE'
    })
      .then(() => setFormingLink(false))
      .catch(console.error)
  }

  const isCategorised = arr => arr.findIndex(({ id: _id }) => id === _id) >= 0
  return <ListItem
    button
    key={id}>
    {/* toggle children */}
    <ListItemIcon>
      <IconButton onClick={toggleCollapse}>
        <i className={(isOpen ? '' : 'r-270') + ' animate fas fa-chevron-down'}></i>
      </IconButton>
    </ListItemIcon>

    {/* name */}
    <ListItemText primary={name} />

    {/* checkbox */}
    <ListItemSecondaryAction>
      <QuestionContext.Consumer>
        {({ categorisedUnder, id: contextId }) => formingLink
          ? <CircularProgress />
          : <CheckBox
              checked={isCategorised(categorisedUnder)}
              onChange={getHandleToggleCheckBox({ contextId, id })} />}
      </QuestionContext.Consumer>
    </ListItemSecondaryAction>
  </ListItem>
} 

/**
 * pass the parent id, find all children
 */
export const DotPoints = ({ parentId }) => {

  const [ dotPointArray, setDotPointArray ] = useState([])
  const [ newDpKey, setNewDpKey ] = useState(new Date().toString())
  const [ openSet, setOpenSet ] = useState(new Set())
  const [ fetchChildrenInProgress, setFetchChildrenInProgress ] = useState(false)

  const updateDotpoint = () => {
    setFetchChildrenInProgress(true)
    fetch(`${dotpointUrl}/${parentId}`)
      .then(res => res.json())
      .then(({children}) => children.map(populateKeyProp))
      .then(setDotPointArray)
      .then(() => setFetchChildrenInProgress(false))
      .catch(console.error)
  }

  useEffect(updateDotpoint, [])

  const getHandleToggleCollapse = id => () => {
    openSet.has(id)
      ? openSet.delete(id)
      : openSet.add(id)
    setOpenSet(new Set(openSet))
  }

  const addNewDotPoint = ({ previous, current }) => {
    setNewDpKey(new Date().toString())
    if (previous === current || !current || current === '') return
    fetch(`${dotpointUrl}/`, {
      method: 'POST',
      headers: getFetchHeader(),
      body: JSON.stringify({
        parent: {id: parentId},
        name: current
      })
    })
      .then(updateDotpoint)
      .catch(console.error)
  }

  return <>{
    fetchChildrenInProgress
      ? <CircularProgress />
      : <> 
        {dotPointArray.map(({name, key: id}) => <React.Fragment key={id}>
          <DotPointLetListItem
            id={id}
            name={name}
            toggleCollapse={getHandleToggleCollapse(id)}
            isOpen={openSet.has(id)}/>
          <DotPointLetListItemChildren
            id={id}
            name={name}
            isOpen={openSet.has(id)}/>
        </React.Fragment>)}
        <ListItem>
          <ListItemText inset>
            <RenderMarkup
              key={newDpKey}
              valueChangeHandler={addNewDotPoint} />
          </ListItemText>
        </ListItem>
      </>
  }
  </> 
}
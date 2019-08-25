import React, { useState, useEffect } from 'react'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import IconButton from '@material-ui/core/IconButton'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import CheckBox from '@material-ui/core/Checkbox'
import { RenderMarkup } from './RenderMarkup'
import { getFetchHeader } from '../util';
import Collapse from '@material-ui/core/Collapse'
import { QuestionContext } from '../context/QuestionContext'

// TODO use arango for syllabus
// one way edge for hierarchy description

const BACKENDURL = process.env.BACKENDURL || 'http://localhost:3001'
const dotpointUrl = `${BACKENDURL}/api/categories`

const getChildren = ({ id, isOpen }) => <Collapse
    key={`${id}-children`}
    in={isOpen}
    timeout="auto"
    unmountOnExit>
    <ListItemText inset>
      <DotPoints parentId={id} />
    </ListItemText>
  </Collapse>

const getListItem = ({ name, id, handleToggleCheckBox, toggleCollapse, isOpen }) => {
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
        {({ categorisedUnder }) => <CheckBox checked={isCategorised(categorisedUnder)} onChange={handleToggleCheckBox} />}
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

  const updateDotpoint = () => {
    fetch(`${dotpointUrl}/${parentId}`)
      .then(res => res.json())
      .then(({children}) => children)
      .then(setDotPointArray)
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
        parent: parentId,
        name: current
      })
    })
      .then(res => res.json())
      .then(updateDotpoint)
      .catch(console.error)
  }

  const getHandleToggleCheckBox = ({ contextId, id }) => ev => {
    const { target = {} } = ev
    const { checked } = target
    if (checked === null || typeof checked === 'undefined') return console.error(`handleCheckboxToggle Error. ev.target.checked is undefined`)
    if (!!checked) {
      /**
       * truthy, form the link
       */
      fetch(`${dotpointUrl}/questionId/${contextId}/categoryId/${id}`, {
        method: 'POST'
      })
        .then(res => res.json())
        /**
         * refresh
         */
        .then(console.log)
        .catch(console.error)
    }
  }

  return <QuestionContext.Consumer>{({ id: contextId }) => <> 
    {dotPointArray.map(({name, id}) => <React.Fragment key={id}>
      {getListItem({ 
        id,
        name,
        handleToggleCheckBox: getHandleToggleCheckBox({ contextId, id }),
        toggleCollapse: getHandleToggleCollapse(id),
        isOpen: openSet.has(id)
      })}
      {getChildren({
        id,
        name,
        isOpen: openSet.has(id)
      })}
    </React.Fragment>)}
    <ListItem>
      <ListItemText inset>
        <RenderMarkup
          key={newDpKey}
          valueChangeHandler={addNewDotPoint} />
      </ListItemText>
    </ListItem>
    </>
  }</QuestionContext.Consumer>
}
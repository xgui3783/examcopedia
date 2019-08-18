import React, { useState } from 'react'


// TODO use arango for syllabus
// one way edge for hierarchy description

export const Syllabus = ({ syllabus, lvl }) => {
  const [collapseState, setCollapseState] = useState(false)
  // use effect to retrieve next hiearchy

  // nested Syllabus, instead of div element

  // hover to add / remove syllabus dot points

  // show warning, deleting branch delete all children nodes (and questions that gets unlinked)

  // hover also allow for rename


  return <>
    <div onClick={() => setCollapseState(!collapseState)}>
      <span className={'fas fa-chevron-down' + (collapseState ? '' : ' fa-rotate-270')}></span>{syllabus.name} {collapseState.toString()}
    </div>
    {
      collapseState && syllabus.children
        ? syllabus.children.map(s => <div key={s.name}>{s.name}</div>)
        : ''
    }
  </>
}
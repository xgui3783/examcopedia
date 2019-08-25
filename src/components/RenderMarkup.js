import React, { useState, createRef, useEffect } from 'react'

const editMarkupStyle = {
  resize: 'none',
  right: 0,
  bottom: 0
}

const EditMarkup = ({ className, markup, onChnageHandler = () => {}, onKeyDownHandler = () => {}, onBlurHandler = () => {} }) => {

  const ref = createRef()
  useEffect(() => {
    if (ref && ref.current) {
      ref.current.focus()
    }
  }, [])

  return <textarea
    className={className}
    ref={ref}
    style={editMarkupStyle}
    onBlur={onBlurHandler}
    onChange={onChnageHandler}
    onKeyDown={onKeyDownHandler}
    defaultValue={markup}/>
}

const RenderTextMarkup = ({ markup, onClickHandler = () => {} }) => markup.replace(/\ /g, '') !== ''
  ? <div onClick={onClickHandler}>{ markup }</div>
  : <div onClick={onClickHandler} className="text-muted font-italics">click here to edit this field</div>

export const RenderMarkup = ({ markup, valueChangeHandler, editable = true, placeholder = 'Click to add an entry.' }) => {
  
  const [editMode, setEditMode] = useState(false)
  const [markupValue, setMarkupValue] = useState(markup)
  const [cachedValue, setCachedValue] = useState(markup)

  const handleOnclick = () => {
    if (editable) {
      setEditMode(true)
    }
  }

  const onBlurHandler = event => {
    // send API call to backend
    setEditMode(false)

    const current = event.target.value
    valueChangeHandler({
      previous: cachedValue,
      current
    })
    
    setCachedValue(current)
  }

  const onChnageHandler = event => {
    setMarkupValue(event.target.value)
  }

  /**
   * ideally should use on change handler
   */
  const onKeyDownHandler = (event = {}) => {
    const { key, ctrlKey } = event
    if ((key === 'Enter' && ctrlKey) || key === 'Esc' || key === 'Escape') {
      onBlurHandler(event)
    }
  }

  // figure out how to do content transclusion

  return <div className="position-relative w-100" onClick={handleOnclick}>
    <div style={{whiteSpace:'pre-line'}} className="position-relative">
      {
        !markupValue || markupValue === ''
          ? <span className="text-muted">{placeholder}</span>
          : (markupValue + '\n')
      }
    </div>
    {
      editMode
        ? <EditMarkup
            className="w-100 h-100 position-absolute border-0 p-0 overflow-hidden"
            onKeyDownHandler={onKeyDownHandler}
            onChnageHandler={onChnageHandler}
            onBlurHandler={onBlurHandler}
            markup={markupValue}/>
        : null
    }
  </div>

  // return <>{
  //   editMode
  //     ? <EditMarkup
  //         onBlurHandler={onBlurHandler}
  //         markup={markupValue}/>
  //     : <RenderTextMarkup
  //         markup={markupValue}
  //         onClickHandler={handleOnclick} />
  // }</>
}
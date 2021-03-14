import React, { useState, createRef, useEffect, forwardRef } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { BACKENDURL } from '../util'

const useStyles = makeStyles({
  editMarkup: {
    resize: 'none',
    right: 0,
    bottom: 0
  },
  peNone: {
    pointerEvents: 'none'
  },
  droppable: {
  },
  draggableOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
    top: 0,
    left: 0,
    opacity: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    transition: 'opacity ease-in-out 300ms',
    '&$draggableActive': {
      opacity: 1.0
    },
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  draggableActive: {}
})

const EditMarkup = forwardRef(
  ({ className, markup, setMarkup = () => {}, onKeyDownHandler = () => {} },
  textareaRef
  
  ) => {

  const classes = useStyles()

  const ref = textareaRef || createRef()
  useEffect(() => {
    if (ref && ref.current) {
      ref.current.focus()
    }
  }, [])

  const [ dragOver, setDragOver ] = useState(false)
  const DEFAULT_DROP_TEXT = `Drop images here`
  const IS_UPLOADING_TEXT = `Uploading image ...`
  const [ dropText, setDropText ] = useState(DEFAULT_DROP_TEXT)
  const [ uploadError, setUploadError ] = useState(null)
  const [ isUploading, setIsUploading ] = useState(false)

  useEffect(() => {
    setDropText(isUploading ? IS_UPLOADING_TEXT : DEFAULT_DROP_TEXT)
    if (!isUploading) setDragOver(false)
  }, [ isUploading ])

  const preventDefault = e => e.preventDefault()
  const handleDrop = ev => {
    ev.preventDefault()

    /**
     * TODO file typecheck
     * fail early if type is not jpg/png
     */
    setIsUploading(true)
    setUploadError(null)

    const currValue = ref.current.value
    const txtArea = ref.current
    
    const formdata = new FormData()
    formdata.append('image', ev.dataTransfer.files[0])
    const array = new Uint32Array(4)
    crypto.getRandomValues(array)
    const imageId = Array.from(array).map(v => v.toString(16)).join('-')
    fetch(`${BACKENDURL}/api/images/${imageId}.png`, {
      method: 'POST',
      body: formdata
    }).then(() => {
        const newValue = `${currValue}\n![image](${BACKENDURL}/api/images/${imageId}.png)`
        txtArea.value = newValue
        setMarkup(newValue)
        setIsUploading(false)
      })
      .catch(e => {
        console.error(`upload error`, e)
        setUploadError(`Upload error: ${e.toString()}`)
      })
  }
  const handleDragEnter = () => {
    setDragOver(true)
  }
  const handleDragLeave = () => {
    setDragOver(false)
  }

  const onChangeHandler = ev => {
    setMarkup(ev.target.value)
  }

  return <>
    <div className={`${classes.peNone} ${classes.draggableOverlay} ${dragOver ? classes.draggableActive : ''}`}>
       {dropText}
    </div>
    <textarea
      className={`${className} ${classes.editMarkup} ${classes.droppable}`}
      ref={ref}
      onChange={onChangeHandler}
      onDrag={preventDefault}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onKeyDown={onKeyDownHandler}
      defaultValue={markup}/>
  </> 
})

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

  /**
   * ideally should use on change handler
   */
  const onKeyDownHandler = (event = {}) => {
    const { key, ctrlKey } = event
    if ((key === 'Enter' && ctrlKey) || key === 'Esc' || key === 'Escape') {
      onBlurHandler(event)
    }
  }

  const setMarkup = newMarkup => {
    setMarkupValue(newMarkup)
  }

  // figure out how to do content transclusion

  return <div className="position-relative w-100" onClick={handleOnclick}>
    <div style={{whiteSpace:'pre-line'}} className="p-1 position-relative">
      {
        !markupValue || markupValue === ''
          ? <span className="text-muted">{placeholder}</span>
          : (markupValue + '\n')
      }
    </div>
    {
      editMode
        ? <EditMarkup
            className="w-100 h-100 position-absolute border-0 p-1 overflow-hidden"
            onKeyDownHandler={onKeyDownHandler}
            setMarkup={setMarkup}
            markup={markupValue}/>
        : null
    }
  </div>
}
import React, { useState } from 'react'
import Modal from '@material-ui/core/Modal'
import Backdrop from '@material-ui/core/Backdrop'
import Button from '@material-ui/core/Button'

import Fade from '@material-ui/core/Fade'

export const BtnModal = ({button, modal}) => {
  const [showMdl, setShowMdl] = useState(false)
  const mdl = modal || <div>content</div>
  const btn = button || <Button>show</Button>

  const handleClick = () => {
    setShowMdl(true)
  }
  return <>
    <div className="d-inline-block" onClick={handleClick}>
      {btn}
    </div>
    
    <Modal
      onClose={() => setShowMdl(false)}
      closeAfterTransition
      className="d-flex align-items-center justify-content-center"
      BackdropComponent={Backdrop}
      BackdropProps={{timeout: 500}}
      open={showMdl}>
      <Fade in={showMdl}>
        {mdl}
      </Fade>
    </Modal>

  </>
}
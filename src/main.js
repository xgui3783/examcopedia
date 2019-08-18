import React from 'react'
import ReactDOM from 'react-dom'
import { MaterialLandingPage } from './view/landing'

import 'bootstrap/dist/css/bootstrap.css'
import '@fortawesome/fontawesome-free/css/all.css'

import { UserContext, defaultUser } from './context/User'

ReactDOM.render(<UserContext.Provider value={defaultUser}>
  <MaterialLandingPage />
</UserContext.Provider>
, document.getElementById('container'))
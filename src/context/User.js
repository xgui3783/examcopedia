import React from 'react'

export const defaultUser = {
  id: 'defaultUserId',
  name: 'Default User',
  admin: 9
}

export const UserContext = React.createContext(defaultUser)
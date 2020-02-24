import React from 'react'

export const SyllabusContext = React.createContext({
  checked: [],
  check: () => {},
  uncheck: () => {}
})
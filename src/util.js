export const getFetchHeader = () => {
  return {
    'Content-Type': 'application/json'
  }
}

export function populateKeyProp({ _id, id, ...obj }){
  return {
    ...obj,
    id,
    _id,
    key: id || _id
  }
}

export const BACKENDURL = typeof process.env.BACKENDURL === 'undefined'
  ? 'http://localhost:3001'
  : process.env.BACKENDURL

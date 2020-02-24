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

export const BACKENDURL = process.env.BACKENDURL || 'http://localhost:3001'
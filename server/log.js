let flag = true

const log = (...message) => {
  if (flag) console.log(...message)
}

const warn = (...message) => {
  if (flag) console.warn(...message)
}

const error = (...message) => {
  if (flag) console.error(...message)
}

module.exports = {
  log,
  warn,
  error
}
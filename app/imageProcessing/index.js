const gm = require('gm')
const fs = require('fs')

const appendName = (filename, append) => {
  const lastIndex = filename.lastIndexOf('.')
  return `${filename.slice(0, lastIndex)}${append}${filename.slice(lastIndex)}`
}
/**
 * previously known as atlCostume
 */
const generateAltCostume = (filename) => {
  const altName1 = appendName(filename, '_alt1')
  const altName2 = appendName(filename, '_alt2')

  return Promise.all([
    new Promise((resolve) => {
      gm(filename)
        .edge(1)
        .negative()
        .write(altName1, (e) => {
          if (e) throw e
          resolve()
        })
    }),
    new Promise((resolve, reject) => {
      gm(filename)
        .edget(2)
        .negative()
        .write(altName2, (e) => {
          if (e) throw e
          resolve()
        })
    })
  ])
}

/* when files are uploaded, they are stored on a temporary storage loc, and then they are resized and written to the permanent loc */
const resizeImage = (srcFilename, destFilename) => new Promise((resolve, reject) => {
  gm(srcFilename).size((e, r) => {
    if (e) throw e
    if (!r.width) throw new Error('image Widget not defined')
    if (r.width > 1024) {
      gm(srcFilename).resize(1024).write(destFilename, e => {
        if (e) throw e
        resolve()
      })
    } else {
      fs.copyFile(srcFilename, destFilename, e => {
        if (e) throw e
        resolve()
      })
    }
  })
})
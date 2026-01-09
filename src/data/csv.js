import fs from 'fs'

export function loadCsv (filename, callback) {
  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      callback([])
      return
    }
    callback(data.split('\n').map(row => row.split(',')))
  })
}

export function writeCsv (filename, data) {
  const str = data.map(val => val.join()).join('\n')
  fs.writeFile(filename, str, { flag: 'w+' }, err => {
    if (err) throw err
  })
}

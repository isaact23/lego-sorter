import fs from 'fs'

const FILE_NAME = 'data.csv'

export function loadCsv (callback) {
  fs.readFile(FILE_NAME, 'utf8', (err, data) => {
    if (err) throw err
    callback(data.split('\n').map(row => row.split(',')))
  })
}

export function writeCsv (data) {
  const str = data.map(val => val.join()).join('\n')
  fs.writeFile(FILE_NAME, str, { flag: 'w+' }, err => {
    if (err) throw err
  })
}

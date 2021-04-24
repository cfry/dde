const fs   = require('fs')
const get  = require('simple-get')
const pump = require('pump')
const path = require('path')

/*
get('https://ballpit.github.io/website/pics.zip', (err, res) => {
    if (err) throw err

    const outStream = fs.createWriteStream(path.join(__dirname, 'pics.zip'))

    pump(res, outStream, (err) => {
        if (err) throw err
        console.log('done')
    })
})

*/
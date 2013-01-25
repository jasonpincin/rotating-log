var RotatingLog = require('../index')
,   logfile     = '/tmp/rotating-log-demo.log'
,   log         = RotatingLog(logfile, {keep:2, maxsize:512}) // 512 byte cap

log.on('rotated', function () {
    console.log('The log file was rotated.')
})
log.on('error', function (err) {
    console.error('There was an error: %s', err.message || err)
})

setInterval(function () {
    log.write( (new Date).toString() + '\n' )
}, 1000)

console.log('Logging to %s', logfile)
console.log('execute "tail -f %s" to watch log. press ctrl-c to exit.', logfile)
var tap         = require("tap")
,   util        = require('util')
,   fs          = require('fs')
,   exists      = fs.exists
,   test        = tap.test
,   plan        = tap.plan
,   logfile     = '/tmp/ep-rotating-log-test.log'
,   maxsize     = 512
,   RotatingLog      

test('load module', function (t) {
     RotatingLog = require('../index')
     t.ok(RotatingLog, 'module loaded')
     t.end()
})

test('test size rotation', function (t) {
    var log = RotatingLog(logfile, {keep:2, maxsize:maxsize})
    ,   ivl = setInterval(function () {
        log.write((new Date).toString() + '\n')
    }, 50)

    t.ok(log, 'started logging to ' + logfile)

    log.on('rotated', function () {
        t.ok(true, 'got rotated event')
        clearInterval(ivl)
        log.end()
        exists(logfile+'.1', function (ex) {
            t.ok(ex, logfile+'.1 exists')
            fs.stat(logfile+'.1', function (err, stats) {
                t.ok(stats.size <= maxsize, util.format('rotated file size (%s) <= maxsize (%s)', stats.size, maxsize))
                exists(logfile, function (ex) {
                    t.ok(ex, logfile+' still exists')
                    fs.unlink(logfile, function () {
                        fs.unlink(logfile+'.1', function () {
                            t.end()
                        })
                    })
                })
            })
        })
    })
})

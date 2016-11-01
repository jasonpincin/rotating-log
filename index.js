var fs              = require('fs')
,   util            = require('util')
,   ps              = require('pause-stream')
,   async           = require('async')
,   DateTimeEmitter = require('date-events')
,   RotatingLog

module.exports = RotatingLog = function (logfile, options) {

    var stream      = ps()
    ,   cal         = new DateTimeEmitter
    ,   options     = options || {}
    ,   maxsize     = ('maxsize' in options) ? options.maxsize : 51200000 // 50MB default max size
    ,   outstream   = fs.createWriteStream(logfile, {flags: 'a'})
    ,   rotating    = false
    ,   logsize     = 0
    options.keep = options.keep || 1

    cal.on('day', function () { // Rotate each day, TODO: this should become configurable
        rotate(logfile, options.keep)
    })

    stream.on('end', function () {
        cal.removeAllListeners()
        outstream.end()
    })

    function rotate (cb) {
        rotating = true
        stream.emit('rotating')

        stream.pause()

        var fileRotateQueue = async.queue(function (daysback, cb) {
            var formerperiod = util.format('%s.%s', logfile, daysback)
            var newperiod = util.format('%s.%s', logfile, daysback + 1)
            fs.exists(formerperiod, function (exists) {
                if (exists) {
                    if (daysback >= options.keep) {
                        fs.unlink(formerperiod, cb)
                    }
                    else {
                        fs.rename(formerperiod, newperiod, cb)
                    }
                }
                else {
                    cb()
                }
            })
        }, 1)

        function resume (cb) {
            logsize = 0
            if (cb)
                cb()
            stream.resume()
            rotating = false
            stream.emit('rotated')
        }

        function handleErr (err) {
            stream.emit('error', err)
        }

        function truncateCurrent () {
            fs.open(logfile, 'w', function (err, fd) {
                if (err)
                    return stream.emit('error', err)
                fs.close(fd)
                resume()
            })
        }

        function rotateCurrent () {
            if (options.keep > 0) {
                var src = fs.createReadStream(logfile)
                ,   dst = fs.createWriteStream(util.format('%s.1', logfile))
                src.pipe(dst)
                src.on('error', handleErr)
                dst.on('error', handleErr)
                src.on('end', function () {
                    src.destroy()
                    dst.destroy()
                    truncateCurrent()
                })
            }
            else {
                truncateCurrent()
            }
        }

        if (options.keep > 0) {
            for (var daysback = options.keep; daysback > 1; daysback --) {
                fileRotateQueue.push(daysback)
            }
            fileRotateQueue.push(1, function (err) {
                if (err)
                    return stream.emit('error', err)
                rotateCurrent()
            })
        }
        else {
            rotateCurrent()
        }
    }

    function flush (data) {
        function commit () {
            outstream.write(data)
            logsize += data.length
        }
        if (maxsize > 0 && logsize + data.length > maxsize && !rotating) {
            rotate(commit)
        } else
            commit()
    }

    stream.pause()
    outstream.on('open', function () {
        fs.stat(logfile, function (err, stats) {
            if (err) {
                stream.emit('error', new Error('Unable to determine size of log file.'))
            }
            else
                logsize = stats.size

            stream.on('data', flush)
            stream.resume()
        })
    })

    return stream
}

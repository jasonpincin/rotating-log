rotating-log
============

Writable stream with an underlying rotating log file. The rotation is somewhat configurable (to become moreso), 
but defaults to rotating daily or once the size of the file >= 50MB, and only one rotated log file will be kept.

This is a simple module. It does not do compression or anything fancy, and could probably stand to have more error 
checking in place. It only exposes a writable stream interface and has no additional methods. 

One feature (important to me), is that the log file is never moved/removed, and can be read from (via tail -f or whatever) indefinitely, even through rotations. When it comes time to rotate, output to the file is paused, the file is 
copied to the same name + '.1' (the existing '.1' is rotated to '.2' before-hand, etc), then the logfile is truncated 
in place, and finally logging is resumed. During this (relatively quick) process, log messages will be buffered in 
memory, which always carries a risk.

# Install

`npm install rotating-log`

# Example

``` js
var RotatingLog = require('rotating-log')
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
```

# Usage

## RotatingLog(logfilepath, options)

* `logfilepath` (required) - path to the log file
* `options` (default: {}) - configurable behaviour options

# Configuration Options

* `keep` (default:1) - number of rotated log files to keep; rotations beyond this number are removed
* `maxsize` (default:50MB) - maximum size of log file before rotation is forced (IN BYTES)

# Supported Events

* `rotating` - Emitted once a rotation begins
* `rotated` - Emitted once a rotation has completed

# Rotated Filenames

Rotated logfiles will be found in the same directory as the primary log file with an extra index appended to the filename. 
The higher the digit, the older the rotated logfile (this is identical to traditional unix logging). For example, the 
following command:

`var log = new RotatingLog('/tmp/test.log', {keep:3})`

Will result in the following files (after a couple of days):

```
test.log
test.log.1
test.log.2
test.log.3
```

The next time the log is rotated, test.log.3 will be removed, test.log.2 will become test.log.3, test.log.1 will become 
test.log.2, and test.log will become test.log.1. Afterwards, test.log is truncated.

# Testing

`npm test`


const { createLogger, transports, format } = require('winston');
const fs = require('fs');
const path = require('path');


const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
const level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
const logger = createLogger({
   level,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }), 
    format.splat(), 
    format.json() 
  ),
  transports: [

    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(info => 
          `${info.timestamp} [${info.level}]: ${info.message}${info.stack ? '\n' + info.stack : ''}`
        )
      )
    }),

    new transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, 
      maxFiles: 5
    }),

    new transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logsDir, 'rejections.log') })
  ]
});

module.exports = logger;
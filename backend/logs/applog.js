const winston =require("winston");
const logger=winston.createLogger({
    level: 'info', // Set the default log level
    format: winston.format.simple(),
    transports: [
      new winston.transports.File({ filename: 'logs/app.log' })
    ]
  });
module.exports={logger};
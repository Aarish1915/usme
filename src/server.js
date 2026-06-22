const app = require('./app');
const config = require('./common/config');
const logger = require('./common/config/logger');

const PORT = config.port || 3001;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

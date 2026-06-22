module.exports = {
  apps: [
    {
      name: 'usame-api',
      script: './src/server.js',
      instances: 'max', // Utilizes all available CPU cores
      exec_mode: 'cluster', // Enables clustering for high availability
      autorestart: true, // Automatically restarts if the app crashes
      watch: false, // Do not watch files in production to save memory
      max_memory_restart: '1G', // Restarts the process if it consumes more than 1GB of memory
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};

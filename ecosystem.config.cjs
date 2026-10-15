module.exports = {
  apps: [
    {
      name: "diip",
      cwd: __dirname,
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_memory_restart: "512M",
      time: true,
    },
  ],
};

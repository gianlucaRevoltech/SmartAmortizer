module.exports = {
  apps: [
    {
      name: "smart-amortizer",
      script: "./dist/smart-amortizer/server/server.mjs",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 4001,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4001,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      max_memory_restart: "1G",
      node_args: "--max_old_space_size=4096",
    },
  ],
};

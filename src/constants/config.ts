class Config {
  nextAuth = {
    email: {
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
      from: process.env.EMAIL_FROM,
    },
  };
}

const config = new Config();

export default config;

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB_HOST: string;
      NODE_ENV: "development" | "production";
      DB_NAME: string;
      DB_USER: string;
      DB_PASSWORD: string;
      DB_URL: string;
      DB_PORT: string;
      EMAIL_HOST: string;
      EMAIL_PORT: string;
      EMAIL_USER: string;
      EMAIL_PASSWORD: string;
    }
  }
}

export {};

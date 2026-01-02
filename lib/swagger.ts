const enabled = process.env.ENABLE_SWAGGER === "true";

export const swaggerSpec = enabled
  ? swaggerJSDoc({
      definition: {
        openapi: "3.0.0",
        info: {
          title: "HERO Sales API",
          version: "1.0.0",
        },
      },
      apis: ["./app/api/**/*.ts"],
    })
  : null;

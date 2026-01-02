import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Stock API",
      version: "1.0.0",
      description: "API de gerenciamento de estoque e vendas",
    },
    servers: [
      { url: "http://localhost:3000" },
      { url: "https://SEU-PROJETO.vercel.app" },
    ],
  },
  apis: ["./app/api/**/*.ts"], // 🔥 lê comentários das rotas
});

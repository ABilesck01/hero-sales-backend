import type { OpenAPIV3 } from "openapi-types";

const enabled = process.env.ENABLE_SWAGGER === "true";

export const swaggerSpec: OpenAPIV3.Document | null = enabled
  ? (() => {
      // 👇 IMPORT DINÂMICO (só executa se enabled === true)
      // evita erro de build na Vercel
      // evita precisar do pacote em produção
      const swaggerJSDoc = require("swagger-jsdoc");

      return swaggerJSDoc({
        definition: {
          openapi: "3.0.0",
          info: {
            title: "HERO Sales API",
            version: "1.0.0",
          },
        },
        apis: ["./app/api/**/*.ts"],
      });
    })()
  : null;

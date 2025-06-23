/**
 * @file src/handlers/docs.ts
 * @author Gianpiero Benvenuto
 * @description Sirve la interfaz Swagger UI en el endpoint `/docs`, entrega el JSON de OpenAPI y los assets estáticos según el stage configurado, y registra en CloudWatch todas las operaciones y errores.
 */

import fs from "fs";
import path from "path";
import mime from "mime-types";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { logToCloudWatch } from "../utils/cloudwatchLogger";

// Ruta base de la distribución de swagger-ui-dist
const swaggerDistPath = path.dirname(
  require.resolve("swagger-ui-dist/package.json")
);

// Ruta absoluta al archivo OpenAPI generado
const openApiPath = path.join(__dirname, "../../openapi.json");

// Determina el stage de despliegue (por defecto "dev")
const STAGE = process.env.STAGE || "dev";

// Prefijo de ruta para API Gateway en ese stage
const ROOT = `/${STAGE}/`;

/**
 * Sirve un archivo estático desde el sistema de archivos local.
 * Determina automáticamente el tipo MIME y si el contenido debe codificarse en base64.
 */
async function serveFile(abs: string): Promise<APIGatewayProxyResult> {
  try {
    await logToCloudWatch(`Leyendo archivo estático: ${abs}`, "INFO");
    const buf = fs.readFileSync(abs);
    const type = (mime.lookup(abs) || "application/octet-stream").toString();
    const isText =
      type.startsWith("text/") ||
      type === "application/javascript" ||
      type === "application/json";

    return {
      statusCode: 200,
      headers: { "Content-Type": type },
      body: isText ? buf.toString("utf8") : buf.toString("base64"),
      ...(isText ? {} : { isBase64Encoded: true }),
    };
  } catch (fileError: any) {
    await logToCloudWatch(
      `Error sirviendo archivo ${abs}: ${fileError.message}`,
      "ERROR"
    );
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: "Error interno al servir archivo",
    };
  }
}

/**
 * Lambda principal para servir Swagger UI en el endpoint /docs.
 * Maneja /docs, /docs/openapi.json y otros assets estáticos.
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const reqPath = event.path || "";
  await logToCloudWatch(`Inicio handler /docs: path=${reqPath}`, "INFO");

  try {
    // Ruta principal: HTML de Swagger UI
    if (reqPath === "/docs" || reqPath === "/docs/") {
      await logToCloudWatch("Sirviendo HTML de Swagger UI", "INFO");
      const indexFile = path.join(swaggerDistPath, "index.html");
      let html = fs.readFileSync(indexFile, "utf8");

      // Script de inicialización personalizado
      const initScript = `
<script>
window.onload = function() {
  if(window.ui) window.ui = null;
  const ui = SwaggerUIBundle({
    url: "${ROOT}docs/openapi.json",
    dom_id: '#swagger-ui',
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    layout: "StandaloneLayout"
  });
  window.ui = ui;
};
</script>
      `;

      html = html.replace(/<script>.*SwaggerUIBundle\(.*\);.*<\/script>/s, "");
      html = html.replace("</body>", `${initScript}</body>`);
      html = html.replace(
        /(href|src)="([^"/][^"]*)"/g,
        (_m, attr, file) => `${attr}="${ROOT}${file}"`
      );

      await logToCloudWatch("HTML de Swagger UI generado exitosamente", "INFO");
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/html" },
        body: html,
      };
    }

    // OpenAPI JSON
    if (reqPath === "/docs/openapi.json") {
      await logToCloudWatch("Sirviendo openapi.json", "INFO");
      return serveFile(openApiPath);
    }

    // Assets de swagger-ui-dist bajo /docs/
    if (reqPath.startsWith("/docs/")) {
      const rel = reqPath.replace(/^\/docs\//, "");
      const file = path.join(swaggerDistPath, rel);
      if (fs.existsSync(file)) {
        await logToCloudWatch(`Asset encontrado: ${rel}`, "INFO");
        return serveFile(file);
      }
    }

    // Assets con ruta relativa desde root stage
    const rootRel = reqPath.replace(new RegExp(`^/${STAGE}/`), "");
    const rootFile = path.join(swaggerDistPath, rootRel);
    if (fs.existsSync(rootFile)) {
      await logToCloudWatch(`Asset raíz encontrado: ${rootRel}`, "INFO");
      return serveFile(rootFile);
    }

    // No encontrado
    await logToCloudWatch(`Ruta no encontrada: ${reqPath}`, "WARN");
    return { statusCode: 404, body: "No encontrado" };
  } catch (handlerError: any) {
    await logToCloudWatch(
      `Error handler /docs: ${handlerError.message}`,
      "ERROR"
    );
    console.error(handlerError);
    return { statusCode: 500, body: "Error interno del servidor" };
  }
};

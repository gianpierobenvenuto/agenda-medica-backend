# Reto Técnico Back End - Rimac/Indra

**Autor:** [Gianpiero Benvenuto](https://github.com/gianpierobenvenuto)

**Servicio backend escalable para gestionar citas médicas.**

---

## 🚀 Descripción

Esta aplicación expone una API RESTful para:

- **Crear citas** (`POST /appointments`): registra una nueva cita en estado `pending`.
- **Listar citas** (`GET /appointments/{insuredId}`): obtiene todas las citas asociadas a un asegurado.

Se integra con AWS para máxima fiabilidad y escalabilidad (DynamoDB, RDS, SNS, SQS, EventBridge, Lambda).

---

## 🧰 Tecnologías

- **Lenguaje**: Node.js + TypeScript
- **Infraestructura**: AWS Lambda, API Gateway, Serverless Framework
- **Bases de datos**: DynamoDB (NoSQL), RDS MySQL (relacional)
- **Mensajería**: SNS, SQS, EventBridge
- **Testing**: Jest (unit + integration)
- **Documentación**: OpenAPI/Swagger
- **CI/CD**: GitHub Actions

---

## 🔧 Requisitos Previos

- Node.js ≥ 20.x
- AWS CLI configurado con credenciales
- Serverless Framework (`npm install -g serverless`)
- Variables de entorno en un archivo `.env` (véase abajo)

---

## 🔑 Variables de Entorno

| Variable                | Descripción                                | Ejemplo                                                            |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| `RDS_SECRET_ARN`        | ARN del secreto en AWS Secrets Manager     | `arn:aws:secretsmanager:us-east-1:123456789012:secret:MyRdsSecret` |
| `CLOUDWATCH_LOG_GROUP`  | Nombre del grupo de logs de CloudWatch     | `reto-agenda-medica-logs`                                          |
| `CLOUDWATCH_LOG_STREAM` | Nombre del stream de logs                  | `appointments-stream`                                              |
| `RDS_HOST` (opcional)   | Host de fallback para RDS                  | `mydb.cluster-xxxx.us-east-1.rds.amazonaws.com`                    |
| `RDS_PORT` (opcional)   | Puerto de RDS                              | `3306`                                                             |
| `RDS_DATABASE`          | Nombre de la base de datos en RDS          | `appointments`                                                     |
| `API_KEY`               | Clave para autenticar requests (si aplica) | `supersecretapikey123`                                             |

---

## ⚙️ Instalación & Despliegue

```bash
# 1. Clonar repositorio
git clone https://github.com/gianpierobenvenuto/agenda-medica-backend.git
cd agenda-medica-backend

# 2. Instalar dependencias
npm install

# 3. Crear .env con las variables de entorno
cp .env.example .env
# Editar .env con tus valores...

# 4. Desplegar en AWS (stage "dev" por defecto)
sls deploy --stage dev

# 5. Ejecutar tests y generar reporte de coverage
npm test
```

---

## 📄 Documentación Swagger / OpenAPI

La documentación interactiva Swagger UI está disponible y puedes probar la API en vivo en:

[https://bfgulowqdi.execute-api.us-east-1.amazonaws.com/dev/docs/](https://bfgulowqdi.execute-api.us-east-1.amazonaws.com/dev/docs/)

Y el JSON de OpenAPI en:

[https://bfgulowqdi.execute-api.us-east-1.amazonaws.com/dev/docs/openapi.json](https://bfgulowqdi.execute-api.us-east-1.amazonaws.com/dev/docs/openapi.json)

---

## 📖 Uso / Ejemplos de API

### Crear cita

```bash
curl -X POST https://{apiId}.execute-api.{region}.amazonaws.com/{stage}/appointments \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "insuredId": "12345",
    "scheduleId": 1,
    "countryISO": "PE"
  }'
```

**Respuesta `201 Created`:**

```json
{
  "appointmentId": "uuid-1234",
  "insuredId": "12345",
  "scheduleId": 1,
  "countryISO": "PE",
  "status": "pending",
  "createdAt": "2025-06-23T10:00:00Z",
  "updatedAt": null
}
```

### Listar citas

```bash
curl https://{apiId}.execute-api.{region}.amazonaws.com/{stage}/appointments/12345 \
  -H "x-api-key: $API_KEY"
```

**Respuesta `200 OK`:**

```json
[
  {
    "appointmentId": "uuid-1234",
    "insuredId": "12345",
    "scheduleId": 1,
    "countryISO": "PE",
    "status": "pending",
    "createdAt": "2025-06-23T10:00:00Z",
    "updatedAt": null
  }
]
```

---

## 🧪 Testing & Calidad

- **Tests unitarios** con Jest:

  ```bash
  npm test
  ```

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](https://opensource.org/licenses/MIT).

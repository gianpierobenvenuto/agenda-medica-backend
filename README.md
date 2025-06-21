rimac-backend/
├── src/
│**_├── application/ # Casos de uso (Use Cases)
│_**│ └── bookAppointment.ts
│**_├── domain/ # Entidades e interfaces
│_**│ └── Appointment.ts
│**_├── infrastructure/ # Clientes AWS, repositorios, adaptadores
│_**│ └── DynamoRepository.ts
│**_├── presentation/ # Handlers de AWS Lambda (API)
│_**│ ├── appointment.ts
│**_│ ├── appointment_pe.ts
│_**│ └── appointment\*cl.ts
│\*\*\*├── shared/ # Utilidades, constantes
│\_**│ └── constants.ts
│**\_└── tests/ # Pruebas unitarias (Jest)
│**\_\*\***├── appointment.test.ts
│**\_\_\_**└── repository.test.ts
├── swagger.yml # Definición OpenAPI 3.0
├── serverless.yml # Infraestructura IaC (incluye SQS y EventBridge)
├── tsconfig.json # TypeScript config
├── package.json # Scripts y dependencias
├── README.md # Documentación de uso y despliegue
└── .gitignore

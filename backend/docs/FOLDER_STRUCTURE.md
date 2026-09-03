# Standard Express.js Project Structure for Team Development

When working in a team on an Express.js application, structure your project around **separation of concerns**, clear architectural boundaries, and predictable file locations.

---

## 📁 Complete Folder Structure

```text
my-express-app/
├── src/
│   ├── config/             # Environment variables, database connection, third-party configs
│   │   ├── db.js
│   │   └── env.js
│   │
│   ├── controllers/        # Handles HTTP requests, extracts params/body, calls services
│   │   ├── authController.js
│   │   └── inquiryController.js
│   │
│   ├── middlewares/        # Custom Express middlewares (auth, error handling, validation)
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── validateMiddleware.js
│   │
│   ├── models/             # Database schemas / ORM models (Mongoose, Sequelize, Prisma)
│   │   ├── User.js
│   │   └── Inquiry.js
│   │
│   ├── routes/             # Express router modules defining API endpoints
│   │   ├── index.js        # Central router combining all sub-routes
│   │   ├── authRoutes.js
│   │   └── inquiryRoutes.js
│   │
│   ├── services/           # Core business logic and external API integrations
│   │   ├── authService.js
│   │   └── emailService.js
│   │
│   ├── utils/              # Pure helper functions, formatters, and reusable utilities
│   │   ├── logger.js
│   │   └── apiError.js
│   │
│   ├── validations/        # Input validation schemas (Joi, Zod, or Express-Validator)
│   │   └── inquiryValidation.js
│   │
│   ├── app.js              # Express app setup (middleware registration, route mounting)
│   └── server.js           # Server entry point (DB connection, app.listen, graceful shutdown)
│
├── tests/                  # Automated unit and integration tests (Jest, Supertest)
│   ├── integration/
│   └── unit/
│
├── .env.example            # Template for environment variables (committed to version control)
├── .env                    # Local environment variables (git-ignored)
├── .gitignore
├── .eslintrc.json          # Enforces code formatting and linting rules across team members
├── .prettierrc             # Code formatting rules
├── package.json
└── README.md
```

# FinScale Backend — Spring Boot REST API

DevOps-Based Autoscaling Financial Server backend.

Built with **Java 17**, **Spring Boot 3.3**, **Spring Data MongoDB**, **Spring Security**, and **JWT** support.

---

## Architecture

```
Controller  →  Service  →  Repository  →  MongoDB
```

| Layer         | Technology                    |
|---------------|-------------------------------|
| REST APIs     | Spring Web                    |
| Database      | MongoDB (only)                |
| ORM           | Spring Data MongoDB           |
| Security      | Spring Security (open by default — no login in frontend yet) |
| JWT           | jjwt 0.12 (ready, not active) |
| Validation    | spring-boot-starter-validation |
| Build         | Maven                         |

---

## Project Structure

```
backend/
├── pom.xml
├── src/main/
│   ├── java/com/finscale/
│   │   ├── FinScaleApplication.java          # Main entry point
│   │   ├── model/
│   │   │   ├── Account.java                  # MongoDB document
│   │   │   └── Transaction.java              # MongoDB document
│   │   ├── dto/
│   │   │   ├── AccountDTO.java
│   │   │   ├── CreateAccountDTO.java
│   │   │   ├── TransactionDTO.java
│   │   │   ├── WithdrawRequestDTO.java
│   │   │   ├── DepositRequestDTO.java
│   │   │   ├── TransactionResultDTO.java
│   │   │   └── ErrorResponseDTO.java
│   │   ├── repository/
│   │   │   ├── AccountRepository.java
│   │   │   └── TransactionRepository.java
│   │   ├── service/
│   │   │   └── AccountService.java
│   │   ├── controller/
│   │   │   └── AccountController.java
│   │   ├── config/
│   │   │   ├── MongoConfig.java              # MongoDB auditing
│   │   │   ├── CorsConfig.java               # CORS for frontend
│   │   │   ├── SecurityConfig.java           # Security filter chain
│   │   │   └── DataInitializer.java          # Seeds initial account
│   │   ├── security/
│   │   │   ├── JwtUtil.java                  # JWT token utility
│   │   │   └── JwtAuthenticationFilter.java  # JWT filter (prepared)
│   │   └── exception/
│   │       ├── GlobalExceptionHandler.java
│   │       ├── ResourceNotFoundException.java
│   │       ├── InsufficientBalanceException.java
│   │       └── InvalidTransactionException.java
│   └── resources/
│       ├── application.yml                   # Default config
│       └── application-prod.yml              # Production config
```

---

## REST API Endpoints

All endpoints are prefixed with `/api`.

### Accounts

| Method | Endpoint                        | Description                              |
|--------|---------------------------------|------------------------------------------|
| GET    | `/api/accounts`                 | List all accounts                        |
| GET    | `/api/accounts/{id}`            | Get a single account by ID               |
| POST   | `/api/accounts`                 | Create a new account (with initial balance) |
| POST   | `/api/accounts/{id}/withdraw`   | Withdraw money from an account           |
| POST   | `/api/accounts/{id}/deposit`    | Deposit money into an account            |
| GET    | `/api/accounts/{id}/transactions` | Get transaction history for an account |

### Request/Response Examples

**Create Account:**
```
POST /api/accounts
Content-Type: application/json

{
  "name": "Operations Server Fund",
  "initialBalance": 50000.00,
  "currency": "USD"
}
```

**Withdraw:**
```
POST /api/accounts/{accountId}/withdraw
Content-Type: application/json

{
  "amount": 500.00,
  "description": "Server scaling payment"
}
```

**Deposit:**
```
POST /api/accounts/{accountId}/deposit
Content-Type: application/json

{
  "amount": 1000.00,
  "description": "Server fund top-up"
}
```

**Withdraw/Deposit Response:**
```json
{
  "transaction": {
    "id": "...",
    "accountId": "...",
    "type": "withdrawal",
    "amount": 500.00,
    "status": "completed",
    "description": "Server scaling payment",
    "balanceAfter": 49500.00,
    "createdAt": "2026-09-10T12:00:00"
  },
  "newBalance": 49500.00
}
```

**Error Response:**
```json
{
  "status": 400,
  "error": "Insufficient Balance",
  "message": "Insufficient balance for this withdrawal.",
  "path": "/api/accounts/{id}/withdraw",
  "timestamp": "2026-09-10T12:00:00"
}
```

---

## Prerequisites

1. **Java 17** (or higher)
   ```bash
   java -version
   ```

2. **Maven 3.8+**
   ```bash
   mvn -version
   ```

3. **MongoDB 6.0+** — running locally on default port `27017`
   - Install: https://www.mongodb.com/try/download/community
   - Or run with Docker:
     ```bash
     docker run -d --name finscale-mongo -p 27017:27017 mongo:7.0
     ```

---

## How to Run

### 1. Start MongoDB

Make sure MongoDB is running on `localhost:27017`. If using Docker:

```bash
docker run -d --name finscale-mongo -p 27017:27017 mongo:7.0
```

### 2. Build the Backend

```bash
cd backend
mvn clean package -DskipTests
```

### 3. Run the Backend

```bash
mvn spring-boot:run
```

Or run the JAR directly:

```bash
java -jar target/finscale-backend-1.0.0.jar
```

The backend starts on **http://localhost:8080**.

On first startup, it automatically seeds an account named **"Operations Server Fund"** with a $50,000 balance.

### 4. Run the Frontend

The frontend is configured to call the backend at `http://localhost:8080` by default. If your backend runs on a different URL, set it in the frontend `.env`:

```bash
# In the project root (frontend)
VITE_API_URL=http://localhost:8080
```

Then run the frontend dev server:

```bash
npm install
npm run dev
```

The frontend will load on its dev port and communicate with the Spring Boot backend.

---

## Configuration

### application.yml (default — local development)

```yaml
server:
  port: 8080

spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/finscale
      auto-index-creation: true

finscale:
  jwt:
    secret: finscale-devops-autoscaling-secret-key-for-jwt-signing-2026
    expiration: 86400000
```

### Production (application-prod.yml)

```bash
java -jar target/finscale-backend-1.0.0.jar --spring.profiles.active=prod
```

Environment variables for production:

| Variable     | Description                        | Default                                      |
|--------------|------------------------------------|----------------------------------------------|
| `MONGO_URI`  | MongoDB connection URI             | `mongodb://localhost:27017/finscale`         |
| `JWT_SECRET` | Secret key for JWT signing         | (dev key — override in production)           |

---

## Features

- **Account management**: Create accounts with name, initial balance, and currency
- **Balance tracking**: Real-time balance updates on every transaction
- **Withdrawal history**: Every withdrawal and deposit is logged with timestamp and balance snapshot
- **Insufficient balance protection**: Server rejects withdrawals that exceed available balance
- **Input validation**: Bean validation on all request DTOs
- **Global exception handling**: Consistent error responses with status codes and messages
- **CORS support**: Frontend can call the API from any origin
- **MongoDB auditing**: Automatic `createdAt` and `updatedAt` timestamps
- **JWT ready**: JWT utility and filter are included for when login/signup is added

---

## Security

The frontend currently has no login/signup flow, so all endpoints are open.
Spring Security is configured with:

- CSRF disabled (REST API, no server-side sessions)
- Stateless sessions (JWT-ready)
- All requests permitted

When login is added to the frontend:
1. Create an `AuthController` with `/api/auth/register` and `/api/auth/login` endpoints
2. Register the `JwtAuthenticationFilter` in `SecurityConfig`
3. Change `authorizeHttpRequests` to require authentication on financial endpoints

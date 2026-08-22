# ShopSense

ShopSense is a Vite-powered React and TypeScript e-commerce frontend with a customer-facing shopping experience and admin management experience. The project now includes a Node.js, Express, TypeScript, MongoDB, and Mongoose API service that can support product, order, inventory, and analytics flows while preserving the existing local/demo-first frontend workflow.

## Project Overview

ShopSense combines a responsive retailer UI with a full-stack commerce API. The existing React frontend continues to render customer pages, catalog pages, product details, cart, checkout, orders, and the admin dashboard. The backend exposes REST endpoints for the same lifecycle, including product listing and management, order placement, inventory visibility, and analytics summary reads.

## Technology Stack

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

Backend:
- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose

## Folder Structure

```text
ShopSense/
├── src/                    # Existing React frontend
├── server/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── .env.example
└── package.json
```

## Frontend Setup

The frontend remains a Vite React project.

```bash
npm install
npm run dev
```

## Backend Setup

The Express API lives in the server folder.

```bash
cd server
npm install
npm run dev
```

The backend reads environment variables from a local environment file. Create a local copy of the example environment file before starting MongoDB-backed development.

## MongoDB Setup

Install and run MongoDB locally, or point MONGODB_URI at a reachable deployment.

Example connection string:

```text
mongodb://127.0.0.1:27017/shopsense
```

The application can start without MongoDB configuration. In that mode, the backend logs a clear startup message and keeps the frontend working with demo/localStorage data.

## Environment Variables

Example:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/shopsense
PORT=5000
```

## How to Run Frontend

```bash
npm run dev
```

## How to Run Backend

```bash
npm run server
```

Or from the server folder:

```bash
cd server
npm run dev
```

## API Endpoints

```text
GET /api/health
GET /api/products
GET /api/products/:id
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id

GET /api/orders
GET /api/orders/:id
POST /api/orders
PUT /api/orders/:id/status

GET /api/inventory
PUT /api/inventory/:productId

GET /api/analytics/summary
GET /api/analytics/sales
GET /api/analytics/top-products
```

The order API validates requested quantities against available product stock. When an order is accepted, product stock is reduced, units sold are tracked, and inventory status is recalculated in line with the supplied business logic.

## Future ML/content intelligence integration

ShopSense is designed for a phased intelligence layer. The API surface can later support catalog recommendations, content enrichment, sales forecasting, sentiment-informed copy generation, and inventory intelligence workflows. The current inventory recommendation logic is explicit and rule-based: it calculates stock status and restock priority using current stock, reorder level, and recent sales data. It does not claim to be an advanced AI forecasting system.


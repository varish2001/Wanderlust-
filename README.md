# WanderLust

WanderLust is an Airbnb-inspired property listing platform built with Node.js, Express, MongoDB, Mongoose, EJS, Passport sessions, and Bootstrap-enhanced custom UI. It is structured as a beginner-friendly MVC project, but now organized more like a production-ready portfolio app.

## Highlights

- Search listings by title, location, and country
- Filter by category, max budget, and popular stays
- Create, edit, delete, and review listings with validation
- Session-based authentication with protected routes
- Listing ownership and review author checks
- Wishlist support and personal dashboard
- Pagination and listing statistics
- Cloudinary-ready multi-image upload flow
- Centralized error handling and polished empty/error states
- Deployment-friendly environment configuration

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- EJS + ejs-mate
- Passport session auth
- Joi validation
- Bootstrap + custom CSS
- Cloudinary + Multer
- Connect Mongo session store

## Updated Structure

```text
.
├── app.js
├── middleware.js
├── schema.js
├── config/
│   ├── cloudinary.js
│   ├── db.js
│   └── env.js
├── controllers/
│   ├── listings.js
│   ├── reviews.js
│   └── users.js
├── init/
├── models/
├── public/
│   ├── css/
│   └── js/
├── routes/
├── utils/
└── views/
    ├── home.ejs
    ├── error.ejs
    ├── includes/
    ├── layouts/
    ├── listings/
    └── users/
```

## Environment Variables

Copy `.env.example` to `.env` and update the values.

```env
ATLASDB_URL=mongodb://127.0.0.1:27017/wanderlust
PORT=8080
NODE_ENV=development
SESSION_SECRET=replace-with-a-long-random-string
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Notes:

- In local development, the app can fall back to `mongodb://127.0.0.1:27017/wanderlust`.
- In production, set `ATLASDB_URL` and a strong `SESSION_SECRET`.
- Cloudinary uploads activate when all three `CLOUDINARY_*` variables are present.

## Commands

```bash
npm install
npm run seed
npm run dev
```

## Core Routes

- `GET /` landing page
- `GET /listings` listing index with search, filters, and pagination
- `GET /listings/new` create listing form
- `POST /listings` create listing
- `GET /listings/:id` show listing
- `GET /listings/:id/edit` edit listing
- `PUT /listings/:id` update listing
- `DELETE /listings/:id` delete listing
- `POST /listings/:id/favorite` toggle wishlist
- `POST /listings/:id/reviews` create review
- `DELETE /listings/:id/reviews/:reviewId` delete review
- `GET /signup` register user
- `GET /login` log in user
- `GET /dashboard` user dashboard

## Deployment Notes

This project is prepared for Render, Railway, Cyclic, or Vercel-supported frontend hosting patterns.

Before deployment:

- Set `NODE_ENV=production`
- Configure `ATLASDB_URL`
- Configure `SESSION_SECRET`
- Add Cloudinary credentials if you want file uploads
- Ensure Atlas network access allows your deployment environment
- Seed local/demo data only when needed

## Validation and Security

- Joi validates listing, login, signup, and review input
- Protected routes require authentication
- Listing edit/delete routes check ownership
- Review deletion checks the review author
- Sessions are stored in MongoDB through `connect-mongo`
- Requests are sanitized with `express-mongo-sanitize`
- Security headers are enabled with `helmet`

## Portfolio Value

WanderLust is designed to demonstrate:

- Full-stack CRUD design
- Authentication and authorization
- Server-rendered UI architecture
- Production-oriented Express app structure
- Clean refactoring without rewriting the entire project

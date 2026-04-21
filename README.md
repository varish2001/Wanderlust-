# Wanderlust

Wanderlust is a full-stack travel listing web application built with Node.js, Express, MongoDB, Mongoose, EJS, and Bootstrap. It lets users browse stay listings, view listing details, sign up, log in, create new listings, edit or delete listings, and add reviews with ratings.

The project follows the classic MVC-style structure used in Express applications:

- Models define MongoDB collections.
- Routes handle page actions and API-like form submissions.
- Views render server-side EJS templates.
- Middleware protects private routes and manages errors.
- Public assets hold CSS and browser-side JavaScript.

## Features

- Browse all travel listings from the home page or `/listings`
- View detailed listing pages with image, price, location, country, and reviews
- User signup and login with hashed passwords
- Login session support using Passport and Express Session
- JWT cookie creation for authenticated users
- Protected create, edit, update, and delete listing actions
- Add and delete reviews for individual listings
- Server-side validation with Joi
- Flash messages for success and error feedback
- Method override support for PUT and DELETE form submissions
- Centralized async error handling
- Automatic review cleanup when a listing is deleted
- Seed script for loading sample listings into MongoDB

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js |
| Server | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Templates | EJS with ejs-mate layouts |
| Styling | Bootstrap and custom CSS |
| Authentication | Passport, bcrypt, JWT |
| Validation | Joi |
| Session and messages | express-session, connect-flash |
| HTTP method support | method-override |

## Project Structure

```text
.
├── app.js
├── middleware.js
├── schema.js
├── package.json
├── package-lock.json
├── init/
│   ├── data.js
│   └── index.js
├── models/
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── public/
│   ├── css/
│   │   ├── rating.css
│   │   └── style.css
│   └── js/
│       └── script.js
├── routes/
│   ├── listing.js
│   ├── review.js
│   └── user.js
├── utils/
│   ├── ExpressError.js
│   └── wrapAsync.js
└── views/
    ├── error.ejs
    ├── includes/
    │   ├── footer.ejs
    │   └── navbar.ejs
    ├── layouts/
    │   └── boilerplate.ejs
    ├── listings/
    │   ├── edit.ejs
    │   ├── index.ejs
    │   ├── new.ejs
    │   └── show.ejs
    └── users/
        ├── login.ejs
        └── signup.ejs
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/varish2001/Wanderlust-.git
cd Wanderlust-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory.

```env
ATLASDB_URL=mongodb://127.0.0.1:27017/wanderlust
JWT_SECRET=replace-this-with-a-strong-secret
```

`ATLASDB_URL` can be a local MongoDB connection string or a MongoDB Atlas connection string.

If `ATLASDB_URL` is not provided, the app falls back to:

```text
mongodb://127.0.0.1:27017/wanderlust
```

### 4. Start MongoDB

If you are using local MongoDB, make sure the MongoDB server is running before starting the app.

### 5. Seed sample listings

Run the seed script to insert sample listings:

```bash
node init/index.js
```

### 6. Start the application

```bash
node app.js
```

The app runs on:

```text
http://localhost:8080
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `ATLASDB_URL` | No | MongoDB connection string. Falls back to local MongoDB if missing. |
| `JWT_SECRET` | Recommended | Secret used to sign JWT tokens for authenticated users. |

Do not commit `.env` files. This repository includes `.env` and `.env.*` in `.gitignore`.

## Main Routes

### Listing Routes

| Method | Route | Description | Login Required |
| --- | --- | --- | --- |
| GET | `/` | Show all listings | No |
| GET | `/listings` | Show all listings | No |
| GET | `/listings/new` | Show new listing form | Yes |
| POST | `/listings` | Create a new listing | Yes |
| GET | `/listings/:id` | Show listing details | No |
| GET | `/listings/:id/edit` | Show edit form | Yes |
| PUT | `/listings/:id` | Update a listing | Yes |
| DELETE | `/listings/:id` | Delete a listing | Yes |

### Review Routes

| Method | Route | Description |
| --- | --- | --- |
| POST | `/listings/:id/reviews` | Add a review to a listing |
| DELETE | `/listings/:id/reviews/:reviewId` | Delete a review |

### User Routes

| Method | Route | Description |
| --- | --- | --- |
| GET | `/signup` | Show signup form |
| POST | `/signup` | Create a new user account |
| GET | `/login` | Show login form |
| POST | `/login` | Log in an existing user |
| GET | `/logout` | Log out the current user |

## Data Models

### Listing

Each listing contains:

- `title`
- `description`
- `image`
- `price`
- `location`
- `country`
- `reviews`

When a listing is deleted, its related reviews are also deleted automatically.

### Review

Each review contains:

- `comment`
- `rating`
- `createdAt`

Ratings are limited from 1 to 5.

### User

Each user contains:

- `username`
- `email`
- `password`
- `hash` and `salt` fallback fields for older records

Passwords are hashed with bcrypt before storage.

## Validation

The project uses Joi schemas in `schema.js` to validate listing, review, and user data before saving it to MongoDB. Invalid form submissions are passed to the centralized error handler and shown through the error page or flash messages.

## Authentication Flow

Users can create an account from `/signup` and log in from `/login`.

The authentication system:

- Normalizes email addresses before lookup
- Hashes new passwords with bcrypt
- Supports login with email or username
- Stores login state with Passport sessions
- Sets a signed JWT token cookie
- Redirects users back to the originally requested protected page after login

Protected listing routes use `isLoggedIn` from `middleware.js`.

## Error Handling

Async route handlers are wrapped with `wrapAsync`, which forwards errors to Express. Custom application errors use the `ExpressError` utility. Unknown routes return a 404 error with the message `Page Not Found`.

## Static Assets

Static files are served from the `public` directory:

- `public/css/style.css` contains the main custom styles.
- `public/css/rating.css` is reserved for rating-related styles.
- `public/js/script.js` contains browser-side form validation behavior.

## Useful Commands

```bash
npm install
node init/index.js
node app.js
```

## Notes

- `node_modules/`, `.env`, MongoDB local data folders, and log files are ignored by Git.
- The app currently listens on port `8080`.
- For production, replace hard-coded fallback secrets with strong environment variables.
- If using MongoDB Atlas, allow your current IP address in Atlas Network Access and set `ATLASDB_URL` to your Atlas connection string.

## Author

Created by [varish2001](https://github.com/varish2001).

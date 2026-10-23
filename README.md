# 📚 LibraFlow — Library Management System

A full-stack web application designed to simplify library operations by managing book catalogues, library members, book circulation, and transaction history through a modern web interface.

<p align="center">
  <strong>React · Vite · Node.js · Express.js · MongoDB Atlas</strong>
</p>

---

## 🌐 Live Application

| Resource | Link |
|---|---|
| **Live Frontend** | [Open LibraFlow](https://libra-flow-library-management-syste.vercel.app/) |
| **Backend REST API** | [Render API](https://libraflow-library-management-api.onrender.com) |
| **API Health Check** | [Check Backend Status](https://libraflow-library-management-api.onrender.com/api/health) |
| **GitHub Repository** | [LibraFlow Source Code](https://github.com/Ams1421/LibraFlow-Library-Management-System) |

---

## 📖 Project Overview

LibraFlow is a full-stack Library Management System developed to organize book records, maintain member information, and manage book issue and return operations. It provides a centralized interface for librarians to access catalogue information, track book availability, and review circulation transactions.

The application uses React and Vite for the frontend, Node.js and Express.js for the backend REST API, and MongoDB Atlas for cloud-based data storage. The frontend and backend are deployed separately, allowing the application to be accessed through a web browser.

## 🎯 Objectives

- Maintain an organized digital book catalogue.
- Register and manage library member records.
- Track book availability and inventory quantities.
- Process book issue and return transactions.
- Maintain transaction history, including issue dates, due dates, return dates, and statuses.
- Display library statistics through a dashboard.
- Provide a deployed, accessible full-stack application.

## ✨ Features

### 1. Dashboard
- Displays key library statistics, including total books, registered members, issued books, and returned books.
- Shows recent circulation activity.
- Provides quick navigation to common library operations.

### 2. Book Management
- View and manage book catalogue records.
- Add, edit, and delete book records.
- Search book records and navigate through paginated results.
- Maintain total and available inventory quantities.

### 3. Member Management
- Register and maintain library member information.
- View, search, edit, and delete member records.
- Apply backend safeguards, including duplicate-email checks.
- Prevent deletion of members with active loans, according to the implemented safeguards.

### 4. Book Issue and Return
- Select an available book and a registered member.
- Record book issue and due dates.
- Process book returns.
- Update available inventory when books are issued or returned.

### 5. Transaction History
- View book circulation records.
- Review issue dates, due dates, return dates, and transaction statuses.
- Filter transactions by status and navigate through records.

### 6. Settings and System Health
- Display application and database configuration information.
- Check backend connectivity through the health endpoint.
- View the current connection status reported by the application.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React 19 | Component-based frontend user interface |
| Vite 8 | Frontend development server and production build |
| JavaScript | Application logic and interactivity |
| HTML5 | Web page structure |
| CSS3 | Styling and responsive layouts |
| Node.js | Backend JavaScript runtime |
| Express.js | REST API and request handling |
| MongoDB Atlas | Cloud-hosted document database |
| Mongoose | MongoDB schemas, models, and database operations |
| dotenv | Backend environment configuration |
| ESLint | Frontend code quality checks |
| Git and GitHub | Version control and source-code hosting |
| Vercel | Frontend deployment |
| Render | Backend deployment |

## 🏗️ System Architecture

LibraFlow follows a three-tier application architecture.

1. **Presentation Layer:** The React frontend renders pages, forms, tables, dashboard cards, and user feedback.
2. **Application Layer:** The Express.js API processes HTTP requests, applies application logic, and returns JSON responses.
3. **Data Layer:** MongoDB Atlas stores book, member, and transaction documents, accessed through Mongoose models.

### Application Flow

```text
User / Web Browser
        |
        v
React + Vite Frontend
        |
        | HTTP / JSON
        v
Node.js + Express REST API
        |
        v
Mongoose Models
        |
        v
MongoDB Atlas (LibraryDB)
```

### Deployment

- **Frontend:** Vercel
- **Backend API:** Render
- **Database:** MongoDB Atlas

## 🗃️ Database Design

The application uses three principal data models.

| Model | Purpose |
|---|---|
| **Book** | Stores book details, identifiers, categories, total quantity, and available quantity. |
| **Member** | Stores library member details and contact information. |
| **Transaction** | Records book issue and return activity, linking a book with a member and maintaining dates and status. |

Book metadata was initially imported from Open Library. The initial import contained 500 book records. Imported catalogue metadata does not necessarily represent physical stock; inventory quantities must be maintained separately.

## 🔌 API Overview

The backend exposes REST-style endpoints under the `/api` prefix.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend availability |
| GET | `/api/books` | Retrieve book records |
| POST | `/api/books` | Create a book record |
| PUT | `/api/books/:id` | Update a book record |
| DELETE | `/api/books/:id` | Delete a book record |
| GET | `/api/members` | Retrieve member records |
| POST | `/api/members` | Create a member record |
| PUT | `/api/members/:id` | Update a member record |
| DELETE | `/api/members/:id` | Delete a member, subject to safeguards |
| POST | `/api/transactions/issue` | Issue an available book |
| PUT | `/api/transactions/:id/return` | Record a book return |

The table summarizes the principal implemented routes. Request-body fields and additional parameters should be checked in the corresponding source files.

## 📂 Project Structure

```text
LibraFlow-Library-Management-System/
├── client/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       └── pages/
│           ├── Books.jsx
│           ├── Members.jsx
│           ├── IssueReturn.jsx
│           ├── Transactions.jsx
│           └── Settings.jsx
├── server/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Book.js
│   │   ├── Member.js
│   │   └── Transaction.js
│   ├── controllers/
│   ├── routes/
│   ├── scripts/
│   ├── server.js
│   └── .env
├── docs/
├── .gitignore
└── README.md
```

*Note: This is a high-level overview. Refer to the repository for the complete directory structure.*

## ⚙️ Local Installation and Setup

### Prerequisites

Install the following software before running the project:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account or an accessible MongoDB instance
- [Visual Studio Code](https://code.visualstudio.com/) (recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/Ams1421/LibraFlow-Library-Management-System.git
cd LibraFlow-Library-Management-System
```

### 2. Configure the Backend

Open a terminal in the server directory:

```bash
cd server
npm install
```

Create a `server/.env` file with the following configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Replace the placeholder with your MongoDB connection string. Keep this file private and never commit database credentials to GitHub.

Start the backend:

```bash
npm run dev
```

The backend should run at:

```text
http://localhost:5000
```

Verify the health endpoint:

```text
http://localhost:5000/api/health
```

### 3. Configure the Frontend

Open a separate terminal:

```bash
cd client
npm install
```

If required, create a `client/.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed in the terminal, typically:

```text
http://localhost:5173
```

### 4. Validate the Frontend

Run the following commands from the `client` directory:

```bash
npm run lint
npm run build
```

These commands check the frontend source for lint issues and generate the production build.

## ☁️ Deployment Configuration

The production frontend and backend use separate hosting platforms.

| Setting | Value |
|---|---|
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Database | MongoDB Atlas |
| Frontend API variable | `VITE_API_URL` |
| Backend port variable | `PORT` |
| Database connection variable | `MONGODB_URI` |

For production, configure `VITE_API_URL` to point to the deployed backend API base URL:

```env
VITE_API_URL=https://libraflow-library-management-api.onrender.com/api
```

Configure `MONGODB_URI` in the backend hosting environment. Do not put database credentials in frontend environment variables or publish them in source control.

## 🧪 Testing and Verification

The following checks were completed during project verification:

- Frontend ESLint check completed without reported lint errors.
- Vite production build completed successfully.
- Backend startup and MongoDB connectivity were verified through deployment logs.
- The deployed health endpoint returned a successful response.
- Core book and member CRUD operations were manually tested.
- The issue-and-return workflow was verified using one available book copy.
- Inventory quantity changed from `1` to `0` on issue and from `0` to `1` on return.
- The returned transaction remained in the transaction history with its return date and `Returned` status.
- The deployed dashboard displayed database-backed statistics.

These results document the checks performed; they do not represent formal load testing, penetration testing, or a comprehensive automated end-to-end test suite.

## 🔐 Security Considerations

- Store credentials in environment variables and never commit secrets to the repository.
- Use a dedicated MongoDB database user with only the required permissions.
- Restrict MongoDB Atlas network access rather than leaving broad access rules permanently enabled.
- Configure CORS to permit only the intended frontend origin.
- Add authentication and role-based authorization before using the application with real member data.
- Review dependency audit findings and apply compatible security updates.
- Back up the database and establish a recovery process before production use.

## 🚀 Future Enhancements

- Secure login and role-based access control.
- Server-side search, sorting, and pagination across all records.
- Due-date reminders and overdue-book tracking.
- Fine calculation and downloadable reports.
- Barcode or QR-code scanning for book circulation.
- Automated API integration and browser end-to-end tests.
- Improved accessibility, logging, monitoring, and backup management.

## 📚 Data Source

Book metadata was imported from [Open Library](https://openlibrary.org/), which provides book-related catalogue information and APIs.

- Open Library: https://openlibrary.org/
- Open Library API documentation: https://openlibrary.org/developers/api

The imported metadata is used to populate the catalogue. It should not be interpreted as verification of physical book ownership or stock availability.

## 📖 References

1. React Documentation — https://react.dev/
2. Vite Documentation — https://vite.dev/
3. Express.js Documentation — https://expressjs.com/
4. Node.js Documentation — https://nodejs.org/docs/
5. MongoDB Documentation — https://www.mongodb.com/docs/
6. Mongoose Documentation — https://mongoosejs.com/docs/
7. Vercel Documentation — https://vercel.com/docs
8. Render Documentation — https://render.com/docs
9. Open Library API Documentation — https://openlibrary.org/developers/api

## 👨‍💻 Author

**Ram das Chilakalapudi**

Project: **LibraFlow — Library Management System**

Submission contact: **hr@inspireleap.in**

GitHub Repository: https://github.com/Ams1421/LibraFlow-Library-Management-System

---

<p align="center">
  <strong>LibraFlow — Organizing Library Operations Through Technology</strong>
</p>

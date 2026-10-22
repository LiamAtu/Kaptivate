# Kaptivate – Website & Client Portal

![Ionic](https://img.shields.io/badge/Ionic-3880FF?style=for-the-badge&logo=ionic&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

**Work in progress.** The website and client portal are built, but Firebase isn't connected yet and the website text is still placeholder content.
A website and client portal for **Kaptivate**, a video production and photography business in Galway.

Visitors can browse services, send an enquiry and request a booking. Clients get their own portal to follow each stage of their project, share files, accept quotes, sign contracts, view invoices and message the owner. The owner runs every client's work from the same portal.

---

## Features

### Public website
| Page | What it does |
|---|---|
| Home, Services, About | Who Kaptivate is and what it offers (text lives in `src/app/site-content.ts`) |
| Contact | Enquiry form – anyone can send one, only the owner can read them |
| Booking | Signed-in clients request a date for a shoot and can cancel it |

### Client portal
| Page | Client | Owner |
|---|---|---|
| **Dashboard** | Active projects, unread messages, quotes to review, amount to pay | Same across all clients, plus new enquiries and bookings |
| **Projects** | Progress bar and every stage of each project | Create projects, tick off stages (progress and status update automatically) |
| **Files** | Upload footage and assets, download finished videos | Upload drafts and final deliveries to any client |
| **Messages** | Conversations with the owner, unread badges | Reply to every client from one inbox |
| **Quotes** | Accept or decline a priced quote | Build quotes from line items |
| **Contracts** | Sign by typing your full name | Send terms from an editable template |
| **Invoices** | View, print or save as PDF; overdue ones are flagged | Raise invoices (numbered automatically), mark them paid |
| **Project brief** | Describe a new project before a quote | Read every client's briefs |
| **Clients** | – | Every client, their projects and money owed |
| **Enquiries & bookings** | – | Confirm or decline bookings, handle contact enquiries |

---

## How it's built

- **Ionic + Angular 20** with standalone components, signals and lazy-loaded routes
- **Firebase Authentication** for client and owner logins (including password reset)
- **Cloud Firestore** for all data, read live so every page updates instantly
- **Firebase Storage** for uploaded files, with upload progress
- **Role-based access** at three levels:
  - **Route guards:** `authGuard` keeps signed-out users out of the portal, and `adminGuard` keeps clients out of owner pages
  - **Firestore rules** (`firestore.rules`): clients can only read documents with their own `clientId`. They can only *accept/decline* a quote or *sign* a contract, never change prices or terms, and can't make themselves an admin
  - **Storage rules** (`storage.rules`): each client's files sit under `clients/{clientId}/`, so only that client and the owner can reach them

### Project structure
| Path | What's there |
|---|---|
| `src/app/models/` | TypeScript interfaces for users, projects, messages, files, quotes, contracts, invoices, briefs, bookings and enquiries |
| `src/app/services/auth.ts` | Sign up, log in, password reset, and the signed-in user's profile and role |
| `src/app/services/data.ts` | All Firestore reads and writes. `mine()` returns everything for the owner and only your own documents for a client |
| `src/app/services/storage.ts` | Uploads to Firebase Storage and records each file in Firestore |
| `src/app/guards/` | `authGuard` and `adminGuard` |
| `src/app/pages/portal/` | The portal layout (side menu) and each portal page |
| `src/app/pages/` | Public website pages, login and sign-up |
| `src/app/site-content.ts` | Website text, services and contact details in one file |

---

## Set it up

**You'll need:** Node.js 20+, a free [Firebase](https://firebase.google.com) project, and the Firebase CLI (`npm install -g firebase-tools`).

1. **Install**
   ```bash
   git clone https://github.com/LiamAtu/Kaptivate.git
   cd Kaptivate
   npm install
   ```
2. **Firebase project.** In the Firebase console, turn on **Authentication → Email/Password**, create a **Firestore** database and turn on **Storage**.
3. **Config.** Copy `src/environments/environment.example.ts` to `environment.ts` and `environment.prod.ts` (set `production: true` in the second), and paste in your web app's config from *Project settings → Your apps*. Both files are git-ignored.
4. **Security rules.**
   ```bash
   firebase login
   firebase use --add            # pick your project
   firebase deploy --only firestore:rules,storage
   ```
5. **Run it:** `npm start`, then open http://localhost:4200.
6. **Make the owner account.** Sign up on the site, then in Firestore open `users/{your uid}` and change `role` from `client` to `admin`. Sign out and back in to see the owner tools.
7. **Website text.** Edit `src/app/site-content.ts` with the real services, about text and contact details.

### Deploy
```bash
npm run build
firebase deploy --only hosting
```

---

### Connect with me
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/liam-kapelianis-a42b3b403)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/LiamAtu)

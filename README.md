# Kaptivate – Client Portal

![Ionic](https://img.shields.io/badge/Ionic-3880FF?style=for-the-badge&logo=ionic&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

A website and client portal I'm building for **Kaptivate**, a videography and photography business in Galway.

Clients can see how their project is progressing, share files and message the owner, all in one place. The owner manages every client's project, quote and delivery from an admin view.

> **Status: in development.** The site structure, data models, security rules and login/sign-up are in place. The portal features are being built now. Active work is on the `develop` branch.

---

## Features

### Public website
- Home, About, Services and Contact pages
- Booking page for new enquiries

### Client portal (signed-in clients)
| Page | What it does |
|---|---|
| Dashboard | Overview of the client's projects |
| Progress | Each project's stages, ticked off as they're completed |
| Files | Upload raw footage and download finished work |
| Comms | Message threads with the owner, with unread tracking |
| Proposals, Contract, Invoices, Forms | Quotes and paperwork for each project |

### Owner (admin) view
- Set quotes, update each project's stage and deliver final files
- Reply to every client from one inbox

---

## How it's built

- **Ionic + Angular** with standalone components and lazy-loaded routes
- **Firebase Authentication** for client and owner logins
- **Cloud Firestore** for users, projects, message threads and bookings
- **Firebase Storage** for uploaded files
- **Role-based access**
  - Route guards keep signed-out users out of the portal (`authGuard`) and clients out of admin pages (`adminGuard`)
  - Firestore security rules let clients read only their own projects, threads and messages, and stop users from changing their own role

### Data model
| Model | Key fields |
|---|---|
| `IUser` | role (`admin` / `client`), company, contact details |
| `IProject` | status, progress %, list of stages, start and due dates |
| `IThread` / `IMessage` | subject, last message, unread flags, sender role |
| `IFile` | file name, size, type, who uploaded it, download URL |
| `IBooking` | service, date, status, payment status |

---

## Roadmap
- [x] Site structure and routing
- [x] Data models
- [x] Firebase setup (Auth, Firestore, Storage)
- [x] Login and sign-up (`develop`)
- [x] Firestore and Storage security rules (`develop`)
- [ ] Project progress tracking
- [ ] File upload and delivery
- [ ] Client–owner messaging
- [ ] Quotes and invoices
- [ ] Owner admin dashboard

---

## Run it locally

**You'll need:** Node.js 18+ and the Ionic CLI (`npm install -g @ionic/cli`).

```bash
git clone https://github.com/LiamAtu/Kaptivate.git
cd Kaptivate
npm install
```

Add your own Firebase project's config to `src/environments/environment.ts`, then:

```bash
ionic serve
```

The app opens at `http://localhost:8100`.

---

### Connect with me
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/liam-kapelianis-a42b3b403)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/LiamAtu)

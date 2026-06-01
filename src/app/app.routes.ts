import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [

  // Default redirect
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Public routes
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.page').then(m => m.AboutPage)
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services.page').then(m => m.ServicesPage)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.page').then(m => m.ContactPage)
  },
  {
    path: 'booking',
    loadComponent: () => import('./pages/booking/booking.page').then(m => m.BookingPage)
  },

  // Auth routes
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup.page').then(m => m.SignupPage)
  },

  // Protected portal routes — authGuard checks login
  {
    path: 'portal',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/portal/dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'progress',
        loadComponent: () => import('./pages/portal/progress/progress.page').then(m => m.ProgressPage)
      },
      {
        path: 'files',
        loadComponent: () => import('./pages/portal/files/files.page').then(m => m.FilesPage)
      },
      {
        path: 'comms',
        loadComponent: () => import('./pages/portal/comms/comms.page').then(m => m.CommsPage)
      },
      {
        path: 'contract',
        loadComponent: () => import('./pages/portal/contract/contract.page').then(m => m.ContractPage)
      },
      {
        path: 'invoices',
        loadComponent: () => import('./pages/portal/invoices/invoices.page').then(m => m.InvoicesPage)
      },
      {
        path: 'forms',
        loadComponent: () => import('./pages/portal/forms/forms.page').then(m => m.FormsPage)
      },
      {
        path: 'proposals',
        loadComponent: () => import('./pages/portal/proposals/proposals.page').then(m => m.ProposalsPage)
      },
    ]
  },

  // Catch-all
  { path: '**', redirectTo: 'home' }

];
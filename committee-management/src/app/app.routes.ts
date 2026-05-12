import { Routes } from "@angular/router";
import { authGuard, subAdminGuard, guestGuard, superAdminGuard } from "./guards/auth.guard";

export const routes: Routes = [
  // Public landing page
  { path: "", loadComponent: () => import("./pages/landing/landing.component").then(m => m.LandingComponent) },

  // Auth
  {
    path: "auth",
    children: [
      { path: "login", canActivate: [guestGuard], loadComponent: () => import("./pages/auth/login/login.component").then(m => m.LoginComponent) },
      { path: "register", canActivate: [guestGuard], loadComponent: () => import("./pages/auth/register/register.component").then(m => m.RegisterComponent) },
      { path: "forgot-password", loadComponent: () => import("./pages/auth/forgot-password/forgot-password.component").then(m => m.ForgotPasswordComponent) },
      { path: "", redirectTo: "login", pathMatch: "full" }
    ]
  },

  // Super Admin — completely separate dashboard
  {
    path: "super-admin",
    canActivate: [superAdminGuard],
    loadComponent: () => import("./pages/super-admin/super-admin.component").then(m => m.SuperAdminComponent)
  },

  // Sub Admin dashboard — all authenticated sub_admin users
  {
    path: "",
    canActivate: [subAdminGuard],
    loadComponent: () => import("./layout/main-layout/main-layout.component").then(m => m.MainLayoutComponent),
    children: [
      { path: "dashboard", loadComponent: () => import("./pages/dashboard/dashboard.component").then(m => m.DashboardComponent) },
      // MY COMMITTEES — committees created by this sub_admin
      { path: "committees", loadComponent: () => import("./pages/committees/committees.component").then(m => m.CommitteesComponent) },
      { path: "committees/create", loadComponent: () => import("./pages/create-committee/create-committee.component").then(m => m.CreateCommitteeComponent) },
      { path: "committees/:id", loadComponent: () => import("./pages/committee-detail/committee-detail.component").then(m => m.CommitteeDetailComponent) },
      // JOINED COMMITTEES — committees this sub_admin participates in
      { path: "joined-committees", loadComponent: () => import("./pages/joined-committees/joined-committees.component").then(m => m.JoinedCommitteesComponent) },
      // BROWSE — public committees to join
      { path: "browse", loadComponent: () => import("./pages/browse-committees/browse-committees.component").then(m => m.BrowseCommitteesComponent) },
      // MEMBERS — people in my committees
      { path: "members", loadComponent: () => import("./pages/members/members.component").then(m => m.MembersComponent) },
      // PAYMENTS — approve payments for my committees + upload my own payments
      { path: "payments", loadComponent: () => import("./pages/payments/payments.component").then(m => m.PaymentsComponent) },
      { path: "my-payments", loadComponent: () => import("./pages/my-payments/my-payments.component").then(m => m.MyPaymentsComponent) },
      { path: "join-requests", loadComponent: () => import("./pages/join-requests/join-requests.component").then(m => m.JoinRequestsComponent) },
      { path: "payouts", loadComponent: () => import("./pages/payouts/payouts.component").then(m => m.PayoutsComponent) },
      { path: "reports", loadComponent: () => import("./pages/reports/reports.component").then(m => m.ReportsComponent) },
      { path: "profile", loadComponent: () => import("./pages/profile/profile.component").then(m => m.ProfileComponent) }
    ]
  },

  { path: "**", redirectTo: "/" }
];

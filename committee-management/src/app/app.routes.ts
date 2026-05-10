import { Routes } from "@angular/router";
import { authGuard, adminGuard, memberGuard, guestGuard } from "./guards/auth.guard";

export const routes: Routes = [
  { path: "", redirectTo: "/dashboard", pathMatch: "full" },
  {
    path: "auth",
    children: [
      { path: "login", canActivate: [guestGuard], loadComponent: () => import("./pages/auth/login/login.component").then(m => m.LoginComponent) },
      { path: "register", canActivate: [guestGuard], loadComponent: () => import("./pages/auth/register/register.component").then(m => m.RegisterComponent) },
      { path: "forgot-password", loadComponent: () => import("./pages/auth/forgot-password/forgot-password.component").then(m => m.ForgotPasswordComponent) },
      { path: "", redirectTo: "login", pathMatch: "full" }
    ]
  },
  {
    path: "member-portal",
    canActivate: [authGuard],
    loadComponent: () => import("./pages/member-portal/member-portal.component").then(m => m.MemberPortalComponent)
  },
  {
    path: "",
    canActivate: [adminGuard],
    loadComponent: () => import("./layout/main-layout/main-layout.component").then(m => m.MainLayoutComponent),
    children: [
      { path: "dashboard", loadComponent: () => import("./pages/dashboard/dashboard.component").then(m => m.DashboardComponent) },
      { path: "committees", loadComponent: () => import("./pages/committees/committees.component").then(m => m.CommitteesComponent) },
      { path: "committees/create", loadComponent: () => import("./pages/create-committee/create-committee.component").then(m => m.CreateCommitteeComponent) },
      { path: "committees/:id", loadComponent: () => import("./pages/committee-detail/committee-detail.component").then(m => m.CommitteeDetailComponent) },
      { path: "members", loadComponent: () => import("./pages/members/members.component").then(m => m.MembersComponent) },
      { path: "payments", loadComponent: () => import("./pages/payments/payments.component").then(m => m.PaymentsComponent) },
      { path: "join-requests", loadComponent: () => import("./pages/join-requests/join-requests.component").then(m => m.JoinRequestsComponent) },
      { path: "payouts", loadComponent: () => import("./pages/payouts/payouts.component").then(m => m.PayoutsComponent) },
      { path: "reports", loadComponent: () => import("./pages/reports/reports.component").then(m => m.ReportsComponent) },
      { path: "profile", loadComponent: () => import("./pages/profile/profile.component").then(m => m.ProfileComponent) }
    ]
  },
  { path: "**", redirectTo: "/dashboard" }
];

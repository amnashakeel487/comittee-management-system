import { Routes } from "@angular/router";
import { subAdminGuard, guestGuard, superAdminGuard, superAdminGuestGuard } from "./guards/auth.guard";

export const routes: Routes = [
  // Public landing page
  { path: "", loadComponent: () => import("./pages/landing/landing.component").then(m => m.LandingComponent) },

  // Sub-Admin Auth
  {
    path: "auth",
    children: [
      { path: "login", canActivate: [guestGuard], loadComponent: () => import("./pages/auth/login/login.component").then(m => m.LoginComponent) },
      { path: "register", canActivate: [guestGuard], loadComponent: () => import("./pages/auth/register/register.component").then(m => m.RegisterComponent) },
      { path: "forgot-password", loadComponent: () => import("./pages/auth/forgot-password/forgot-password.component").then(m => m.ForgotPasswordComponent) },
      { path: "", redirectTo: "login", pathMatch: "full" }
    ]
  },

  // ── SUPER ADMIN — completely separate section ──────────────
  {
    path: "super-admin",
    children: [
      // Dedicated super admin login page
      { path: "login", canActivate: [superAdminGuestGuard], loadComponent: () => import("./pages/super-admin/super-admin-login.component").then(m => m.SuperAdminLoginComponent) },
      // Super admin dashboard (protected)
      { path: "dashboard", canActivate: [superAdminGuard], loadComponent: () => import("./pages/super-admin/super-admin-shell.component").then(m => m.SuperAdminShellComponent),
        children: [
          { path: "", redirectTo: "overview", pathMatch: "full" },
          { path: "overview", loadComponent: () => import("./pages/super-admin/pages/sa-overview.component").then(m => m.SaOverviewComponent) },
          { path: "users", loadComponent: () => import("./pages/super-admin/pages/sa-users.component").then(m => m.SaUsersComponent) },
          { path: "committees", loadComponent: () => import("./pages/super-admin/pages/sa-committees.component").then(m => m.SaCommitteesComponent) },
          { path: "fraud", loadComponent: () => import("./pages/super-admin/pages/sa-fraud.component").then(m => m.SaFraudComponent) },
          { path: "payments", loadComponent: () => import("./pages/super-admin/pages/sa-payments.component").then(m => m.SaPaymentsComponent) },
          { path: "announcements", loadComponent: () => import("./pages/super-admin/pages/sa-announcements.component").then(m => m.SaAnnouncementsComponent) },
          { path: "profile", loadComponent: () => import("./pages/super-admin/pages/sa-profile.component").then(m => m.SaProfileComponent) },
          { path: "verification", loadComponent: () => import("./pages/super-admin/pages/sa-verification.component").then(m => m.SaVerificationComponent) },
        ]
      },
      // Redirect /super-admin → /super-admin/login
      { path: "", redirectTo: "login", pathMatch: "full" },
      { path: "**", redirectTo: "login" }
    ]
  },

  // Sub Admin dashboard
  {
    path: "",
    canActivate: [subAdminGuard],
    loadComponent: () => import("./layout/main-layout/main-layout.component").then(m => m.MainLayoutComponent),
    children: [
      { path: "dashboard", loadComponent: () => import("./pages/dashboard/dashboard.component").then(m => m.DashboardComponent) },
      { path: "committees", loadComponent: () => import("./pages/committees/committees.component").then(m => m.CommitteesComponent) },
      { path: "committees/create", loadComponent: () => import("./pages/create-committee/create-committee.component").then(m => m.CreateCommitteeComponent) },
      { path: "committees/:id", loadComponent: () => import("./pages/committee-detail/committee-detail.component").then(m => m.CommitteeDetailComponent) },
      { path: "joined-committees", loadComponent: () => import("./pages/joined-committees/joined-committees.component").then(m => m.JoinedCommitteesComponent) },
      { path: "browse", loadComponent: () => import("./pages/browse-committees/browse-committees.component").then(m => m.BrowseCommitteesComponent) },
      { path: "members", loadComponent: () => import("./pages/members/members.component").then(m => m.MembersComponent) },
      { path: "payments", loadComponent: () => import("./pages/payments/payments.component").then(m => m.PaymentsComponent) },
      { path: "my-payments", loadComponent: () => import("./pages/my-payments/my-payments.component").then(m => m.MyPaymentsComponent) },
      { path: "verification", loadComponent: () => import("./pages/verification/verification-request.component").then(m => m.VerificationRequestComponent) },
      { path: "reviews", loadComponent: () => import("./pages/reviews/reviews.component").then(m => m.ReviewsComponent) },
      { path: "join-requests", loadComponent: () => import("./pages/join-requests/join-requests.component").then(m => m.JoinRequestsComponent) },
      { path: "payouts", loadComponent: () => import("./pages/payouts/payouts.component").then(m => m.PayoutsComponent) },
      { path: "reports", loadComponent: () => import("./pages/reports/reports.component").then(m => m.ReportsComponent) },
      { path: "profile", loadComponent: () => import("./pages/profile/profile.component").then(m => m.ProfileComponent) }
    ]
  },

  { path: "**", redirectTo: "/" }
];

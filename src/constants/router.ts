import type { Role } from "@/generated/prisma";

class Router {
  static HOME = "/";
  static SIGN_IN = "/signin";
  static UNAUTHORIZED = "/unauthorized";

  // Role-specific dashboards
  static DASHBOARD = "/dashboard";
  static DASHBOARD_SUPER_ADMIN = "/dashboard/super-admin";
  static DASHBOARD_ORG_ADMIN = "/dashboard/org-admin";
  static DASHBOARD_USER = "/dashboard/user";
  
  // Legal
  static TERMS = "/terms";
  static PRIVACY = "/privacy";

  // Organizations
  static ORGANIZATIONS = "/orgs";
  static CREATE_ORGANIZATION = `${Router.ORGANIZATIONS}/create`;
  static organizationDetail = (id: string) => `${Router.ORGANIZATIONS}/${id}`;
  static organizationForecasts = (id: string) =>
    `${Router.ORGANIZATIONS}/${id}/forecasts`;
  static forecastDetail = (orgId: string, forecastId: string) =>
    `${Router.ORGANIZATIONS}/${orgId}/forecasts/${forecastId}`;

  // Settings
  static SETTINGS = "/settings"; // swapnil got it

  // Org Admin
  static ORG_ADMIN_USERS = "/users";
  static ORG_ADMIN_FORECASTS = "/forecasts";
  static orgAdminForecastDetail = (id: string) =>
    `${Router.ORG_ADMIN_FORECASTS}/${id}`;

  // Forecasts
  static FORECASTS = "/forecasts";
  static forecastDetailById = (id: string) => `${Router.FORECASTS}/${id}`;

  // User
  static USER_FORECASTS = "/my-forecasts";
  static USER_FORECAST_DETAIL = (id: string) => `/f/${id}`;
  static FORECAST_LEADERBOARD = (id: string) => `/f/${id}/leaderboard`; // public leaderboard, super-admin leader, org-admin, player
}

export const DASHBOARD_BY_ROLE: Record<Role, string> = {
  SUPER_ADMIN: Router.DASHBOARD_SUPER_ADMIN,
  ORG_ADMIN: Router.DASHBOARD_ORG_ADMIN,
  USER: Router.DASHBOARD_USER,
};

export default Router;

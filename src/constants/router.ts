class Router {
  static HOME = "/";
  static SIGN_IN = "/signin";
  static UNAUTHORIZED = "/unauthorized";

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

  // Org Admin Leaderboard
  static ORG_ADMIN_LEADERBOARD = "/leaderboard";
  static ORG_ADMIN_LEADERBOARD_USERS = "/leaderboard/users";
  static ORG_ADMIN_LEADERBOARD_PREDICTIONS = "/leaderboard/predictions";
  static ORG_ADMIN_LEADERBOARD_CATEGORIES = "/leaderboard/categories";

  // Forecasts
  static FORECASTS = "/forecasts";
  static forecastDetailById = (id: string) => `${Router.FORECASTS}/${id}`;

  // User
  static USER_FORECASTS = "/f";
  static USER_FORECAST_DETAIL = (id: string) => `/f/${id}`;
  static FORECAST_LEADERBOARD = (id: string) => `/f/${id}/leaderboard`; // public leaderboard, super-admin leader, org-admin, player
}

export default Router;

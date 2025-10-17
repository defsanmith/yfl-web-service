class Router {
  static HOME = "/";
  static SIGN_IN = "/api/auth/signin";
  static UNAUTHORIZED = "/unauthorized";

  // Organizations
  static ORGANIZATIONS = "/orgs";
  static CREATE_ORGANIZATION = `${Router.ORGANIZATIONS}/create`;
  static organizationDetail = (id: string) => `${Router.ORGANIZATIONS}/${id}`;
  static organizationForecasts = (id: string) =>
    `${Router.ORGANIZATIONS}/${id}/forecasts`;
  static forecastDetail = (orgId: string, forecastId: string) =>
    `${Router.ORGANIZATIONS}/${orgId}/forecasts/${forecastId}`;

  // Settings
  static SETTINGS = "/settings";

  // Org Admin
  static ORG_ADMIN_USERS = "/users";
  static ORG_ADMIN_FORECASTS = "/forecasts";
  static orgAdminForecastDetail = (id: string) =>
    `${Router.ORG_ADMIN_FORECASTS}/${id}`;

  // Forecasts
  static FORECASTS = "/forecasts";
  static forecastDetailById = (id: string) => `${Router.FORECASTS}/${id}`;
}

export default Router;

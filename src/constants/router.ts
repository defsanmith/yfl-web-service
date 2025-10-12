class Router {
  static HOME = "/";
  static SIGN_IN = "/api/auth/signin";
  static UNAUTHORIZED = "/unauthorized";

  // Organizations
  static ORGANIZATIONS = "/orgs";
  static CREATE_ORGANIZATION = `${Router.ORGANIZATIONS}/create`;
  static organizationDetail = (id: string) => `${Router.ORGANIZATIONS}/${id}`;

  // Settings
  static SETTINGS = "/settings";
}

export default Router;

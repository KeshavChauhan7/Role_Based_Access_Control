const is_production =
  process.env.REACT_APP_IS_PRODUCTION === "true" ? true : false;

const config = {
  backendBaseURLForUser: is_production
    ? process.env.REACT_APP_USER_BASE_BACKEND_URL_PROD
    : process.env.REACT_APP_USER_BASE_BACKEND_URL_DEV,
  backendBaseUrlForAdmin: is_production
    ? process.env.REACT_APP_ADMIN_BASE_BACKEND_URL_PROD
    : process.env.REACT_APP_ADMIN_BASE_BACKEND_URL_DEV,
};

export { config };

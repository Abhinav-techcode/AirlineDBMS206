const API_BASE_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

const buildError = (message, status, details) => {
  const error = new Error(message || "Request failed.");
  error.status = status;
  error.details = details || null;
  return error;
};

export const apiRequest = async (path, options = {}) => {
  const { token, headers = {}, body, ...restOptions } = options;
  const requestHeaders = {
    ...headers,
  };

  let requestBody = body;
  if (body && !(body instanceof FormData) && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: requestHeaders,
    body: requestBody,
  });

  const rawText = await response.text();
  let payload = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch (error) {
      payload = { message: rawText };
    }
  }

  if (!response.ok) {
    throw buildError(
      payload?.message || `Request failed with status ${response.status}.`,
      response.status,
      payload?.details || null
    );
  }

  return payload;
};

export const apiConfig = {
  baseUrl: API_BASE_URL,
};

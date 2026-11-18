'use strict';

const addApiKey = (request, z, bundle) => {
	if (bundle.authData.apiKey) request.headers.Authorization = `Bearer ${bundle.authData.apiKey}`;
	request.headers.Accept = 'application/json';
	return request;
};

/** Turns QRavate errors ({ error: { message, code } }) into readable Zapier errors. */
const handleErrors = (response, z) => {
	if (response.status < 400) return response;
	let error = {};
	try {
		error = JSON.parse(response.content).error ?? {};
	} catch {
		// Not JSON: keep the generic message.
	}
	const message = error.message || `QRavate API error (HTTP ${response.status}).`;
	if (response.status === 401) throw new z.errors.ExpiredAuthError(message);
	if (response.status === 429) throw new z.errors.ThrottledError(message, 60);
	throw new z.errors.Error(message, error.code || 'ApiError', response.status);
};

module.exports = { addApiKey, handleErrors };

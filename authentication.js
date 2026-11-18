'use strict';

const { API_URL } = require('./lib');

module.exports = {
	type: 'custom',
	fields: [
		{
			key: 'apiKey',
			label: 'API Key',
			type: 'password',
			required: true,
			helpText:
				'Starts with `sk_`. Create it in your QRavate account, under **API et webhooks** (Pro and Max plans).',
		},
	],
	test: { url: `${API_URL}/me` },
	connectionLabel: (z, bundle) => bundle.inputData.workspace?.name ?? 'QRavate',
};

'use strict';

const { API_URL, data, sampleQr } = require('../lib');

// Hidden trigger that feeds the "QR Code" dropdowns of the actions: the 200 latest QR codes
// (the API maximum). Older ones can still be used by mapping their ID.
module.exports = {
	key: 'qr_code_list',
	noun: 'QR Code',
	display: { label: 'List QR Codes', description: 'Lists QR codes for dropdowns.', hidden: true },
	operation: {
		perform: async (z) => data(await z.request({ url: `${API_URL}/qr`, params: { limit: 200 } })),
		sample: sampleQr,
	},
};

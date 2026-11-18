'use strict';

const { API_URL, data, qrCodeField, sampleQr, qrOutputFields } = require('../lib');

module.exports = {
	find_qr_code: {
		key: 'find_qr_code',
		noun: 'QR Code',
		display: { label: 'Find QR Code', description: 'Finds a QR code by text in its name or destination.' },
		operation: {
			inputFields: [{ key: 'name', label: 'Name or Destination', required: true, helpText: 'Text found in the name or the destination URL.' }],
			perform: async (z, bundle) =>
				data(await z.request({ url: `${API_URL}/qr`, params: { search: bundle.inputData.name, limit: 10 } })),
			sample: sampleQr,
			outputFields: qrOutputFields,
		},
	},
	get_qr_code_stats: {
		key: 'get_qr_code_stats',
		noun: 'Scan Stats',
		display: { label: 'Get QR Code Stats', description: 'Gets the scans of a QR code over a period (last 30 days by default).' },
		operation: {
			inputFields: [
				qrCodeField(),
				{ key: 'from', label: 'From', helpText: 'First day included, `YYYY-MM-DD` (Paris time).' },
				{ key: 'to', label: 'To', helpText: 'Last day included, `YYYY-MM-DD` (Paris time).' },
			],
			perform: async (z, bundle) => {
				const { id, from, to } = bundle.inputData;
				const params = { ...(from ? { from } : {}), ...(to ? { to } : {}) };
				const stats = data(await z.request({ url: `${API_URL}/qr/${encodeURIComponent(id)}/stats`, params }));
				return [{ id, ...stats }];
			},
			sample: { id: sampleQr.id, from: '2026-10-20', to: '2026-11-18', total: 42, uniques: 31, days: [{ day: '2026-11-18', scans: 3, uniques: 3 }] },
			outputFields: [
				{ key: 'total', label: 'Total Scans', type: 'integer' },
				{ key: 'uniques', label: 'Unique Visitors', type: 'integer' },
				{ key: 'from', label: 'From' },
				{ key: 'to', label: 'To' },
			],
		},
	},
};

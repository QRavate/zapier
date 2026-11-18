'use strict';

const authentication = require('./authentication');
const { addApiKey, handleErrors } = require('./middleware');
const hooks = require('./triggers/hooks');
const qrCodeList = require('./triggers/qr_code_list');
const creates = require('./creates/qr_code');
const searches = require('./searches/qr_code');

const byKey = (items) => Object.fromEntries(Object.values(items).map((item) => [item.key, item]));

module.exports = {
	version: require('./package.json').version,
	platformVersion: require('zapier-platform-core').version,
	authentication,
	beforeRequest: [addApiKey],
	afterResponse: [handleErrors],
	triggers: byKey({ ...hooks, qrCodeList }),
	creates: byKey(creates),
	searches: byKey(searches),
	searchOrCreates: {
		find_qr_code: {
			key: 'find_qr_code',
			display: { label: 'Find or Create QR Code', description: 'Finds a QR code by name, or creates it if none is found.' },
			search: 'find_qr_code',
			create: 'create_qr_code',
		},
	},
};

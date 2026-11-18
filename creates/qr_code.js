'use strict';

const { API_URL, data, qrCodeField, sampleQr, qrOutputFields } = require('../lib');

const action = (key, label, description, inputFields, perform) => ({
	key,
	noun: 'QR Code',
	display: { label, description },
	operation: { inputFields, perform, sample: sampleQr, outputFields: qrOutputFields },
});

const patch = (z, id, body) =>
	z.request({ url: `${API_URL}/qr/${encodeURIComponent(id)}`, method: 'PATCH', body }).then(data);

module.exports = {
	create_qr_code: action(
		'create_qr_code',
		'Create QR Code',
		'Creates a dynamic QR code. You can change its destination later without reprinting it.',
		[
			{ key: 'name', label: 'Name', required: true, helpText: 'Shown in your QRavate account. Scanners never see it.' },
			{ key: 'destination', label: 'Destination URL', required: true, helpText: 'Where scanners are sent, e.g. `https://example.com`.' },
		],
		async (z, bundle) =>
			data(await z.request({ url: `${API_URL}/qr`, method: 'POST', body: { name: bundle.inputData.name, destination: bundle.inputData.destination } })),
	),
	update_qr_code: action(
		'update_qr_code',
		'Update QR Code',
		'Changes the destination or the name of a QR code. The printed QR code stays the same.',
		[
			qrCodeField(),
			{ key: 'destination', label: 'New Destination URL', helpText: 'Leave empty to keep the current one.' },
			{ key: 'name', label: 'New Name', helpText: 'Leave empty to keep the current one.' },
		],
		async (z, bundle) => {
			const body = {};
			if (bundle.inputData.destination) body.destination = bundle.inputData.destination;
			if (bundle.inputData.name) body.name = bundle.inputData.name;
			if (!Object.keys(body).length) throw new z.errors.Error('Set a new destination or a new name.', 'InvalidInput', 400);
			return patch(z, bundle.inputData.id, body);
		},
	),
	set_qr_code_state: action(
		'set_qr_code_state',
		'Pause or Resume QR Code',
		'Pauses a QR code (scanners see a neutral page) or sends scans to its destination again.',
		[
			qrCodeField(),
			{ key: 'state', label: 'State', required: true, choices: { paused: 'Paused', active: 'Active' } },
		],
		async (z, bundle) => patch(z, bundle.inputData.id, { state: bundle.inputData.state }),
	),
};

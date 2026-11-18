'use strict';

const API_URL = process.env.QRAVATE_API_URL || 'https://www.qravate.com/api/v1';

/** `data` of a QRavate API response ({ data: ... }). */
const data = (response) => response.data.data;

/** Dropdown of the workspace's QR codes, used by every action that takes a QR code. */
const qrCodeField = (extra = {}) => ({
	key: 'id',
	label: 'QR Code',
	required: true,
	dynamic: 'qr_code_list.id.name',
	helpText: 'Pick a QR code, or map its ID from a previous step.',
	...extra,
});

const sampleQr = {
	id: 'qr_7f3a2c1b9d',
	code: 'AB23CD',
	name: 'Shop window poster',
	type: 'url',
	destination: 'https://example.com/spring-menu',
	state: 'active',
	short_url: 'HTTPS://QRAVATE.PAGE/AB23CD',
	folder_id: null,
	created_at: '2026-11-18T09:30:00.000Z',
	updated_at: '2026-11-18T09:30:00.000Z',
};

const qrOutputFields = [
	{ key: 'id', label: 'ID' },
	{ key: 'code', label: 'Code' },
	{ key: 'name', label: 'Name' },
	{ key: 'destination', label: 'Destination' },
	{ key: 'state', label: 'State' },
	{ key: 'short_url', label: 'Short URL (encoded in the QR code)' },
	{ key: 'created_at', label: 'Created At', type: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', type: 'datetime' },
];

module.exports = { API_URL, data, qrCodeField, sampleQr, qrOutputFields };

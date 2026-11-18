'use strict';

const { API_URL, data, sampleQr, qrOutputFields } = require('../lib');

/**
 * REST hook trigger on a QRavate webhook event. QRavate posts { event, created_at, data };
 * `toItem` turns `data` into the item Zapier passes to the next steps.
 */
const hookTrigger = ({ key, noun, label, description, event, toItem, inputFields = [], sample, listFromQr }) => ({
	key,
	noun,
	display: { label, description },
	operation: {
		type: 'hook',
		inputFields,
		performSubscribe: async (z, bundle) => {
			const body = { url: bundle.targetUrl, events: [event], source: 'zapier' };
			if (bundle.inputData.scan_threshold) body.scan_threshold = bundle.inputData.scan_threshold;
			return data(await z.request({ url: `${API_URL}/webhooks`, method: 'POST', body }));
		},
		performUnsubscribe: async (z, bundle) =>
			data(await z.request({ url: `${API_URL}/webhooks/${encodeURIComponent(bundle.subscribeData.id)}`, method: 'DELETE' })),
		perform: (z, bundle) => (bundle.cleanedRequest?.event === event ? [toItem(bundle.cleanedRequest.data, bundle)] : []),
		// Sample data while setting up the Zap: the latest QR codes, shaped like real events.
		performList: async (z, bundle) =>
			data(await z.request({ url: `${API_URL}/qr`, params: { limit: 3 } })).map((qr) => listFromQr(qr, bundle)),
		sample,
		outputFields: qrOutputFields,
	},
});

const asQr = (qr) => qr;
const versioned = (qr) => ({ ...qr, id: `${qr.id}:${qr.updated_at}`, qr_id: qr.id });

module.exports = {
	new_qr_code: hookTrigger({
		key: 'new_qr_code',
		noun: 'QR Code',
		label: 'New QR Code',
		description: 'Triggers when a QR code is created in your workspace.',
		event: 'qr.created',
		toItem: asQr,
		listFromQr: asQr,
		sample: sampleQr,
	}),
	destination_changed: hookTrigger({
		key: 'destination_changed',
		noun: 'QR Code',
		label: 'QR Code Destination Changed',
		description: 'Triggers when the destination of a QR code is changed.',
		event: 'qr.destination_changed',
		toItem: versioned,
		listFromQr: versioned,
		sample: versioned(sampleQr),
	}),
	state_changed: hookTrigger({
		key: 'state_changed',
		noun: 'QR Code',
		label: 'QR Code Paused or Resumed',
		description: 'Triggers when a QR code is paused or resumed.',
		event: 'qr.state_changed',
		toItem: versioned,
		listFromQr: versioned,
		sample: versioned(sampleQr),
	}),
	scan_threshold: hookTrigger({
		key: 'scan_threshold',
		noun: 'Scan Threshold',
		label: 'Scan Threshold Reached',
		description: 'Triggers once per QR code when its total scans reach the number you set.',
		event: 'scans.threshold',
		inputFields: [
			{ key: 'scan_threshold', label: 'Number of Scans', type: 'integer', required: true, helpText: 'For example 100 or 1000.' },
		],
		toItem: (d) => ({ ...d.qr, id: `${d.qr.id}:${d.threshold}`, qr_id: d.qr.id, threshold: d.threshold, total_scans: d.total_scans }),
		listFromQr: (qr, bundle) => {
			const threshold = Number(bundle.inputData.scan_threshold) || 100;
			return { ...qr, id: `${qr.id}:${threshold}`, qr_id: qr.id, threshold, total_scans: threshold };
		},
		sample: { ...sampleQr, id: `${sampleQr.id}:100`, qr_id: sampleQr.id, threshold: 100, total_scans: 100 },
	}),
};

// Weekly contract test: checks that the QRavate API still answers the calls this connector makes.
// Runs against production with a dedicated test workspace (Pro plan) and one permanent test QR code,
// so no QR code is created and the account's figures are not affected.
//
//   QRAVATE_API_KEY=sk_... QRAVATE_TEST_QR_ID=... node scripts/contract-test.mjs
import assert from 'node:assert/strict';

const base = process.env.QRAVATE_API_URL ?? 'https://www.qravate.com/api/v1';
const key = process.env.QRAVATE_API_KEY;
const qrId = process.env.QRAVATE_TEST_QR_ID;
if (!key || !qrId) {
	console.log('QRAVATE_API_KEY or QRAVATE_TEST_QR_ID is not set: contract test skipped.');
	process.exit(0);
}

async function call(method, path, body) {
	const res = await fetch(`${base}${path}`, {
		method,
		headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'User-Agent': 'qravate-contract-test' },
		body: body ? JSON.stringify(body) : undefined,
	});
	const json = await res.json().catch(() => null);
	assert.ok(res.ok, `${method} ${path} -> HTTP ${res.status} ${JSON.stringify(json)}`);
	return json;
}

const step = async (name, fn) => {
	await fn();
	console.log(`ok - ${name}`);
};

await step('GET /me (credential test)', async () => {
	const { workspace } = await call('GET', '/me');
	assert.equal(typeof workspace?.name, 'string');
});

await step('GET /qr (list, pagination)', async () => {
	const res = await call('GET', '/qr?limit=1');
	assert.ok(Array.isArray(res.data));
	assert.ok('next_cursor' in res);
});

let qr;
await step('GET /qr/:id', async () => {
	({ data: qr } = await call('GET', `/qr/${qrId}`));
	for (const field of ['id', 'code', 'name', 'destination', 'state', 'short_url']) assert.ok(field in qr, `missing ${field}`);
});

await step('PATCH /qr/:id (destination and name)', async () => {
	const { data } = await call('PATCH', `/qr/${qrId}`, { destination: qr.destination, name: qr.name });
	assert.equal(data.destination, qr.destination);
});

await step('PATCH /qr/:id (pause, then resume)', async () => {
	const target = qr.state === 'paused' ? 'paused' : 'active';
	assert.equal((await call('PATCH', `/qr/${qrId}`, { state: 'paused' })).data.state, 'paused');
	assert.equal((await call('PATCH', `/qr/${qrId}`, { state: target })).data.state, target);
});

await step('GET /qr/:id/stats', async () => {
	const { data } = await call('GET', `/qr/${qrId}/stats`);
	assert.equal(typeof data.total, 'number');
	assert.ok(Array.isArray(data.days));
});

await step('POST and DELETE /webhooks (triggers)', async () => {
	const { data } = await call('POST', '/webhooks', {
		url: 'https://example.com/qravate-contract-test',
		events: ['qr.created', 'scans.threshold'],
		scan_threshold: 1000000,
		source: 'contract-test',
	});
	assert.ok(data.id && data.secret);
	await call('DELETE', `/webhooks/${data.id}`);
});

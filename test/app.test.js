'use strict';

const { test, before, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const nock = require('nock').default;
const zapier = require('zapier-platform-core');
const { prepareApp, validateApp } = require('zapier-platform-core/src/tools/schema');

const App = require('../index');
const appTester = zapier.createAppTester(App);
const api = () => nock('https://www.qravate.com', { reqheaders: { authorization: 'Bearer sk_test' } });
const authData = { apiKey: 'sk_test' };
const qr = { id: 'qr_1', code: 'AB23CD', name: 'Poster', destination: 'https://example.com', state: 'active', updated_at: '2026-11-18T10:00:00Z' };

before(() => nock.disableNetConnect());
afterEach(() => {
	assert.ok(nock.isDone(), `pending mocks: ${nock.pendingMocks()}`);
	nock.cleanAll();
});

test('the app definition is valid', () => {
	assert.deepEqual(validateApp(prepareApp(App)).map((e) => e.stack), []);
});

test('authentication test calls /me and labels the connection with the workspace', async () => {
	api().get('/api/v1/me').reply(200, { workspace: { id: 'ws', name: 'Café du Port', plan: 'Pro' } });
	const result = await appTester(App.authentication.test, { authData });
	assert.equal(App.authentication.connectionLabel(null, { inputData: result }), 'Café du Port');
});

test('API errors surface the QRavate message', async () => {
	api().post('/api/v1/qr').reply(403, { error: { code: 'plan_required', message: 'L’API est incluse à partir du plan Pro.' } });
	await assert.rejects(
		appTester(App.creates.create_qr_code.operation.perform, { authData, inputData: { name: 'a', destination: 'https://a.fr' } }),
		/plan Pro/,
	);
});

test('an invalid key asks to reconnect', async () => {
	api().get('/api/v1/me').reply(401, { error: { code: 'unauthorized', message: 'Clé d’API invalide ou révoquée.' } });
	await assert.rejects(appTester(App.authentication.test, { authData }), (err) => err.name === 'ExpiredAuthError');
});

test('create sends name and destination', async () => {
	api().post('/api/v1/qr', { name: 'Poster', destination: 'https://example.com' }).reply(201, { data: qr });
	const result = await appTester(App.creates.create_qr_code.operation.perform, { authData, inputData: { name: 'Poster', destination: 'https://example.com' } });
	assert.equal(result.id, 'qr_1');
});

test('update only sends the fields that are set', async () => {
	api().patch('/api/v1/qr/qr_1', { destination: 'https://new.example.com' }).reply(200, { data: { ...qr, destination: 'https://new.example.com' } });
	const result = await appTester(App.creates.update_qr_code.operation.perform, { authData, inputData: { id: 'qr_1', destination: 'https://new.example.com', name: '' } });
	assert.equal(result.destination, 'https://new.example.com');
});

test('pause sends the state', async () => {
	api().patch('/api/v1/qr/qr_1', { state: 'paused' }).reply(200, { data: { ...qr, state: 'paused' } });
	const result = await appTester(App.creates.set_qr_code_state.operation.perform, { authData, inputData: { id: 'qr_1', state: 'paused' } });
	assert.equal(result.state, 'paused');
});

test('find searches by name', async () => {
	api().get('/api/v1/qr').query({ search: 'Poster', limit: 10 }).reply(200, { data: [qr], next_cursor: null });
	const result = await appTester(App.searches.find_qr_code.operation.perform, { authData, inputData: { name: 'Poster' } });
	assert.equal(result.length, 1);
});

test('stats pass the period and return one item', async () => {
	api().get('/api/v1/qr/qr_1/stats').query({ from: '2026-11-01', to: '2026-11-18' }).reply(200, { data: { from: '2026-11-01', to: '2026-11-18', total: 4, uniques: 3, days: [] } });
	const result = await appTester(App.searches.get_qr_code_stats.operation.perform, { authData, inputData: { id: 'qr_1', from: '2026-11-01', to: '2026-11-18' } });
	assert.deepEqual(result.map((r) => r.total), [4]);
});

test('subscribing registers a webhook for the event, unsubscribing deletes it', async () => {
	const trigger = App.triggers.scan_threshold.operation;
	api()
		.post('/api/v1/webhooks', { url: 'https://hooks.zapier.com/x', events: ['scans.threshold'], source: 'zapier', scan_threshold: 100 })
		.reply(201, { data: { id: 'wh_1', secret: 's', events: ['scans.threshold'] } });
	const sub = await appTester(trigger.performSubscribe, { authData, targetUrl: 'https://hooks.zapier.com/x', inputData: { scan_threshold: 100 } });
	assert.equal(sub.id, 'wh_1');
	api().delete('/api/v1/webhooks/wh_1').reply(200, { data: { deleted: true } });
	await appTester(trigger.performUnsubscribe, { authData, subscribeData: sub });
});

test('hook payloads become items with a unique id', async () => {
	const created = await appTester(App.triggers.new_qr_code.operation.perform, { authData, cleanedRequest: { event: 'qr.created', data: qr } });
	assert.deepEqual(created.map((i) => i.id), ['qr_1']);
	const reached = await appTester(App.triggers.scan_threshold.operation.perform, {
		authData,
		cleanedRequest: { event: 'scans.threshold', data: { qr, threshold: 100, total_scans: 101 } },
	});
	assert.deepEqual(reached.map((i) => [i.id, i.qr_id, i.total_scans]), [['qr_1:100', 'qr_1', 101]]);
	const other = await appTester(App.triggers.new_qr_code.operation.perform, { authData, cleanedRequest: { event: 'qr.state_changed', data: qr } });
	assert.deepEqual(other, []);
});

test('the QR code dropdown lists the latest QR codes', async () => {
	api().get('/api/v1/qr').query({ limit: 200 }).reply(200, { data: [qr], next_cursor: null });
	const items = await appTester(App.triggers.qr_code_list.operation.perform, { authData });
	assert.deepEqual(items.map((i) => i.name), ['Poster']);
});

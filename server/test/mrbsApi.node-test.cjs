const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

// Run the real PHP endpoint against in-memory MRBS doubles. No network or database.
test('PHP API returns clean JSON and validates requests with simulated MRBS helpers', t => {
    if (spawnSync('php', ['-v']).error) return t.skip('PHP CLI is unavailable')
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mrbs-api-'))
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
    fs.copyFileSync(path.resolve(__dirname, '../../integrations/mrbs/api.php'), path.join(dir, 'api.php'))
    fs.writeFileSync(path.join(dir, 'defaultincludes.inc'), '<?php namespace MRBS;')
    fs.writeFileSync(path.join(dir, 'mrbs_sql.inc'), `<?php
namespace MRBS;
function getallheaders() { return ['Authorization' => $GLOBALS['request']['auth'] ?? 'Bearer test']; }
function file_get_contents($path) { return json_encode($GLOBALS['request']['body'] ?? null); }
function _tbl($table) { return 'custom_' . $table; }
class RepeatRule {
    const NONE = 0;
    function setType($value) {}
    function setInterval($value) {}
    function setEndDate($value) {}
}
class Rows {
    private $rows;
    function __construct($rows) { $this->rows = $rows; }
    function next_row_keyed() { return array_shift($this->rows) ?? false; }
}
class FakeDB {
    function query($sql, $params = []) {
        if (strpos($sql, 'mrbs_') !== false) throw new \\Exception('Hardcoded table prefix');
        if (strpos($sql, 'approval_enabled') !== false) {
            return new Rows($params[0] === 999 ? [] : [['approval_enabled' => 1]]);
        }
        if (strpos($sql, 'SELECT DISTINCT') !== false) return new Rows([['room_id' => '49']]);
        return new Rows([
            ['id' => '10', 'area_id' => '4', 'room_name' => 'Available', 'capacity' => '25'],
            ['id' => '49', 'area_id' => '4', 'room_name' => 'Booked', 'capacity' => '8']
        ]);
    }
    function command($sql, $params) { return 1; }
}
function db() { return new FakeDB(); }
function get_entry_by_id($id) {
    return $id === 999 ? null : ['id' => $id, 'create_by' => $id === 2 ? 'other' : 'api-user'];
}
function mrbsMakeBookings($bookings) {
    $booking = $bookings[0];
    if (isset($booking['id']) || isset($booking['status'])) throw new \\Exception('Untrusted internal field');
    if ($booking['create_by'] !== 'api-user') throw new \\Exception('Untrusted author');
    return ['new_details' => [['id' => 123, 'awaiting_approval' => $booking['awaiting_approval']]]];
}
`)
    fs.writeFileSync(path.join(dir, 'runner.php'), `<?php
$request = json_decode(base64_decode($argv[1]), true);
$_GET = $request['query'];
$_SERVER['REQUEST_METHOD'] = $request['method'] ?? 'GET';
putenv('MRBS_API_SECRET_TOKEN=test');
set_error_handler(function($severity, $message) { throw new Exception($message); });
ob_start();
register_shutdown_function(function() {
    $body = ob_get_clean();
    echo json_encode(['status' => http_response_code() ?: 200, 'body' => json_decode($body, true, 512, JSON_THROW_ON_ERROR)]);
});
require __DIR__ . '/api.php';
`)
    function request(query, extra = {}) {
        const result = spawnSync('php', [path.join(dir, 'runner.php'),
            Buffer.from(JSON.stringify({ query, ...extra })).toString('base64')], { cwd: dir, encoding: 'utf8' })
        assert.equal(result.status, 0, result.stderr)
        assert.equal(result.stderr, '')
        return JSON.parse(result.stdout)
    }
    assert.deepEqual(request({ q: 'query', start_time: 100, end_time: 200 }), {
        status: 200, body: [{ id: 10, area_id: 4, name: 'Available', capacity: 25 }]
    })
    for (const query of [{}, { q: 'query' }, { q: 'query', start_time: 200, end_time: 100 },
        { q: 'details' }, { q: 'details', id: 'bad' }]) {
        assert.equal(request(query).status, 400)
    }
    assert.equal(request({ q: 'query' }, { auth: 'wrong' }).status, 401)
    assert.equal(request({ q: 'delete', id: 1 }).status, 405)
    assert.equal(request({ q: 'delete', id: 2 }, { method: 'DELETE' }).status, 403)
    assert.equal(request({ q: 'delete', id: 999 }, { method: 'DELETE' }).status, 404)
    assert.equal(request({ q: 'delete', id: 1 }, { method: 'DELETE' }).body.status, 'success')
    const body = { room_id: 10, start_time: 100, end_time: 200, name: 'Test' }
    assert.equal(request({ q: 'book' }, { method: 'POST', body: { ...body, end_time: 99 } }).status, 400)
    assert.equal(request({ q: 'book' }, { method: 'POST', body: { ...body, room_id: 999 } }).status, 404)
    assert.deepEqual(request({ q: 'book' }, { method: 'POST', body: {
        ...body, id: 12, status: 0, create_by: 'other'
    } }), { status: 200, body: { status: 'success', booking: { id: 123, awaiting_approval: true } } })
})

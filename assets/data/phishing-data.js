/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Phishing Investigation Lab — Sample Dataset v1.2.0
 *
 * [EDUCATIONAL SIMULATION — 100% synthetic, offline data]
 * All emails, senders, domains, hashes, and analysts below are fictional
 * and generated deterministically for demonstration purposes only.
 *
 * Consumed by: assets/js/modules/phishing-analyzer.js
 */

const SamplePhishingData = (() => {

  const ANALYSTS = ['A. Khan', 'S. Rahman', 'M. Ortiz', 'D. Kim', 'T. Alvarez', 'N. Ibrahim'];
  const RECIPIENTS = ['jsmith@khansecurity.local', 'pnguyen@khansecurity.local', 'rpatel@khansecurity.local', 'dkim@khansecurity.local', 'cjohnson@khansecurity.local', 'enovak@khansecurity.local'];

  const SCENARIOS = [
    { category: 'Invoice Fraud', subject: 'Overdue Invoice #{n} — Payment Required', sender: 'billing@invoice-ledger-secure.example', verdict: 'Confirmed Phishing', hasAttachment: true, attType: 'pdf' },
    { category: 'BEC', subject: 'Urgent Wire Transfer Request — CEO', sender: 'ceo-office@khan-security-corp.example', verdict: 'Business Email Compromise', hasAttachment: false, attType: null },
    { category: 'Fake Microsoft Login', subject: 'Your Microsoft 365 password expires today', sender: 'security-noreply@micros0ft-verify.example', verdict: 'Credential Harvesting', hasAttachment: false, attType: null },
    { category: 'Google Drive', subject: '"Q3 Budget.xlsx" was shared with you', sender: 'drive-share@googl3-docs.example', verdict: 'Credential Harvesting', hasAttachment: false, attType: null },
    { category: 'Dropbox', subject: 'A file was shared with you via Dropbox', sender: 'no-reply@dropbox-files-secure.example', verdict: 'Suspicious', hasAttachment: false, attType: null },
    { category: 'Payroll Scam', subject: 'Update your direct deposit details', sender: 'payroll-hr@khansecurity-payroll.example', verdict: 'Confirmed Phishing', hasAttachment: false, attType: null },
    { category: 'Banking Scam', subject: 'Unusual activity detected on your account', sender: 'alerts@secure-banking-verify.example', verdict: 'Credential Harvesting', hasAttachment: false, attType: null },
    { category: 'Crypto Scam', subject: 'You have received 0.5 BTC — claim now', sender: 'rewards@crypto-claim-portal.example', verdict: 'Confirmed Phishing', hasAttachment: false, attType: null },
    { category: 'HR Scam', subject: 'Mandatory HR Policy Acknowledgement', sender: 'hr-notices@khansecurity-hrportal.example', verdict: 'Suspicious', hasAttachment: true, attType: 'pdf' },
    { category: 'Delivery Scam', subject: 'Your package could not be delivered', sender: 'tracking@delivery-status-update.example', verdict: 'Confirmed Phishing', hasAttachment: false, attType: null },
    { category: 'Credential Harvesting', subject: 'Action required: verify your mailbox', sender: 'mailbox-admin@webmail-verify-portal.example', verdict: 'Credential Harvesting', hasAttachment: false, attType: null },
    { category: 'Macro Malware', subject: 'Signed Contract — Please Review and Approve', sender: 'contracts@legal-docs-secure.example', verdict: 'Malicious Attachment', hasAttachment: true, attType: 'docm' },
    { category: 'ZIP Attachment', subject: 'Shipping Documents Attached', sender: 'logistics@freight-shipping-co.example', verdict: 'Malicious Attachment', hasAttachment: true, attType: 'zip' },
    { category: 'PDF Attachment', subject: 'Your Statement is Ready to View', sender: 'statements@account-services-online.example', verdict: 'Malicious Attachment', hasAttachment: true, attType: 'pdf' },
  ];

  function _hash(n, mod) { return ((n * 2654435761) >>> 0) % mod; }
  function _pad(n, len) { return String(n).padStart(len, '0'); }
  function _dateOffset(days, hours = 0) { return new Date(Date.now() - days * 86400000 - hours * 3600000); }
  function _fmt(d) { return d.toISOString().slice(0, 16).replace('T', ' '); }
  function _hexHash(seed, len) { return Array.from({ length: len }, (_, i) => '0123456789abcdef'[_hash(seed + i, 16)]).join(''); }

  const RISK_LEVELS = ['critical', 'high', 'medium', 'low', 'safe'];
  const STATUSES = ['New', 'Investigating', 'Escalated', 'Resolved', 'Closed'];
  const CAMPAIGNS = ['Operation Fake Invoice', 'Operation Golden Ledger', 'Operation Silent Login', 'None'];

  function _buildInvestigation(idx) {
    const scenario = SCENARIOS[idx % SCENARIOS.length];
    const num = idx + 1;
    const risk = scenario.verdict === 'Benign' ? 'safe' : RISK_LEVELS[_hash(idx * 3, scenario.verdict === 'Suspicious' ? 4 : 3)];
    const analyst = ANALYSTS[_hash(idx * 7, ANALYSTS.length)];
    const recipient = RECIPIENTS[_hash(idx * 11, RECIPIENTS.length)];
    const ageDays = 1 + _hash(idx * 13, 60);
    const receivedTime = _fmt(_dateOffset(ageDays, _hash(idx, 24)));
    const status = STATUSES[_hash(idx * 17, STATUSES.length)];
    const isClosed = status === 'Resolved' || status === 'Closed';
    const campaign = scenario.verdict === 'Confirmed Phishing' || scenario.verdict === 'Business Email Compromise' ? CAMPAIGNS[_hash(idx * 19, 3)] : 'None';
    const blocked = risk === 'critical' || risk === 'high';
    const urlCount = scenario.hasAttachment ? _hash(idx * 23, 2) : 1 + _hash(idx * 23, 3);
    const investigationMinutes = 15 + _hash(idx * 29, 90);

    const senderDomain = scenario.sender.split('@')[1];
    const originatingIp = `198.51.100.${10 + _hash(idx, 240)}`;

    const spf = _hash(idx * 31, 3) === 0 ? 'Pass' : 'Fail';
    const dkim = _hash(idx * 37, 3) === 0 ? 'Pass' : 'Fail';
    const dmarc = spf === 'Fail' || dkim === 'Fail' ? 'Fail' : (_hash(idx * 41, 4) === 0 ? 'Fail' : 'Pass');
    const spoofingDetected = spf === 'Fail' && dkim === 'Fail';

    const headers = {
      returnPath: `bounce@${senderDomain}`, from: scenario.sender, to: recipient,
      replyTo: _hash(idx * 43, 3) === 0 ? `reply-${_hash(idx, 999)}@${senderDomain}` : scenario.sender,
      spf, dkim, dmarc, messageId: `<${uidLike(idx)}@${senderDomain}>`,
      receivedChain: [`mx1.${senderDomain}`, `relay-${_hash(idx, 99)}.smtp-relay.example`, 'mx.khansecurity.local'],
      originatingIp,
    };

    const auth = {
      spf, dkim, dmarc, spoofingDetected,
      explanation: spoofingDetected
        ? 'Both SPF and DKIM failed validation, and the From domain does not match the authenticated sending domain — strong indicator of sender spoofing.'
        : spf === 'Fail' || dkim === 'Fail'
          ? 'One or more authentication mechanisms failed, which is common in phishing but not conclusive on its own.'
          : 'Authentication checks passed, but this does not rule out phishing — display-name spoofing and lookalike domains bypass SPF/DKIM/DMARC.',
    };

    const urlDomains = [`${senderDomain}`, `track-${_hash(idx, 999)}.example`, `redirect-${_hash(idx * 2, 999)}.example`];
    const urls = Array.from({ length: urlCount }, (_, i) => {
      const domain = urlDomains[i % urlDomains.length];
      const https = _hash(idx + i, 2) === 0;
      const urlRisk = RISK_LEVELS[_hash(idx * 47 + i, 4)];
      return {
        url: `${https ? 'https' : 'http'}://${domain}/${['login', 'verify', 'secure', 'account', 'update'][_hash(idx + i, 5)]}`,
        domain, reputation: urlRisk === 'critical' || urlRisk === 'high' ? 'Malicious' : urlRisk === 'medium' ? 'Suspicious' : 'Unknown',
        https, risk: urlRisk, destination: `Credential harvesting page mimicking a legitimate ${scenario.category} login portal.`,
        status: blocked ? 'Blocked' : 'Active', sandboxResult: urlRisk === 'critical' || urlRisk === 'high' ? 'Detonation confirmed malicious redirect chain.' : 'No conclusive malicious behavior observed.',
      };
    });

    const attachments = scenario.hasAttachment ? [{
      filename: `${scenario.category.replace(/\s/g, '_')}_${num}.${scenario.attType}`,
      type: scenario.attType.toUpperCase(), size: `${20 + _hash(idx, 900)} KB`,
      sha256: _hexHash(idx * 53, 64),
      risk: risk, sandbox: risk === 'critical' || risk === 'high' ? 'Detonation confirmed malicious macro/payload execution.' : 'Detonation completed — no malicious behavior triggered.',
      macro: scenario.attType === 'docm', passwordProtected: scenario.attType === 'zip' && _hash(idx, 2) === 0,
    }] : [];

    const iocs = {
      domains: [...new Set(urls.map(u => u.domain))],
      ips: [originatingIp],
      hashes: attachments.map(a => a.sha256),
      urls: urls.map(u => u.url),
      emails: [scenario.sender],
      registryKeys: scenario.attType === 'docm' ? ['HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\UpdateHelper'] : [],
      filePaths: scenario.attType ? [`C:\\Users\\*\\AppData\\Local\\Temp\\${scenario.category.replace(/\s/g, '_')}_${num}.${scenario.attType}`] : [],
    };

    const created = _dateOffset(ageDays);
    const timelineSteps = [
      { event: 'Email Received', detail: `Message received by ${recipient}.`, hrs: 0 },
      { event: 'Alert Triggered', detail: 'Email gateway flagged the message for review.', hrs: 0.1 },
      { event: 'Analyst Assigned', detail: `Assigned to ${analyst}.`, hrs: 0.5 },
      { event: 'Analysis Started', detail: 'Header and authentication analysis began.', hrs: 1 },
    ];
    if (urls.length) timelineSteps.push({ event: 'URL Investigation', detail: `${urls.length} URL(s) submitted for reputation and sandbox analysis.`, hrs: 1.5 });
    if (attachments.length) timelineSteps.push({ event: 'Attachment Investigation', detail: 'Attachment submitted for sandbox detonation.', hrs: 2 });
    timelineSteps.push({ event: 'Verdict', detail: `Investigation concluded with verdict: ${scenario.verdict}.`, hrs: investigationMinutes / 60 });
    if (isClosed) timelineSteps.push({ event: 'Case Closed', detail: 'Investigation closed and remediation actions completed.', hrs: investigationMinutes / 60 + 1 });
    const timeline = timelineSteps.map(s => ({ time: _fmt(new Date(created.getTime() + s.hrs * 3600000)), event: s.event, detail: s.detail }));

    const notes = [{ author: analyst, date: receivedTime, text: `Initial review flags this as a likely ${scenario.category.toLowerCase()} attempt targeting ${recipient}.` }];
    if (isClosed) notes.push({ author: analyst, date: timeline[timeline.length - 1].time, text: `Verdict finalized as ${scenario.verdict}. Sender domain blocked at gateway; user notified.` });

    return {
      id: `EMAIL-${_pad(num, 4)}`,
      sender: scenario.sender, recipient, subject: scenario.subject.replace('{n}', 10000 + num),
      receivedTime, riskScore: risk, verdict: scenario.verdict, category: scenario.category,
      campaign, blocked, hasAttachment: scenario.hasAttachment, urlCount: urls.length,
      status, assignedAnalyst: analyst, investigationMinutes,
      headers, auth, urls, attachments, iocs, timeline, notes,
    };
  }

  function uidLike(idx) { return _hexHash(idx * 59, 16); }

  const investigations = Array.from({ length: 60 }, (_, i) => _buildInvestigation(i));

  function getInvestigation(id) { return investigations.find(i => i.id === id) || null; }

  return { investigations, RISK_LEVELS, STATUSES, CAMPAIGNS, ANALYSTS, getInvestigation };

})();

window.SamplePhishingData = SamplePhishingData;

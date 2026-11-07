/**
 * KHAN SECURITY SOLUTIONS ENTERPRISE
 * Enterprise Password & Security Toolkit — Reference Data v1.5.0
 *
 * [EDUCATIONAL / REFERENCE DATA]
 * The common-password list and "breach demo" set below are a small
 * curated sample of well-known weak/leaked passwords used purely for
 * offline dictionary-detection and demonstration purposes — this module
 * never contacts any online breach-checking API. The passphrase word list
 * is a short list of common English words (not a cryptographically vetted
 * diceware list) suitable for an offline demo generator. MFA method
 * descriptions are general public information about each technology.
 *
 * Consumed by: assets/js/modules/password-tools.js
 */

const SamplePasswordData = (() => {

  // ── Passphrase word list (short, common, easy to read/type) ────────────
  const WORDLIST = [
    'anchor','arrow','autumn','ballad','banjo','barrel','basalt','beacon','beetle','bishop',
    'blanket','bramble','breeze','bridge','bronze','burrow','cactus','camera','candle','canyon',
    'carbon','cedar','cinder','cipher','clover','cobalt','comet','compass','coral','cotton',
    'coyote','crater','cricket','crimson','crystal','dagger','delta','desert','diamond','dolphin',
    'dragon','driftwood','eagle','ember','falcon','feather','fennel','ferry','flannel','forest',
    'fossil','fountain','garnet','glacier','goblin','granite','gravel','guitar','harbor','hazel',
    'hearth','hollow','horizon','hornet','hunter','iceberg','indigo','island','ivory','jackal',
    'jasper','jungle','kayak','kernel','kettle','ladder','lagoon','lantern','laurel','lichen',
    'lighthouse','locket','lumber','magnet','mallow','mantle','maple','marble','marsh','meadow',
    'meridian','mineral','mirage','mistral','moccasin','monarch','moonlit','mosaic','mustang','nebula',
    'nectar','needle','nettle','nomad','oasis','obelisk','onyx','opal','orbit','orchard',
    'origami','osprey','otter','outpost','oxide','paddle','panther','papyrus','parcel','pebble',
    'pelican','pendant','pepper','pheasant','pigment','pillar','pinnacle','pioneer','plateau','pond',
    'poplar','prairie','prism','pumpkin','quartz','quiver','rabbit','raccoon','radiant','rapids',
    'raven','reef','ridge','ripple','river','rocket','rooster','rustic','saddle','safari',
    'sage','salmon','sandstone','sapphire','satchel','savanna','scepter','scorpion','sculpture','seagull',
    'sequoia','shale','shelter','shuttle','sierra','silo','sparrow','spruce','starling','stone',
    'strait','sundial','sunset','swallow','tangerine','tavern','tempest','terrace','thicket','thistle',
    'thunder','timber','toboggan','topaz','torch','tortoise','trellis','trestle','trident','tundra',
    'tunnel','turquoise','umbrella','urchin','valley','vantage','velvet','vessel','viking','violet',
    'vortex','voyage','walnut','warbler','wharf','whisper','willow','windmill','woodland','zephyr',
  ];

  // ── Common / weak passwords (curated sample — dictionary detection + offline breach demo) ─
  const COMMON_PASSWORDS = [
    '123456','password','123456789','12345678','12345','1234567','qwerty','abc123','password1','111111',
    '123123','admin','letmein','welcome','monkey','login','dragon','master','sunshine','princess',
    'iloveyou','football','baseball','superman','trustno1','starwars','shadow','michael','jennifer','hunter',
    'freedom','whatever','qazwsx','passw0rd','p@ssw0rd','p@ssword','000000','1q2w3e4r','zaq12wsx','asdfghjkl',
    'qwerty123','1qaz2wsx','changeme','default','guest','root','toor','letmein1','welcome1','admin123',
    'password123','abc12345','1234567890','iloveyou1','summer2024','winter2024','company123','corporate1',
  ];
  // A subset flagged specifically as "seen in a demo breach corpus" (offline, curated — not a live feed)
  const BREACH_DEMO_SET = new Set(['123456','password','123456789','qwerty','password1','111111','iloveyou','admin','letmein','p@ssw0rd','welcome1','password123']);

  // ── Keyboard rows for sequential/keyboard-walk pattern detection ───────
  const KEYBOARD_ROWS = [
    'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
    '1234567890', '!@#$%^&*()',
  ];

  // ── Character classes ────────────────────────────────────────────────
  const CHAR_SETS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~',
  };
  const SIMILAR_CHARS = 'il1Lo0O';
  const AMBIGUOUS_CHARS = "{}[]()/\\'\"`~,;:.<>";

  // ── Reusable password policy templates ──────────────────────────────
  const POLICY_TEMPLATES = [
    { id: 'nist', name: 'NIST SP 800-63B (Modern)', minLength: 8, requireUpper: false, requireLower: false, requireNumber: false, requireSymbol: false, blockCommon: true, maxAgeDays: 0, description: 'Favors length over complexity; blocks known-breached passwords; no forced periodic rotation.' },
    { id: 'corporate', name: 'Corporate Standard', minLength: 12, requireUpper: true, requireLower: true, requireNumber: true, requireSymbol: true, blockCommon: true, maxAgeDays: 90, description: 'Traditional enterprise policy — complexity required, rotated quarterly.' },
    { id: 'pci', name: 'PCI-DSS Aligned', minLength: 12, requireUpper: true, requireLower: true, requireNumber: true, requireSymbol: false, blockCommon: true, maxAgeDays: 90, description: 'Aligned with PCI-DSS password requirements for cardholder data environments.' },
    { id: 'strict', name: 'High-Security (Strict)', minLength: 16, requireUpper: true, requireLower: true, requireNumber: true, requireSymbol: true, blockCommon: true, maxAgeDays: 60, description: 'For privileged/admin accounts — long minimum length, full complexity, frequent rotation.' },
  ];

  // ── MFA methods (general public information) ────────────────────────
  const MFA_METHODS = [
    { name: 'Microsoft Authenticator', category: 'App-based TOTP/Push', security: 'High', description: 'Time-based one-time codes plus push-notification approval, with optional passwordless sign-in.', pros: ['Free', 'Works offline for TOTP', 'Passwordless option'], cons: ['Requires a smartphone', 'Push fatigue attacks possible if not careful'] },
    { name: 'Google Authenticator', category: 'App-based TOTP', security: 'High', description: 'Simple time-based one-time password (TOTP) generator app.', pros: ['Free', 'Works offline', 'Widely supported'], cons: ['No built-in cloud backup on older versions', 'No push approval'] },
    { name: 'Hardware Security Keys', category: 'Physical / FIDO2', security: 'Very High', description: 'Physical USB/NFC keys (e.g. YubiKey) implementing FIDO2/WebAuthn for phishing-resistant authentication.', pros: ['Phishing-resistant', 'No shared secret to steal', 'Fast tap-to-auth'], cons: ['Cost per key', 'Can be lost — needs backup key'] },
    { name: 'Passkeys', category: 'Passwordless / FIDO2', security: 'Very High', description: 'Public-key credentials synced via platform ecosystems (Apple/Google/Microsoft), replacing passwords entirely.', pros: ['Phishing-resistant', 'No password to remember or leak', 'Cross-device sync'], cons: ['Newer — not all services support it yet', 'Ecosystem lock-in considerations'] },
    { name: 'FIDO2 / WebAuthn', category: 'Open Standard', security: 'Very High', description: 'The underlying open standard behind passkeys and many hardware keys, using public-key cryptography.', pros: ['Industry standard', 'Strong phishing resistance'], cons: ['Requires compatible relying party support'] },
    { name: 'Windows Hello', category: 'Platform Biometric', security: 'High', description: 'Built-in Windows biometric (face/fingerprint) or PIN authentication backed by TPM.', pros: ['Convenient', 'Hardware-backed'], cons: ['Device-specific', 'PIN fallback is less strong than biometric'] },
    { name: 'Biometrics (Face/Fingerprint)', category: 'Platform Biometric', security: 'High', description: 'Device-native biometric sensors used to unlock a stored credential or key.', pros: ['Fast', 'Nothing to type'], cons: ['Not a shared secret — usually protects a local key, not a standalone second factor across services'] },
    { name: 'SMS One-Time Code', category: 'Out-of-Band', security: 'Low', description: 'A one-time code sent via text message.', pros: ['No app required', 'Broad compatibility'], cons: ['Vulnerable to SIM-swapping', 'Vulnerable to SS7 interception', 'Not phishing-resistant'] },
    { name: 'Email One-Time Code', category: 'Out-of-Band', security: 'Low', description: 'A one-time code sent via email.', pros: ['No app required'], cons: ['Only as secure as the email account itself', 'Vulnerable to phishing/relay'] },
  ];

  // ── Security tips ─────────────────────────────────────────────────────
  const SECURITY_TIPS = [
    { category: 'Password Hygiene', title: 'Use a unique password for every account', description: 'Password reuse means one breach can cascade into many. A password manager makes unique passwords practical.' },
    { category: 'Password Hygiene', title: 'Prefer length over complexity', description: 'A long passphrase (4+ random words) is often stronger and easier to remember than a short complex string.' },
    { category: 'Zero Trust', title: 'Never trust, always verify', description: 'Zero Trust assumes no user or device is inherently trusted — every access request is authenticated and authorized.' },
    { category: 'Zero Trust', title: 'Verify explicitly on every session', description: 'Re-validate identity and device posture continuously, not just at initial login.' },
    { category: 'Least Privilege', title: 'Grant only the access required', description: 'Users and service accounts should hold the minimum permissions needed to perform their role — nothing more.' },
    { category: 'Least Privilege', title: 'Use just-in-time elevation', description: 'Grant elevated/admin access temporarily and on-demand rather than as a standing permission.' },
    { category: 'Password Rotation', title: 'Rotate on compromise, not on a fixed clock', description: 'Modern guidance (NIST 800-63B) favors rotating passwords when there is evidence of compromise, over forced periodic changes that often lead to weaker, predictable passwords.' },
    { category: 'Credential Protection', title: 'Enable MFA everywhere it is offered', description: 'Multi-factor authentication blocks the vast majority of automated account-takeover attempts, even with a leaked password.' },
    { category: 'Credential Protection', title: 'Never share credentials over email or chat', description: 'Use a password manager\'s secure sharing feature instead of pasting credentials into email, chat, or tickets.' },
    { category: 'Phishing Awareness', title: 'Check the sender and URL before entering credentials', description: 'Look-alike domains and spoofed sender names are the most common phishing technique — verify before you type.' },
    { category: 'Phishing Awareness', title: 'Be suspicious of urgency', description: 'Phishing often manufactures urgency ("your account will be locked") to short-circuit careful verification.' },
  ];

  return { WORDLIST, COMMON_PASSWORDS, BREACH_DEMO_SET, KEYBOARD_ROWS, CHAR_SETS, SIMILAR_CHARS, AMBIGUOUS_CHARS, POLICY_TEMPLATES, MFA_METHODS, SECURITY_TIPS };

})();

window.SamplePasswordData = SamplePasswordData;

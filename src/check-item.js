// SandTogether by Kamil Padula — Workshop item state check
'use strict';
const sw = require('F:/SteamLibrary/steamapps/common/Sandustry/resources/app/node_modules/steamworks.js');
const c = sw.init(2764460);
const id = BigInt(process.argv[2] || '3784750764');
c.workshop.getItem(id, { includeLongDescription: false, includeMetadata: true })
  .then((r) => {
    console.log(JSON.stringify(r, (k, v) => (typeof v === 'bigint' ? String(v) : v), 1));
    process.exit(0);
  })
  .catch((e) => { console.error('getItem error:', e.message || e); process.exit(1); });

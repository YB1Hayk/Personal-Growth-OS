import axios from 'axios';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99)))
      || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
      || (a === 203 && b === 0 && c === 113));
  }
  // Разрешаем лишь global unicast IPv6, блокируем mapped IPv4, local и multicast.
  if (isIP(address) === 6) {
    const [first, second] = address.split(':');
    const head = parseInt(first, 16); const next = parseInt(second || '0', 16);
    return head >= 0x2000 && head < 0x3fff
      && !(head === 0x2001 && (next <= 0x1ff || next === 0xdb8))
      && head !== 0x2002;
  }
  return false;
}

export async function fetchPublicHtml(rawUrl: string): Promise<string> {
  const url = new URL(rawUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
    || (url.port && !['80', '443'].includes(url.port))) throw new Error('Разрешены только публичные HTTP(S)-адреса без логина');
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const records = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }]
    : await lookup(hostname, { all: true });
  if (!records.length || records.some(record => !isPublicAddress(record.address))) throw new Error('Непубличный адрес запрещён');
  const selected = records[0];
  // DNS проверен и закреплён на время запроса: нет повторного разрешения/rebinding.
  const pinnedLookup: import('node:net').LookupFunction = (_host, options, callback) => {
    if (options.all) callback(null, [{ address: selected.address, family: selected.family }]);
    else callback(null, selected.address, selected.family);
  };
  const httpAgent = new HttpAgent({ lookup: pinnedLookup });
  const httpsAgent = new HttpsAgent({ lookup: pinnedLookup });
  try {
    const response = await axios.get<string>(url.toString(), {
      adapter: 'http', proxy: false, httpAgent, httpsAgent,
      maxRedirects: 0, timeout: 10000, maxContentLength: 1024 * 1024,
      responseType: 'text', headers: { 'User-Agent': 'GrowthOS/1.0' },
    });
    const contentType = String(response.headers['content-type'] || '');
    if (!/^(text\/html|text\/plain|application\/xhtml\+xml)/i.test(contentType)) throw new Error('Ожидается текст или HTML');
    return response.data;
  } finally { httpAgent.destroy(); httpsAgent.destroy(); }
}

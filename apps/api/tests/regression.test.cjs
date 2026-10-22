const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
// Keep fixtures inside the project workspace: Windows sandboxed runners can deny
// access to the system Temp directory even when the test process owns the files.
const directory = mkdtempSync(path.join(__dirname, '.growth-os-test-'));
process.env.DATABASE_URL = `file:${path.join(directory, 'test.db')}`;
process.env.POSTBACK_TOKEN = 'test-only-token-012345678901234567890123456789';
try {
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
    cwd: path.resolve(__dirname, '..'), env: process.env, stdio: 'pipe',
  });
} catch (error) {
  const details = error.stderr?.toString();
  if (details) error.message += `\nTest setup Prisma stderr:\n${details}`;
  throw error;
}
const { prisma } = require('../dist/shared/lib/prisma');
const { isPublicAddress, fetchPublicHtml } = require('../dist/shared/lib/public-web');
const { postbackAuth, tokensMatch } = require('../dist/shared/middleware/postback-auth');
const { errorHandler } = require('../dist/shared/middleware/http');
const { PublishService } = require('../dist/publish.service');
const { publishPost } = require('../dist/publication.service');
const { ContentService } = require('../dist/modules/content/content.service');
const { projectsRouter } = require('../dist/modules/projects/projects.router');
const { trafficRouter } = require('../dist/modules/traffic/traffic.router');
const { createLinkSchema, postbackSchema } = require('../dist/modules/traffic/traffic.schema');
const { weeklyPlanSchema, updatePostSchema } = require('../dist/modules/content/content.schema');
const { createProjectSchema } = require('../dist/modules/projects/projects.schema');
const { trafficService } = require('../dist/modules/traffic/traffic.service');
const { outreachService } = require('../dist/modules/outreach/outreach.service');
const { aiProvider } = require('../dist/shared/ai');
const express = require('express');
let project, other, server, base;
before(async () => {
  project = await prisma.project.create({ data: { name: 'Regression', niche: 'test', tgBotToken: 'fake-only', tgChatId: '-100123' } });
  other = await prisma.project.create({ data: { name: 'Other', niche: 'test' } });
  const app = express(); app.use(express.json());
  app.use('/api/projects', projectsRouter); app.use('/api/traffic', trafficRouter);
  app.get('/auth-test', postbackAuth, (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await prisma.$disconnect();
  if (server) await new Promise(resolve => server.close(resolve));
  rmSync(directory, { recursive: true, force: true });
});

test('SSRF: private, reserved and mapped addresses are blocked', async () => {
  for (const ip of ['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.2', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '198.18.0.1', '192.0.2.1', '203.0.113.1', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1', '2001:db8::1', '2002:7f00:1::']) assert.equal(isPublicAddress(ip), false, ip);
  for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) assert.equal(isPublicAddress(ip), true, ip);
  for (const url of ['http://127.0.0.1/', 'http://[::1]/', 'file:///etc/passwd', 'http://user:pass@example.com', 'http://localhost/']) await assert.rejects(fetchPublicHtml(url));
});

test('Schemas reject dangerous URLs, invalid plans, dates and fractional weekdays', () => {
  assert.equal(createLinkSchema.safeParse({ body: { projectId: project.id, name: 'x', source: 'x', targetUrl: 'javascript:alert(1)' } }).success, false);
  assert.equal(updatePostSchema.safeParse({ scheduledAt: '2026-10-13T19:00' }).success, false);
  assert.equal(updatePostSchema.safeParse({ scheduledAt: '2026-10-13T19:00:00+03:00' }).success, true);
  assert.equal(updatePostSchema.safeParse({ scheduledAt: null }).success, true);
  assert.equal(updatePostSchema.safeParse({ status: 'PUBLISHED' }).success, false);
  assert.equal(weeklyPlanSchema.safeParse([]).success, false);
  assert.equal(weeklyPlanSchema.safeParse(Array.from({length:7}, () => ({ title: 'T', content: 'Text' }))).success, true);
  assert.equal(createProjectSchema.safeParse({ body: { name: 'T', niche: 'T', planGenerationDay: 0.5 } }).success, false);
  assert.equal(postbackSchema.safeParse({ query: { clickid: project.id, eventid: 'evt', payout: 'Infinity' } }).success, false);
  assert.equal(postbackSchema.safeParse({ query: { clickid: project.id } }).success, false);
});

test('Postback authentication rejects absent/wrong tokens and accepts a correct token', async () => {
  assert.equal(tokensMatch('a', 'aa'), false); assert.equal(tokensMatch('abc', 'abc'), true);
  assert.equal((await fetch(`${base}/auth-test`)).status, 401);
  assert.equal((await fetch(`${base}/auth-test`, { headers: { 'x-postback-token': 'wrong' } })).status, 401);
  assert.equal((await fetch(`${base}/auth-test`, { headers: { 'x-postback-token': process.env.POSTBACK_TOKEN } })).status, 200);
});

test('Project API never returns Telegram token and an empty update preserves it', async () => {
  const response = await fetch(`${base}/api/projects`); const payload = await response.json();
  assert.equal(JSON.stringify(payload).includes('fake-only'), false);
  const row = payload.data.find(p => p.id === project.id);
  assert.equal(row.hasTelegramToken, true); assert.equal('tgBotToken' in row, false);
  const updated = await fetch(`${base}/api/projects/${project.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tgBotToken: '', dna: 'DNA' }) });
  assert.equal(updated.status, 200);
  assert.equal((await prisma.project.findUnique({where:{id:project.id}})).tgBotToken, 'fake-only');
});

test('Publication atomic claim sends once under concurrent requests', async () => {
  const post = await prisma.contentPost.create({ data: { projectId: project.id, title: 'Concurrent', content: 'Plain <text> & chars', status: 'APPROVED', scheduledAt: new Date(Date.now() - 1000) } });
  let calls = 0;
  PublishService.sendToTelegram = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 20)); };
  const outcomes = await Promise.allSettled([publishPost(post.id), publishPost(post.id, true)]);
  assert.equal(calls, 1); assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal((await prisma.contentPost.findUnique({ where: { id: post.id } })).status, 'PUBLISHED');
  await assert.rejects(publishPost(post.id), error => error.statusCode === 409);
  await assert.rejects(new ContentService().approvePost(post.id));
  await assert.rejects(new ContentService().updatePost(post.id, { content: 'overwrite' }));
});

test('Unknown send result is never auto-retried', async () => {
  const post = await prisma.contentPost.create({ data: { projectId: project.id, title: 'Uncertain', content: 'Text' } });
  let calls = 0; PublishService.sendToTelegram = async () => { calls++; throw new Error('Timeout'); };
  await assert.rejects(publishPost(post.id), error => error.code === 'PUBLICATION_UNKNOWN');
  assert.equal((await prisma.contentPost.findUnique({where:{id:post.id}})).status, 'PUBLISH_UNKNOWN');
  await assert.rejects(publishPost(post.id), error => error.statusCode === 409); assert.equal(calls, 1);
});

test('Scheduled publication respects due date', async () => {
  const post = await prisma.contentPost.create({ data: { projectId: project.id, title: 'Future', content: 'Text', status: 'APPROVED', scheduledAt: new Date(Date.now() + 86400000) } });
  let calls = 0; PublishService.sendToTelegram = async () => { calls++; };
  await assert.rejects(publishPost(post.id, true), error => error.statusCode === 409); assert.equal(calls, 0);
});

test('Editing approved text resets approval', async () => {
  const post = await prisma.contentPost.create({data:{projectId:project.id,title:'Edit',content:'Old',status:'APPROVED'}});
  const result = await new ContentService().updatePost(post.id, {content:'New'});
  assert.equal(result.status, 'DRAFT');
});

test('Postback retries and concurrent duplicates produce one conversion', async () => {
  const link = await prisma.trackingLink.create({ data: { projectId: project.id, slug: 'test', name: 'Test', source: 'test', targetUrl: 'https://example.com' } });
  const click = await prisma.clickEvent.create({ data: { linkId: link.id } });
  const data = { clickid: click.id, eventid: 'test-event-1', type: 'deposit', payout: 10 };
  const outcomes = await Promise.all([trafficService.registerPostback(data), trafficService.registerPostback(data)]);
  assert.equal(outcomes[0].id, outcomes[1].id); assert.equal(await prisma.conversion.count(), 1);
  await assert.rejects(trafficService.registerPostback({...data,payout:11}));
  const response = await fetch(`${base}/api/traffic/postback?clickid=${click.id}&eventid=test-event-2&type=registration&payout=0`, {headers:{'x-postback-token':process.env.POSTBACK_TOKEN}});
  assert.equal(response.status, 200);
  assert.equal((await fetch(`${base}/api/traffic/postback?clickid=${click.id}`)).status, 401);
});

test('Async database errors return JSON instead of unhandled promise rejections', async () => {
  const response = await fetch(`${base}/api/traffic/links`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({projectId:'00000000-0000-4000-8000-000000000000',name:'Missing',source:'x',targetUrl:'https://example.com'}) });
  assert.equal(response.status, 500); assert.equal((await response.json()).data, null);
});

test('Outreach rejects cross-project templates and username-only contacts before sending', async () => {
  const lead = await prisma.lead.create({data:{projectId:project.id,name:'Tester',handle:'@user',source:'test'}});
  const template = await prisma.outreachTemplate.create({data:{projectId:other.id,name:'Other',content:'Hello'}});
  await assert.rejects(outreachService.sendTemplate(lead.id, template.id), /разным проектам/);
  const valid = await prisma.outreachTemplate.create({data:{projectId:project.id,name:'Local',content:'Hello'}});
  await assert.rejects(outreachService.sendTemplate(lead.id, valid.id), /числовой Telegram/);
  await assert.rejects(outreachService.generateAIMessage({leadId:lead.id,projectId:other.id}), /другому проекту/);
});

test('Weekly generation rejects invalid AI JSON before DB writes and uses chosen strategy', async () => {
  aiProvider.generateText = async () => '{"not":"a plan"}';
  const count = await prisma.contentPost.count();
  await assert.rejects(new ContentService().generateWeeklyPlan(project.id));
  assert.equal(await prisma.contentPost.count(), count);
  const post = await prisma.contentPost.create({data:{projectId:project.id,title:'Story'}});
  let prompt; aiProvider.generateText = async text => { prompt = text; return 'Story text'; };
  await new ContentService().generatePost(post.id, 'STORYTELLING');
  assert.match(prompt, /СТРАТЕГИЯ: Storytelling/);
});

test('Local access rejects hostile Origin and DNS-rebinding Host', () => {
  const { localAccess } = require('../dist/shared/middleware/local-access');
  for (const [host, origin, expected] of [['127.0.0.1:3001', undefined, 200], ['localhost:3001', 'http://localhost:5173', 200], ['evil.example:3001', undefined, 403], ['127.0.0.1:3001', 'https://evil.example', 403]]) {
    let status = 200; let nextCalled = false;
    localAccess({ headers: {host}, get: () => origin }, { status(code) {status = code; return this;}, json() {} }, () => {nextCalled = true;});
    assert.equal(status, expected); assert.equal(nextCalled, expected === 200);
  }
});

test('Empty content cannot be approved', async () => {
  const post = await prisma.contentPost.create({ data: { projectId: project.id, title: 'Empty', content: '   ' } });
  await assert.rejects(new ContentService().approvePost(post.id));
});

test('Legacy schema upgrade baselines drift and preserves existing records', async () => {
  const url = `file:${path.join(directory, 'legacy.db')}`;
  const cwd = path.resolve(__dirname, '..'); const env = {...process.env, DATABASE_URL:url};
  const cli = args => execFileSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], {cwd, env, stdio:'pipe'});
  cli(['db','push','--schema','prisma/legacy-schema-check.prisma','--skip-generate']);
  const { PrismaClient } = require('@prisma/client'); const legacy = new PrismaClient({datasources:{db:{url}}});
  try {
    // The generated client matches the current schema, while this fixture intentionally
    // represents the older schema. Insert its historical rows without selecting newer columns.
    const keepId = 'legacy-project-preserve'; const leadId = 'legacy-lead-preserve';
    await legacy.$executeRawUnsafe('INSERT INTO "Project" (id,name,niche,dna,tgBotToken,createdAt,updatedAt) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)', keepId, 'Preserve', 'test', 'Keep me', 'synthetic-token');
    await legacy.$executeRawUnsafe('INSERT INTO "Lead" (id,name,handle,source,projectId,createdAt) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)', leadId, 'Test lead', '12345', 'test', keepId);
    for (const migration of ['20260325062249_init','20260325064930_add_leads','20260325072411_add_ai_feedback','20260705234626_add_learning_schema','20260712222645_add_traffic_module']) cli(['migrate','resolve','--applied',migration]);
    await legacy.$disconnect();
    execFileSync(process.execPath,['scripts/upgrade-db.cjs','--backup-confirmed'],{cwd,env,stdio:'pipe'});
    assert.equal((await legacy.project.findUnique({where:{id:keepId}})).dna, 'Keep me');
    assert.equal((await legacy.lead.findUnique({where:{id:leadId}})).handle, '12345');
    await legacy.conversion.count(); // externalId now exists
    const again = execFileSync(process.execPath,['scripts/upgrade-db.cjs','--backup-confirmed'],{cwd,env,encoding:'utf8'});
    assert.match(again, /Данные не сбрасывались/);
  } finally {await legacy.$disconnect();}
});

test('Missing migration preserves historical Lead.contact as handle', async () => {
  const { mkdirSync, copyFileSync, readdirSync, statSync } = require('node:fs');
  const runMigrationCommand = (args, options) => {
    try { return execFileSync(process.execPath, args, options); }
    catch (error) {
      const details = error.stderr?.toString();
      if (details) error.message += `\nPrisma stderr:\n${details}`;
      throw error;
    }
  };
  const fixture = path.join(directory,'historical'); mkdirSync(fixture);
  const cwd = path.resolve(__dirname,'..');
  copyFileSync(path.join(cwd,'prisma/schema.prisma'),path.join(fixture,'schema.prisma'));
  mkdirSync(path.join(fixture,'migrations'));
  copyFileSync(path.join(cwd,'prisma/migrations/migration_lock.toml'),path.join(fixture,'migrations/migration_lock.toml'));
  for (const migration of ['20260325062249_init','20260325064930_add_leads','20260325072411_add_ai_feedback','20260705234626_add_learning_schema','20260712222645_add_traffic_module']) {
    const source = path.join(cwd,'prisma/migrations',migration); const target = path.join(fixture,'migrations',migration);
    mkdirSync(target);
    for (const file of readdirSync(source)) if (statSync(path.join(source,file)).isFile()) copyFileSync(path.join(source,file),path.join(target,file));
  }
  const url=`file:${path.join(directory,'historical.db')}`; const env={...process.env,DATABASE_URL:url};
  runMigrationCommand(['node_modules/prisma/build/index.js','migrate','deploy','--schema',path.join(fixture,'schema.prisma')],{cwd,env,stdio:'pipe'});
  const {PrismaClient}=require('@prisma/client'); const historical=new PrismaClient({datasources:{db:{url}}});
  try {
    await historical.$executeRawUnsafe('INSERT INTO "Project" (id,name,niche,updatedAt) VALUES (?,?,?,CURRENT_TIMESTAMP)','historical-project','Test','test');
    await historical.$executeRawUnsafe('INSERT INTO "Lead" (id,name,contact,source,projectId) VALUES (?,?,?,?,?)','historical-lead','Test','preserved-contact','test','historical-project');
    await historical.$disconnect();
    runMigrationCommand(['scripts/upgrade-db.cjs','--backup-confirmed'],{cwd,env,stdio:'pipe'});
    assert.equal((await historical.lead.findUnique({where:{id:'historical-lead'}})).handle,'preserved-contact');
  } finally {await historical.$disconnect();}
});

/** Archive and remove only exact batches created by the retired dues GET.
 * node scripts/clean-dues-placeholders.mjs          (read-only preview)
 * node scripts/clean-dues-placeholders.mjs --apply  (archive, then remove)
 */
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { MongoClient } from 'mongodb';

if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
const output = ts.transpileModule(fs.readFileSync('lib/dues.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const exports = {};
vm.runInNewContext(output, { exports, Intl, Date });
const apply = process.argv.includes('--apply');
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
try {
  const db = client.db(process.env.MONGODB_DB ?? 'ecp_platform');
  const collection = db.collection('duesPayments');
  const all = await collection.find({ schemaVersion: { $exists: false } }).toArray();
  const { placeholders } = exports.splitDuesPlaceholders(all);
  console.log(`${apply ? 'APPLY' : 'PREVIEW'}: ${placeholders.length} exact placeholder rows in ${new Set(placeholders.map(row => row.userId)).size} accounts.`);
  if (apply) {
    const archive = db.collection('duesPlaceholderArchive');
    let removed = 0;
    for (const row of placeholders) {
      await archive.updateOne({ _id: row._id }, { $setOnInsert: { ...row, archivedAt: new Date().toISOString(), archiveReason: 'Retired GET generated sample dues' } }, { upsert: true });
      // Match the complete original snapshot: a concurrent real payment is preserved.
      const result = await collection.deleteOne(row);
      removed += result.deletedCount;
    }
    console.log(`Archived and removed ${removed} rows. Real payments were preserved.`);
  } else console.log('No changes written. Use --apply to archive and remove these rows.');
} finally { await client.close(); }

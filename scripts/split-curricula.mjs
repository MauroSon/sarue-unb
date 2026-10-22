// Divide public/data/curricula.json (catálogo completo, ~40 MB) em um arquivo
// por curso: public/data/curricula/<course_id>.json. O app passa a baixar só
// o arquivo do curso do discente quando há login SIGAA.
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const idx = args.indexOf(flag);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
};

const input = path.resolve(getArg('--input', './public/data/curricula.json'));
const outDir = path.resolve(getArg('--out-dir', './public/data/curricula'));

const all = JSON.parse(await fs.readFile(input, 'utf8'));
if (!Array.isArray(all) || all.length === 0) {
  console.error('curricula.json vazio ou inválido:', input);
  process.exit(1);
}

const byCourse = new Map();
for (const c of all) {
  if (!c.course_id) continue;
  if (!byCourse.has(c.course_id)) byCourse.set(c.course_id, []);
  byCourse.get(c.course_id).push(c);
}

await fs.mkdir(outDir, { recursive: true });
let totalBytes = 0;
for (const [courseId, list] of byCourse) {
  const body = JSON.stringify(list);
  totalBytes += body.length;
  await fs.writeFile(path.join(outDir, `${courseId}.json`), body);
}

const fullSize = (await fs.stat(input)).size;
console.log(`cursos: ${byCourse.size} arquivos em ${path.relative(process.cwd(), outDir)}`);
console.log(`catálogo completo: ${(fullSize / 1048576).toFixed(1)} MB — soma por curso: ${(totalBytes / 1048576).toFixed(1)} MB`);

/**
 * Scraper do catálogo de docentes do SIGAA — publica professors.json.
 *
 * O catálogo de docentes muda raramente, então roda trimestralmente via
 * .github/workflows/scrape-professors.yml (ou `pnpm run scrape:professors`
 * manualmente), separado da coleta diária da grade.
 *
 * Reusa initDocentesSession/scrapeDocentesDepartment/buildProfessorsCatalog do
 * grade-scraper, que segue sendo o único lugar com a síntese "catálogo a
 * partir das turmas". Para o cruzamento docente ↔ disciplina, lê
 * classes.json e departments.json do diretório de saída (publicados pelo
 * workflow diário); se estiverem ausentes, coleta as turmas ao vivo.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { GradeScraper } from './grade-scraper.ts';
import type {
  Department,
  ScrapedDiscipline,
  ScrapedProfessor,
} from './grade-scraper.ts';

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string, def: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
  };

  const year = getArg('--year', process.env.SCRAPER_YEAR || '2026');
  const period = getArg('--period', process.env.SCRAPER_PERIOD || '2');
  const outDir = path.resolve(getArg('--out-dir', process.env.OUTPUT_DIR || './data'));
  const targetDept = getArg('--dept', '');
  const limitStr = getArg('--limit', '');
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;

  console.log(`[ProfessorsScraper] Iniciando coleta de docentes: ano=${year}, período=${period}`);
  console.log(`[ProfessorsScraper] Diretório de saída: ${outDir}`);

  await fs.mkdir(outDir, { recursive: true });

  const scraper = new GradeScraper();

  // Departamentos: arquivo publicado pelo workflow diário; se ausente, coleta ao vivo
  let departments: Department[] = [];
  try {
    const raw = JSON.parse(await fs.readFile(path.join(outDir, 'departments.json'), 'utf-8'));
    if (Array.isArray(raw)) departments = raw;
  } catch {}
  if (departments.length === 0) {
    console.log('[ProfessorsScraper] departments.json ausente; coletando ao vivo...');
    const initialHtml = await scraper.initSession();
    departments = scraper.parseDepartments(initialHtml);
  }
  console.log(`[ProfessorsScraper] ${departments.length} departamentos disponíveis.`);

  // Turmas para o cruzamento: idem
  let allDisciplines: ScrapedDiscipline[] = [];
  try {
    const raw = JSON.parse(await fs.readFile(path.join(outDir, 'classes.json'), 'utf-8'));
    if (Array.isArray(raw)) allDisciplines = raw;
  } catch {}
  if (allDisciplines.length === 0) {
    console.log('[ProfessorsScraper] classes.json ausente; coletando turmas ao vivo...');
    for (const dept of departments) {
      try {
        const disciplines = await scraper.scrapeDepartment(dept.id, year, period);
        allDisciplines.push(...disciplines);
      } catch (e) {
        console.warn(`[ProfessorsScraper] Erro ao raspar depto ${dept.id} (${dept.name}):`, e);
      }
      // Breve pausa para não sobrecarregar o servidor do SIGAA
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  console.log(`[ProfessorsScraper] ${allDisciplines.length} disciplinas para cruzamento.`);

  // Coleta o catálogo de docentes do diretório público do SIGAA
  const directoryProfessors: ScrapedProfessor[] = [];
  try {
    const docentesInitHtml = await scraper.initDocentesSession();
    let docenteDepts = scraper.parseDocenteDepartments(docentesInitHtml);
    if (targetDept) {
      docenteDepts = docenteDepts.filter((d) => d.id === targetDept);
    }
    if (limit && limit > 0) {
      docenteDepts = docenteDepts.slice(0, limit);
    }

    console.log(
      `[ProfessorsScraper] Coletando diretório público de docentes para ${docenteDepts.length} unidades...`
    );

    let profDeptProcessed = 0;
    for (const dept of docenteDepts) {
      try {
        const profs = await scraper.scrapeDocentesDepartment(
          dept.id,
          dept.name,
          docentesInitHtml
        );
        directoryProfessors.push(...profs);
        profDeptProcessed++;
        if (profs.length > 0) {
          console.log(
            `[ProfessorsScraper] [Docentes ${profDeptProcessed}/${docenteDepts.length}] ${dept.name} (${dept.id}): ${profs.length} docentes.`
          );
        }
      } catch (e) {
        console.warn(
          `[ProfessorsScraper] Erro ao raspar docentes do depto ${dept.id} (${dept.name}):`,
          e
        );
      }
      await new Promise((r) => setTimeout(r, 150));
    }
  } catch (e) {
    console.warn(
      `[ProfessorsScraper] Falha ao consultar busca_docentes.jsf (${e}). Construindo catálogo a partir das turmas.`
    );
  }

  const allProfessors = GradeScraper.buildProfessorsCatalog(
    directoryProfessors,
    allDisciplines,
    departments
  );
  const professorsPath = path.join(outDir, 'professors.json');
  await fs.writeFile(professorsPath, JSON.stringify(allProfessors, null, 2), 'utf-8');
  console.log(
    `[ProfessorsScraper] Salvo: ${professorsPath} (${allProfessors.length} professores catalogados)`
  );

  // Atualiza o total no grade-meta.json, se presente (publicado pelo workflow diário)
  const metaPath = path.join(outDir, 'grade-meta.json');
  try {
    const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8')) as Record<string, unknown>;
    meta.total_professors = allProfessors.length;
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  } catch {}

  // Sincroniza cópia para public/data/ para desenvolvimento local transparente
  const publicDataDir = path.resolve('public', 'data');
  if (path.resolve(outDir) !== publicDataDir) {
    try {
      await fs.mkdir(publicDataDir, { recursive: true });
      await fs.copyFile(professorsPath, path.join(publicDataDir, 'professors.json'));
      console.log(`[ProfessorsScraper] Sincronizado para ${publicDataDir}`);
    } catch {}
  }
}

// Execução se chamado diretamente via CLI
if (process.argv[1] && process.argv[1].endsWith('professors-scraper.ts')) {
  main().catch((err) => {
    console.error('[ProfessorsScraper] Falha fatal:', err);
    process.exit(1);
  });
}

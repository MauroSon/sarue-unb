import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag, def) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
  };

  const outDir = path.resolve(getArg('--out-dir', './dist-data'));
  
  // Coleta todas as pastas passadas em --inputs dir1 dir2 ... ou argumentos livres
  const inputDirs = [];
  const inputsIdx = args.indexOf('--inputs');
  if (inputsIdx >= 0) {
    for (let i = inputsIdx + 1; i < args.length; i++) {
      if (args[i].startsWith('--')) break;
      inputDirs.push(path.resolve(args[i]));
    }
  }

  const parentDir = getArg('--parent-dir', '');
  if (parentDir) {
    try {
      const entries = await fs.readdir(path.resolve(parentDir), { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          inputDirs.push(path.resolve(parentDir, entry.name));
        }
      }
    } catch (e) {
      console.warn(`[MergeCoursesShards] Aviso ao listar parent-dir ${parentDir}: ${e.message}`);
    }
  }

  if (inputDirs.length === 0) {
    // Tenta detectar dist-data-1, dist-data-2 ou pastas dentro de artifacts
    const defaultCandidates = ['./dist-data-1', './dist-data-2'];
    for (const d of defaultCandidates) {
      try {
        const stat = await fs.stat(d);
        if (stat.isDirectory()) inputDirs.push(path.resolve(d));
      } catch {}
    }
  }

  console.log(`[MergeCoursesShards] Iniciando unificação de ${inputDirs.length} partes.`);
  console.log(`[MergeCoursesShards] Pastas de entrada:`, inputDirs);
  console.log(`[MergeCoursesShards] Pasta de saída: ${outDir}`);

  await fs.mkdir(outDir, { recursive: true });

  let allCourses = [];
  const allCurriculaMap = new Map();

  for (const dir of inputDirs) {
    // 1. Lê courses.json
    try {
      const coursesPath = path.join(dir, 'courses.json');
      const coursesRaw = await fs.readFile(coursesPath, 'utf-8');
      const courses = JSON.parse(coursesRaw);
      if (courses.length > allCourses.length) {
        allCourses = courses;
      }
    } catch (e) {
      console.warn(`[MergeCoursesShards] Aviso ao ler courses.json em ${dir}: ${e.message}`);
    }

    // 2. Lê curricula.json
    try {
      const curriculaPath = path.join(dir, 'curricula.json');
      const curriculaRaw = await fs.readFile(curriculaPath, 'utf-8');
      const curricula = JSON.parse(curriculaRaw);
      for (const curr of curricula) {
        allCurriculaMap.set(curr.id, curr);
      }
    } catch (e) {
      console.warn(`[MergeCoursesShards] Aviso ao ler curricula.json em ${dir}: ${e.message}`);
    }
  }

  const mergedCurricula = Array.from(allCurriculaMap.values());

  // Mapeia os currículos unificados para os seus respectivos cursos
  const courseCurriculaIds = new Map();
  for (const curr of mergedCurricula) {
    if (!courseCurriculaIds.has(curr.course_id)) {
      courseCurriculaIds.set(curr.course_id, []);
    }
    courseCurriculaIds.get(curr.course_id).push(curr.id);
  }

  for (const course of allCourses) {
    const ids = courseCurriculaIds.get(course.id);
    if (ids) {
      course.curricula_ids = Array.from(new Set(ids));
    }
  }

  const coursesPath = path.join(outDir, 'courses.json');
  const curriculaPath = path.join(outDir, 'curricula.json');
  const metaPath = path.join(outDir, 'courses-meta.json');

  await fs.writeFile(coursesPath, JSON.stringify(allCourses, null, 2), 'utf-8');
  await fs.writeFile(curriculaPath, JSON.stringify(mergedCurricula, null, 2), 'utf-8');

  const meta = {
    scraped_at: new Date().toISOString(),
    total_courses: allCourses.length,
    processed_courses: allCourses.filter((c) => c.curricula_ids && c.curricula_ids.length > 0).length,
    total_curricula: mergedCurricula.length,
    total_disciplines: mergedCurricula.reduce(
      (acc, c) =>
        acc +
        (c.mandatory_disciplines?.length || 0) +
        (c.elective_disciplines?.length || 0),
      0
    ),
  };
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  console.log(
    `[MergeCoursesShards] Unificação concluída com sucesso!
- Total de Cursos: ${allCourses.length} (${meta.processed_courses} com matrizes coletadas)
- Total de Estruturas Curriculares: ${mergedCurricula.length}
- Total de Disciplinas Mapeadas: ${meta.total_disciplines}
- Arquivos salvos em: ${outDir}`
  );
}

main().catch((err) => {
  console.error('[MergeCoursesShards] Falha fatal:', err);
  process.exit(1);
});

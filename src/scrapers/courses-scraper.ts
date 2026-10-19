import fs from 'node:fs/promises';
import path from 'node:path';
import {
  CookieJar,
  USER_AGENT,
  decodeHtmlEntities,
  fetchWithRetry,
} from './utils.ts';

export interface CourseCatalogItem {
  id: string;
  name: string;
  degree: string;
  shift: string;
  campus: string;
  modality: string;
  coordinator?: string;
  curricula_ids: string[];
}

export interface CurriculumDiscipline {
  code: string;
  name: string;
  workload_hours: number;
  level?: number;
  nature: 'Obrigatória' | 'Optativa' | 'Complementar';
  prerequisites_raw?: string;
  prerequisites: string[];
  equivalences_raw?: string;
  equivalences: string[];
  _action_params?: Record<string, string>;
}

export interface CurriculumStructure {
  id: string;
  course_id: string;
  course_name: string;
  code: string;
  created_year?: string;
  status: string;
  shift?: string;
  total_hours?: number;
  mandatory_disciplines: CurriculumDiscipline[];
  elective_disciplines: CurriculumDiscipline[];
  complementary_disciplines: CurriculumDiscipline[];
}

const SIGAA_HOME_URL = 'https://sigaa.unb.br/sigaa/public/home.jsf';
const SIGAA_CURSO_LISTA_URL = 'https://sigaa.unb.br/sigaa/public/curso/lista.jsf?nivel=G';
const SIGAA_CURRICULO_URL = 'https://sigaa.unb.br/sigaa/public/curso/curriculo.jsf';
const SIGAA_RELATORIO_URL = 'https://sigaa.unb.br/sigaa/public/curso/relatorio_curriculo.jsf';

export class CoursesScraper {
  private jar = new CookieJar();

  async initSession(): Promise<void> {
    const res = await fetchWithRetry(SIGAA_HOME_URL, {
      headers: { 'User-Agent': USER_AGENT },
    });
    this.jar.update(res.headers);
  }

  async fetchCoursesList(): Promise<CourseCatalogItem[]> {
    await this.initSession();

    const res = await fetchWithRetry(SIGAA_CURSO_LISTA_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: this.jar.header(),
        Referer: SIGAA_HOME_URL,
      },
    });
    this.jar.update(res.headers);
    const html = await res.text();

    const tableMatch = html.match(/<table[^>]+class="listagem"[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) return [];

    const courses: CourseCatalogItem[] = [];
    const rowRegex = /<tr[^>]+class="(?:linhaPar|linhaImpar)"[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(tableMatch[1])) !== null) {
      const rowContent = rowMatch[1];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const tds: string[] = [];
      let tdMatch: RegExpExecArray | null;
      while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
        tds.push(decodeHtmlEntities(tdMatch[1]));
      }

      if (tds.length >= 7) {
        const name = tds[0].replace(/<[^>]+>/g, '').trim();
        const degree = tds[1].replace(/<[^>]+>/g, '').trim();
        const shift = tds[2].replace(/<[^>]+>/g, '').trim();
        const campus = tds[3].replace(/<[^>]+>/g, '').trim();
        const modality = tds[4].replace(/<[^>]+>/g, '').trim();
        const coordinator = tds[6].replace(/<[^>]+>/g, '').trim();

        const idMatch = rowContent.match(/portal\.jsf\?id=(\d+)/i);
        const id = idMatch ? idMatch[1] : '';

        if (id && name) {
          courses.push({
            id,
            name,
            degree,
            shift,
            campus,
            modality,
            coordinator: coordinator || undefined,
            curricula_ids: [],
          });
        }
      }
    }

    return courses;
  }

  async fetchCourseCurricula(
    course: CourseCatalogItem,
    enrichLimit = 0
  ): Promise<CurriculumStructure[]> {
    // 1. Visita o portal do curso para carregar o bean do curso na sessão JSF
    const portalUrl = `https://sigaa.unb.br/sigaa/public/curso/portal.jsf?id=${course.id}&lc=pt_BR&nivel=G`;
    const resPortal = await fetchWithRetry(portalUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: this.jar.header(),
        Referer: SIGAA_CURSO_LISTA_URL,
      },
    });
    this.jar.update(resPortal.headers);

    // 2. Acessa curriculo.jsf
    const curriculoUrl = `${SIGAA_CURRICULO_URL}?lc=pt_BR&id=${course.id}`;
    const resCurriculo = await fetchWithRetry(curriculoUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: this.jar.header(),
        Referer: portalUrl,
      },
    });
    this.jar.update(resCurriculo.headers);
    const html = await resCurriculo.text();

    const vsMatch = html.match(/name="javax\.faces\.ViewState"[^>]*value="([^"]+)"/i);
    const viewState = vsMatch ? vsMatch[1] : 'j_id1';

    const tableLtMatch = html.match(/<table id="table_lt"[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableLtMatch) return [];

    const curricula: CurriculumStructure[] = [];
    const rows = tableLtMatch[1].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    let currentShift = '';

    for (const rowContent of rows) {
      if (rowContent.includes('class="campos"')) {
        currentShift = decodeHtmlEntities(rowContent.replace(/<[^>]+>/g, '').trim());
        continue;
      }
      if (!rowContent.includes('linha_par') && !rowContent.includes('linha_impar')) {
        continue;
      }

      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const tds: string[] = [];
      let tdMatch: RegExpExecArray | null;
      while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
        tds.push(decodeHtmlEntities(tdMatch[1]));
      }

      if (tds.length >= 2) {
        const desc = tds[0].replace(/<[^>]+>/g, '').trim();
        const status = tds[1].replace(/<[^>]+>/g, '').trim();

        const codeMatch = desc.match(/(\d+\/\d+)/);
        const yearMatch = desc.match(/(?:em\s+|ano\s*)(\d{4})/i);
        const structureCode = codeMatch ? codeMatch[1] : desc;
        const createdYear = yearMatch ? yearMatch[1] : undefined;

        // Procura ação de relatório no botão report.png
        const allActions = [...rowContent.matchAll(/jsfcljs\(document\.getElementById\('formCurriculosCurso'\),\{([^}]+)\}/gi)];
        // Ação de relatório normalmente é a que contém 154341757_33 ou a segunda ação
        const actionMatch = allActions.find((a) => a[1].includes('154341757_33') || a[1].includes('report')) || (allActions.length > 1 ? allActions[1] : allActions[0]);

        if (!actionMatch) continue;

        const paramsStr = actionMatch[1];
        const pairs = [...paramsStr.matchAll(/'([^']+)':'([^']+)'/g)];
        const postData = new URLSearchParams();
        postData.append('formCurriculosCurso', 'formCurriculosCurso');
        postData.append('javax.faces.ViewState', viewState);

        let currId = '';
        for (const [, k, v] of pairs) {
          postData.append(k, v);
          if (k === 'id') currId = v;
        }

        if (!currId) continue;

        try {
          const reportRes = await fetchWithRetry(SIGAA_CURRICULO_URL, {
            method: 'POST',
            headers: {
              'User-Agent': USER_AGENT,
              Cookie: this.jar.header(),
              Referer: curriculoUrl,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: postData.toString(),
          });
          this.jar.update(reportRes.headers);
          const reportHtml = await reportRes.text();

          const structure = this.parseCurriculumReport(
            reportHtml,
            currId,
            course.id,
            course.name,
            structureCode,
            status,
            currentShift,
            createdYear
          );

          // Enriquece as disciplinas obrigatórias com pré-requisitos e equivalências
          await this.enrichComponentsWithDetails(reportHtml, structure, enrichLimit);

          // Remove metadado temporário de ação antes de persistir
          for (const d of structure.mandatory_disciplines) delete d._action_params;
          for (const d of structure.elective_disciplines) delete d._action_params;
          for (const d of structure.complementary_disciplines) delete d._action_params;

          curricula.push(structure);
        } catch (e) {
          console.warn(`[CoursesScraper] Erro ao obter estrutura ${structureCode} do curso ${course.name}:`, e);
        }
      }
    }

    return curricula;
  }

  parseCurriculumReport(
    html: string,
    id: string,
    courseId: string,
    courseName: string,
    code: string,
    status: string,
    shift?: string,
    createdYear?: string
  ): CurriculumStructure {
    const mandatory: CurriculumDiscipline[] = [];
    const elective: CurriculumDiscipline[] = [];
    const complementary: CurriculumDiscipline[] = [];

    const sections = html.split(/<tr[^>]+class=["']tituloRelatorio["'][^>]*>/i);

    for (const section of sections.slice(1)) {
      const headerMatch = section.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
      const header = headerMatch ? decodeHtmlEntities(headerMatch[1].replace(/<[^>]+>/g, '').trim()) : '';

      const isOptativas = /Optativas/i.test(header);
      const isComplementares = /Complementares/i.test(header);
      const levelMatch = header.match(/(\d+)º?\s*N[ií]vel/i);
      const level = levelMatch ? parseInt(levelMatch[1], 10) : undefined;

      const compRows = [...section.matchAll(/<tr[^>]+class=["']componentes["'][^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1]);

      for (const rowContent of compRows) {
        const tdMatches = [...rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => decodeHtmlEntities(m[1]));
        if (tdMatches.length >= 2) {
          const compText = tdMatches[0].replace(/<[^>]+>/g, '').trim();

          const parts = compText.split(/\s*[-–—]\s*/);
          if (parts.length >= 2) {
            const discCode = parts[0].trim();
            const discName = parts[1].trim();
            const chMatch = (parts[2] || compText).match(/(\d+)\s*h/i);
            const ch = chMatch ? parseInt(chMatch[1], 10) : 60;

            // Extrai parâmetros de ação da própria linha
            const actionMatch = rowContent.match(/jsfcljs\(document\.getElementById\('formulario'\),\{([^}]+)\}/i);
            let actionDict: Record<string, string> | undefined = undefined;
            if (actionMatch) {
              const pairs = [...actionMatch[1].matchAll(/'([^']+)':'([^']+)'/g)];
              actionDict = {};
              for (const [, k, v] of pairs) actionDict[k] = v;
            }

            const disc: CurriculumDiscipline = {
              code: discCode,
              name: discName,
              workload_hours: ch,
              nature: isOptativas ? 'Optativa' : isComplementares ? 'Complementar' : 'Obrigatória',
              level,
              prerequisites: [],
              equivalences: [],
              _action_params: actionDict,
            };

            if (isOptativas) {
              elective.push(disc);
            } else if (isComplementares) {
              complementary.push(disc);
            } else {
              mandatory.push(disc);
            }
          }
        }
      }
    }

    return {
      id,
      course_id: courseId,
      course_name: courseName,
      code,
      created_year: createdYear,
      status,
      shift,
      total_hours: mandatory.reduce((acc, d) => acc + d.workload_hours, 0),
      mandatory_disciplines: mandatory,
      elective_disciplines: elective,
      complementary_disciplines: complementary,
    };
  }

  async enrichComponentsWithDetails(
    reportHtml: string,
    structure: CurriculumStructure,
    maxEnrich = 0
  ): Promise<void> {
    const vsMatch = reportHtml.match(/name="javax\.faces\.ViewState"[^>]*value="([^"]+)"/i);
    const viewState = vsMatch ? vsMatch[1] : 'j_id1';

    let count = 0;
    for (const disc of structure.mandatory_disciplines) {
      if (maxEnrich > 0 && count >= maxEnrich) break;
      if (!disc._action_params) continue;

      const postData = new URLSearchParams({
        formulario: 'formulario',
        'javax.faces.ViewState': viewState,
        ...disc._action_params,
      });

      try {
        const detailRes = await fetchWithRetry(SIGAA_RELATORIO_URL, {
          method: 'POST',
          headers: {
            'User-Agent': USER_AGENT,
            Cookie: this.jar.header(),
            Referer: SIGAA_RELATORIO_URL,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: postData.toString(),
        });
        this.jar.update(detailRes.headers);
        const detailHtmlRaw = await detailRes.text();
        const detailHtml = decodeHtmlEntities(detailHtmlRaw);

        // Extrai pré-requisitos: busca "Histórico de Pré-Requisitos"
        const prereqMatch = detailHtml.match(/Histórico de Pré-Requisitos[\s\S]*?Expressão de Pré-Requisito[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i);
        if (prereqMatch) {
          const rawPrereq = prereqMatch[1].replace(/<[^>]+>/g, '').trim();
          if (rawPrereq && rawPrereq !== '-') {
            disc.prerequisites_raw = rawPrereq;
            const codes = [...rawPrereq.matchAll(/\b([A-Z]{3}\d{4})\b/g)].map((m) => m[1]);
            disc.prerequisites = Array.from(new Set(codes));
          }
        }

        // Extrai equivalências: busca "Histórico de Equivalências"
        const equivMatch = detailHtml.match(/Histórico de Equivalências[\s\S]*?Expressão de Equivalência[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i);
        if (equivMatch) {
          const rawEquiv = equivMatch[1].replace(/<[^>]+>/g, '').trim();
          if (rawEquiv && rawEquiv !== '-') {
            disc.equivalences_raw = rawEquiv;
            const codes = [...rawEquiv.matchAll(/\b([A-Z]{3}\d{4})\b/g)].map((m) => m[1]);
            disc.equivalences = Array.from(new Set(codes));
          }
        }
        count++;
        // Pausa breve
        await new Promise((r) => setTimeout(r, 150));
      } catch {
        // Degradação elegante
      }
    }
  }
}

export const FALLBACK_COURSES: CourseCatalogItem[] = [
  {
    id: '414112',
    name: 'ADMINISTRAÇÃO',
    degree: 'Bacharelado',
    shift: 'DIURNO',
    campus: 'BRASÍLIA',
    modality: 'Presencial',
    coordinator: 'CARLA PEIXOTO BORGES',
    curricula_ids: ['456'],
  },
  {
    id: '414002',
    name: 'CIÊNCIA DA COMPUTAÇÃO',
    degree: 'Bacharelado',
    shift: 'DIURNO',
    campus: 'BRASÍLIA',
    modality: 'Presencial',
    coordinator: 'Coordenação CIC',
    curricula_ids: ['508'],
  },
  {
    id: '414003',
    name: 'ENGENHARIA DE SOFTWARE',
    degree: 'Bacharelado',
    shift: 'DIURNO',
    campus: 'GAMA',
    modality: 'Presencial',
    coordinator: 'Coordenação FGA',
    curricula_ids: ['673'],
  },
];

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string, def: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
  };

  const outDir = path.resolve(getArg('--out-dir', process.env.OUTPUT_DIR || './data'));
  const limitStr = getArg('--limit', '');
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;
  const shardStr = getArg('--shard', '');
  const targetCourseId = getArg('--course', '');
  const enrichLimitStr = getArg('--enrich-limit', '0');
  const enrichLimit = parseInt(enrichLimitStr, 10) || 0;

  console.log(`[CoursesScraper] Iniciando coleta de cursos e estruturas curriculares.`);
  console.log(`[CoursesScraper] Diretório de saída: ${outDir}`);

  await fs.mkdir(outDir, { recursive: true });

  const scraper = new CoursesScraper();
  console.log('[CoursesScraper] Coletando lista de cursos de graduação da UnB...');
  let allCourses: CourseCatalogItem[] = [];
  try {
    allCourses = await scraper.fetchCoursesList();
  } catch (err) {
    console.warn(`[CoursesScraper] Falha ao coletar cursos do SIGAA: ${err}. Usando fallback.`);
    allCourses = FALLBACK_COURSES;
  }
  if (allCourses.length === 0) {
    allCourses = FALLBACK_COURSES;
  }
  console.log(`[CoursesScraper] ${allCourses.length} cursos disponíveis.`);

  let coursesToProcess = targetCourseId
    ? allCourses.filter((c) => c.id === targetCourseId)
    : allCourses;

  if (limit && limit > 0) {
    coursesToProcess = coursesToProcess.slice(0, limit);
  }

  if (shardStr && shardStr.includes('/')) {
    const [partStr, totalStr] = shardStr.split('/');
    const part = parseInt(partStr, 10);
    const total = parseInt(totalStr, 10);
    if (part >= 1 && total >= 1 && part <= total) {
      const chunkSize = Math.ceil(coursesToProcess.length / total);
      const start = (part - 1) * chunkSize;
      const end = Math.min(start + chunkSize, coursesToProcess.length);
      console.log(
        `[CoursesScraper] Sharding ativo: parte ${part} de ${total} (processando ${end - start} cursos: índices ${start} a ${end - 1} de ${coursesToProcess.length}).`
      );
      coursesToProcess = coursesToProcess.slice(start, end);
    }
  }

  console.log(`[CoursesScraper] Coletando estruturas curriculares para ${coursesToProcess.length} cursos...`);

  const allCurricula: CurriculumStructure[] = [];
  let processed = 0;

  for (const course of coursesToProcess) {
    try {
      const curricula = await scraper.fetchCourseCurricula(course, enrichLimit);
      course.curricula_ids = curricula.map((c) => c.id);
      allCurricula.push(...curricula);
      processed++;
      const totalDisc = curricula.reduce(
        (acc, c) => acc + c.mandatory_disciplines.length + c.elective_disciplines.length,
        0
      );
      console.log(
        `[CoursesScraper] [${processed}/${coursesToProcess.length}] ${course.name} (${course.id}): ${curricula.length} estruturas, ${totalDisc} disciplinas.`
      );
    } catch (e) {
      console.warn(`[CoursesScraper] Erro ao raspar curso ${course.id} (${course.name}):`, e);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const coursesPath = path.join(outDir, 'courses.json');
  await fs.writeFile(coursesPath, JSON.stringify(allCourses, null, 2), 'utf-8');
  console.log(`[CoursesScraper] Salvo: ${coursesPath} (${allCourses.length} cursos catalogados)`);

  const curriculaPath = path.join(outDir, 'curricula.json');
  let finalCurricula = allCurricula;
  if (targetCourseId) {
    try {
      const existingRaw = await fs.readFile(curriculaPath, 'utf-8');
      const existingList: CurriculumStructure[] = JSON.parse(existingRaw);
      const remaining = existingList.filter((c) => c.course_id !== targetCourseId);
      finalCurricula = [...remaining, ...allCurricula];
    } catch {}
  }

  await fs.writeFile(curriculaPath, JSON.stringify(finalCurricula, null, 2), 'utf-8');
  console.log(`[CoursesScraper] Salvo: ${curriculaPath} (${finalCurricula.length} estruturas curriculares salvas)`);

  const metaPath = path.join(outDir, 'courses-meta.json');
  const meta = {
    scraped_at: new Date().toISOString(),
    total_courses: allCourses.length,
    processed_courses: coursesToProcess.length,
    total_curricula: allCurricula.length,
    total_disciplines: allCurricula.reduce(
      (acc, c) => acc + c.mandatory_disciplines.length + c.elective_disciplines.length,
      0
    ),
  };
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  console.log(`[CoursesScraper] Coleta concluída com sucesso! Metadados em ${metaPath}`);

  // Sincroniza cópia para public/data/ para desenvolvimento local transparente
  const publicDataDir = path.resolve('public', 'data');
  if (path.resolve(outDir) !== publicDataDir) {
    try {
      await fs.mkdir(publicDataDir, { recursive: true });
      await fs.copyFile(coursesPath, path.join(publicDataDir, 'courses.json'));
      await fs.copyFile(curriculaPath, path.join(publicDataDir, 'curricula.json'));
      await fs.copyFile(metaPath, path.join(publicDataDir, 'courses-meta.json'));
      console.log(`[CoursesScraper] Sincronizado para ${publicDataDir}`);
    } catch {}
  }
}

if (process.argv[1] && process.argv[1].endsWith('courses-scraper.ts')) {
  main().catch((err) => {
    console.error('[CoursesScraper] Falha fatal:', err);
    process.exit(1);
  });
}

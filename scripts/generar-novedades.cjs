const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const novedadesMdPath = path.join(rootDir, 'NOVEDADES.md');
const outputJsonPath = path.join(rootDir, 'public', 'novedades.json');
const versionJsonPath = path.join(rootDir, 'public', 'version.json');

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function obtenerFechaIsoMonterrey() {
  const ahora = new Date();
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Monterrey',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(ahora);

  const year = partes.find((p) => p.type === 'year')?.value || String(ahora.getUTCFullYear());
  const month = partes.find((p) => p.type === 'month')?.value || String(ahora.getUTCMonth() + 1).padStart(2, '0');
  const day = partes.find((p) => p.type === 'day')?.value || String(ahora.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatearFechaEspanol(fechaIso) {
  const m = String(fechaIso || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(fechaIso || '').trim();
  const year = Number(m[1]);
  const monthIdx = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
    return `${day} de ${MONTHS_ES[monthIdx]} de ${year}`;
  }
  return String(fechaIso || '').trim();
}

function capitalizeFirst(str) {
  const s = String(str || '').trim();
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isIgnoredCommitMessage(message) {
  const firstLine = String(message || '').split(/\r?\n/)[0].trim();
  if (!firstLine) return true;
  return (
    /^chore:\s*versi[oó]n/i.test(firstLine) ||
    /\[skip ci\]/i.test(firstLine) ||
    /^merge\s+(branch|pull request|remote-tracking)/i.test(firstLine) ||
    /^agregar keystore fija/i.test(firstLine) ||
    /^revert\s+"?chore:\s*versi[oó]n/i.test(firstLine)
  );
}

function commitToNovedad(message) {
  const lines = String(message || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  let subject = lines[0].replace(/\s*\(#\d+\)\s*$/, '').trim();
  if (!subject) return null;

  const extraBody = lines
    .slice(1)
    .filter((l) => !/^co-authored-by:/i.test(l) && !/^signed-off-by:/i.test(l))
    .join(' ')
    .trim();

  const convMatch = subject.match(/^(feat|fix|perf|refactor|style|security|docs|build|chore)(?:\(([^)]+)\))?!?:\s*(.+)$/i);
  if (convMatch) {
    const type = convMatch[1].toLowerCase();
    const scope = (convMatch[2] || '').trim();
    const rest = convMatch[3].trim();

    const typeLabels = {
      feat: 'Nueva mejora',
      fix: 'Corrección',
      perf: 'Optimización',
      refactor: 'Mejora interna',
      style: 'Diseño e interfaz',
      security: 'Seguridad',
      docs: 'Documentación',
      build: 'Compilación',
      chore: 'Mantenimiento',
    };

    const innerColon = rest.indexOf(':');
    if (innerColon > 2 && innerColon < 52) {
      return {
        titulo: capitalizeFirst(rest.slice(0, innerColon)),
        descripcion: capitalizeFirst(rest.slice(innerColon + 1)),
      };
    }

    const baseTitle = typeLabels[type] || 'Actualización';
    const titulo = scope ? `${baseTitle} en ${capitalizeFirst(scope)}` : baseTitle;
    const descripcion = capitalizeFirst(extraBody ? `${rest}. ${extraBody}` : rest);
    return { titulo, descripcion };
  }

  const colonIdx = subject.indexOf(':');
  if (colonIdx > 2 && colonIdx < 56) {
    return {
      titulo: capitalizeFirst(subject.slice(0, colonIdx)),
      descripcion: capitalizeFirst(subject.slice(colonIdx + 1) + (extraBody ? ` ${extraBody}` : '')),
    };
  }

  const words = subject.split(/\s+/);
  if (words.length <= 4) {
    return {
      titulo: capitalizeFirst(subject),
      descripcion: capitalizeFirst(extraBody || 'Mejora aplicada en esta versión.'),
    };
  }

  return {
    titulo: capitalizeFirst(words.slice(0, 4).join(' ')),
    descripcion: capitalizeFirst(extraBody ? `${subject}. ${extraBody}` : subject),
  };
}

function parseMarkdownBullets(content) {
  const items = [];
  const lineas = String(content || '').split(/\r?\n/);
  for (const lineaRaw of lineas) {
    const linea = lineaRaw.trim();
    if (!linea.startsWith('-')) continue;
    const sinGuion = linea.replace(/^-\s*/, '').trim();
    if (!sinGuion) continue;

    const idxDosPuntos = sinGuion.indexOf(':');
    if (idxDosPuntos !== -1) {
      const titulo = capitalizeFirst(sinGuion.slice(0, idxDosPuntos));
      const descripcion = capitalizeFirst(sinGuion.slice(idxDosPuntos + 1));
      if (titulo || descripcion) {
        items.push({ titulo, descripcion });
      }
    } else {
      items.push({ titulo: 'Mejora', descripcion: capitalizeFirst(sinGuion) });
    }
  }
  return items;
}

function deduplicateNovedades(items) {
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    const titulo = String(item?.titulo || '').trim();
    const descripcion = String(item?.descripcion || item?.texto || '').trim();
    if (!titulo && !descripcion) continue;
    const key = `${titulo.toLowerCase()}|${descripcion.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ titulo, descripcion });
    if (unique.length >= 8) break;
  }
  return unique;
}

function tryExecGit(cmd) {
  try {
    return execSync(cmd, { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

async function fetchGithubCommitsInfo(repo, token) {
  if (!repo || typeof fetch !== 'function') return null;

  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'boveda-release-builder',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let lastTag = null;
  let lastReleaseNovedades = null;

  try {
    const relRes = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
    if (relRes.ok) {
      const rel = await relRes.json();
      if (rel?.tag_name) lastTag = String(rel.tag_name);
      const vjAsset = Array.isArray(rel?.assets)
        ? rel.assets.find((a) => String(a?.name || '').toLowerCase() === 'version.json')
        : null;
      if (vjAsset?.browser_download_url) {
        try {
          const vjRes = await fetch(vjAsset.browser_download_url);
          if (vjRes.ok) {
            const vjData = await vjRes.json();
            if (Array.isArray(vjData?.novedades)) {
              lastReleaseNovedades = vjData.novedades;
            }
          }
        } catch {}
      }
    }
  } catch {}

  const headRef = process.env.GITHUB_SHA || tryExecGit('git rev-parse HEAD') || 'HEAD';

  if (lastTag) {
    try {
      const cmpRes = await fetch(
        `https://api.github.com/repos/${repo}/compare/${encodeURIComponent(lastTag)}...${encodeURIComponent(headRef)}`,
        { headers }
      );
      if (cmpRes.ok) {
        const cmp = await cmpRes.json();
        const commits = Array.isArray(cmp?.commits) ? cmp.commits : [];
        const files = Array.isArray(cmp?.files) ? cmp.files.map((f) => f.filename) : [];
        const messages = commits
          .map((c) => c?.commit?.message || '')
          .filter((m) => !isIgnoredCommitMessage(m))
          .reverse();
        return { lastTag, messages, files, lastReleaseNovedades };
      }
    } catch {}
  }

  try {
    const commitsRes = await fetch(
      `https://api.github.com/repos/${repo}/commits?sha=${encodeURIComponent(headRef)}&per_page=20`,
      { headers }
    );
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      const messages = [];
      for (const c of Array.isArray(commits) ? commits : []) {
        const msg = c?.commit?.message || '';
        if (/^chore:\s*versi[oó]n/i.test(msg.split(/\r?\n/)[0] || '')) {
          break;
        }
        if (!isIgnoredCommitMessage(msg)) {
          messages.push(msg);
        }
      }
      return { lastTag, messages, files: [], lastReleaseNovedades };
    }
  } catch {}

  return null;
}

function getLocalGitInfo() {
  const lastTag = tryExecGit('git describe --tags --abbrev=0');
  let rawLog = '';
  let changedFiles = [];

  if (lastTag) {
    rawLog = tryExecGit(`git log ${lastTag}..HEAD --pretty=format:%B%x1e`);
    const filesOut = tryExecGit(`git diff --name-only ${lastTag}..HEAD`);
    if (filesOut) {
      changedFiles = filesOut.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    }
  } else {
    rawLog = tryExecGit('git log -n 15 --pretty=format:%B%x1e');
  }

  const messages = [];
  if (rawLog) {
    for (const block of rawLog.split('\x1e')) {
      const trimmed = block.trim();
      if (!trimmed) continue;
      if (/^chore:\s*versi[oó]n/i.test(trimmed.split(/\r?\n/)[0] || '')) {
        if (!lastTag) break;
        continue;
      }
      if (!isIgnoredCommitMessage(trimmed)) {
        messages.push(trimmed);
      }
    }
  }

  return { lastTag: lastTag || null, messages, files: changedFiles, lastReleaseNovedades: null };
}

async function generarNovedades() {
  const repo = process.env.GITHUB_REPOSITORY || 'cuentaderecuperacion7525-hub/Boveda-Segura-Oficial';
  const token = process.env.GITHUB_TOKEN || '';

  const fechaIso = obtenerFechaIsoMonterrey();
  const fechaEspanol = formatearFechaEspanol(fechaIso);

  let existingVersionJson = {};
  if (fs.existsSync(versionJsonPath)) {
    try {
      existingVersionJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
    } catch {}
  }

  const ghInfo = await fetchGithubCommitsInfo(repo, token);
  const localInfo = getLocalGitInfo();

  const sourceInfo =
    ghInfo && (ghInfo.messages.length > 0 || ghInfo.files.length > 0)
      ? ghInfo
      : localInfo;

  const touchedNovedadesMd = sourceInfo.files.includes('NOVEDADES.md');
  const touchedVersionJson = sourceInfo.files.includes('public/version.json');
  const existingNovedades = Array.isArray(existingVersionJson.novedades)
    ? deduplicateNovedades(existingVersionJson.novedades)
    : [];

  const versionJsonCuratedInRelease =
    touchedVersionJson &&
    existingNovedades.length > 0 &&
    JSON.stringify(existingNovedades) !== JSON.stringify(deduplicateNovedades(sourceInfo.lastReleaseNovedades || []));

  let novedades = [];

  if (versionJsonCuratedInRelease) {
    novedades = existingNovedades;
  } else if (touchedNovedadesMd && fs.existsSync(novedadesMdPath)) {
    novedades = deduplicateNovedades(parseMarkdownBullets(fs.readFileSync(novedadesMdPath, 'utf8')));
  } else if (sourceInfo.messages.length > 0) {
    const parsedFromCommits = sourceInfo.messages.map(commitToNovedad).filter(Boolean);
    novedades = deduplicateNovedades(parsedFromCommits);
  }

  if (novedades.length === 0 && existingNovedades.length > 0) {
    novedades = existingNovedades;
  }

  if (novedades.length === 0) {
    novedades = [
      {
        titulo: 'Actualización de sistema',
        descripcion: 'Mejoras generales de estabilidad, seguridad y rendimiento.',
      },
    ];
  }

  // Escribir public/novedades.json sincronizado
  const resultadoNovedadesJson = {
    fecha: fechaIso,
    releaseDate: fechaEspanol,
    novedades,
    cambios: novedades.map((item) => ({
      titulo: item.titulo,
      texto: item.descripcion,
      descripcion: item.descripcion,
    })),
  };

  fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
  fs.writeFileSync(outputJsonPath, JSON.stringify(resultadoNovedadesJson, null, 2) + '\n', 'utf8');
  console.log(`Generado ${outputJsonPath} con ${novedades.length} novedad(es) (${fechaIso} / ${fechaEspanol}).`);

  // Sincronizar public/version.json con el formato unificado
  if (fs.existsSync(versionJsonPath)) {
    try {
      const updatedVersionJson = {
        ...existingVersionJson,
        fecha: fechaIso,
        novedades,
        releaseDate: fechaEspanol,
        changelog: novedades.map((n) => (n.titulo ? `${n.titulo}: ${n.descripcion}` : n.descripcion)),
      };
      fs.writeFileSync(versionJsonPath, JSON.stringify(updatedVersionJson, null, 2) + '\n', 'utf8');
      console.log(`Sincronizado ${versionJsonPath} con ${novedades.length} novedad(es) dinámicas.`);
    } catch (e) {
      console.warn('No se pudo actualizar version.json:', e);
    }
  }
}

generarNovedades().catch((err) => {
  console.error('Error generando novedades:', err);
  process.exit(1);
});

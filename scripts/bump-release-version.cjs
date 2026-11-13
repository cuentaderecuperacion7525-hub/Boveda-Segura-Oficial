const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const versionJsonPath = path.join(rootDir, 'public', 'version.json');
const versionTsPath = path.join(rootDir, 'src', 'version.ts');
const buildGradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
const novedadesJsonPath = path.join(rootDir, 'public', 'novedades.json');

function parsePatch(ver) {
  const clean = String(ver || '').trim().replace(/^v/, '');
  const parts = clean.split('.').map((n) => parseInt(n, 10));
  if (parts.length >= 3 && !Number.isNaN(parts[2])) {
    return { major: parts[0] || 1, minor: parts[1] || 0, patch: parts[2] };
  }
  return { major: 1, minor: 0, patch: 16 };
}

async function fetchLatestGithubTag(repo, token) {
  if (!repo) return null;
  try {
    const headers = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'boveda-release-builder',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && data.tag_name) return String(data.tag_name);
    }

    const tagsRes = await fetch(`https://api.github.com/repos/${repo}/tags?per_page=10`, { headers });
    if (tagsRes.ok) {
      const tags = await tagsRes.json();
      if (Array.isArray(tags) && tags.length > 0) {
        return String(tags[0].name || '');
      }
    }
  } catch (err) {
    console.warn('No se pudo consultar último tag en GitHub:', err.message);
  }
  return null;
}

async function run() {
  const repo = process.env.GITHUB_REPOSITORY || 'cuentaderecuperacion7525-hub/Boveda-Segura-Oficial';
  const token = process.env.GITHUB_TOKEN || '';
  const dryRun = process.argv.includes('--dry-run');

  const vJson = fs.existsSync(versionJsonPath)
    ? JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'))
    : { version: '1.0.16', buildNumber: 2016 };

  const localParsed = parsePatch(vJson.version || vJson.version_name || '1.0.16');
  const localBuild = Number(vJson.version_code || vJson.buildNumber || 2000 + localParsed.patch);

  const remoteTag = await fetchLatestGithubTag(repo, token);
  const remoteParsed = remoteTag ? parsePatch(remoteTag) : { major: 1, minor: 0, patch: 0 };

  // Garantiza que la nueva compilación supere tanto la versión local como la última publicada en GitHub
  const basePatch = Math.max(localParsed.patch, remoteParsed.patch);
  const nextPatch = basePatch + 1;
  const nextVersion = `${localParsed.major}.${localParsed.minor}.${nextPatch}`;
  const nextBuild = Math.max(localBuild + 1, 2000 + nextPatch);
  const nextTag = `v${nextVersion}`;

  let releaseDate = vJson.releaseDate || '12 de noviembre de 2026';
  let changelog = Array.isArray(vJson.changelog) ? vJson.changelog : [];
  if (fs.existsSync(novedadesJsonPath)) {
    try {
      const nov = JSON.parse(fs.readFileSync(novedadesJsonPath, 'utf8'));
      if (nov.fecha) releaseDate = nov.fecha;
      if (Array.isArray(nov.cambios) && nov.cambios.length > 0) {
        changelog = nov.cambios.map((c) => {
          const line = c.titulo ? `${c.titulo}: ${c.texto}` : c.texto;
          return String(line || '').replace(/v[0-9]+\.[0-9]+\.[0-9]+/gi, nextTag);
        });
      }
    } catch {}
  }

  console.log(`Versión actual local: ${vJson.version} (build ${localBuild}) | Último tag GitHub: ${remoteTag || 'ninguno'}`);
  console.log(`Nueva versión calculada: ${nextVersion} (build ${nextBuild}, tag ${nextTag})`);

  if (!dryRun) {
    // 1. Actualizar public/version.json
    const updatedJson = {
      ...vJson,
      version: nextVersion,
      version_name: nextVersion,
      buildNumber: nextBuild,
      version_code: nextBuild,
      download_url: `https://github.com/${repo}/releases/latest/download/Boveda-Calculadora.apk`,
      releaseDate,
      changelog,
      mandatory: false,
    };
    fs.writeFileSync(versionJsonPath, JSON.stringify(updatedJson, null, 2) + '\n', 'utf8');

    // 2. Actualizar android/app/build.gradle
    if (fs.existsSync(buildGradlePath)) {
      let gradle = fs.readFileSync(buildGradlePath, 'utf8');
      gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${nextBuild}`);
      gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${nextVersion}"`);
      fs.writeFileSync(buildGradlePath, gradle, 'utf8');
    }

    // 3. Actualizar src/version.ts
    if (fs.existsSync(versionTsPath)) {
      let verTs = fs.readFileSync(versionTsPath, 'utf8');
      verTs = verTs.replace(/export const APP_VERSION = '[^']+';/, `export const APP_VERSION = '${nextVersion}';`);
      verTs = verTs.replace(/export const CURRENT_BUILD_NUMBER = \d+;/, `export const CURRENT_BUILD_NUMBER = ${nextBuild};`);
      verTs = verTs.replace(/export const CURRENT_RELEASE_DATE = '[^']+';/, `export const CURRENT_RELEASE_DATE = '${releaseDate.replace(/'/g, "\\'")}';`);
      fs.writeFileSync(versionTsPath, verTs, 'utf8');
    }
  }

  // Exportar outputs para GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `version=${nextVersion}\nbuild_number=${nextBuild}\ntag=${nextTag}\n`
    );
  }
}

run().catch((err) => {
  console.error('Error incrementando versión:', err);
  process.exit(1);
});

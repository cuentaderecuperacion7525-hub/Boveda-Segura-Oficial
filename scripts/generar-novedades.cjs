const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const novedadesMdPath = path.join(rootDir, 'NOVEDADES.md');
const outputJsonPath = path.join(rootDir, 'public', 'novedades.json');

function obtenerFechaMonterrey() {
  const ahora = new Date();
  const partes = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Monterrey',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(ahora);

  const dia = partes.find((p) => p.type === 'day')?.value || '';
  const mes = (partes.find((p) => p.type === 'month')?.value || '').toLowerCase();
  const anio = partes.find((p) => p.type === 'year')?.value || '';

  return `${dia} de ${mes} de ${anio}`;
}

function generarNovedades() {
  let cambios = [];

  if (fs.existsSync(novedadesMdPath)) {
    const contenido = fs.readFileSync(novedadesMdPath, 'utf8');
    const lineas = contenido.split(/\r?\n/);

    for (const lineaRaw of lineas) {
      const linea = lineaRaw.trim();
      if (!linea.startsWith('-')) continue;

      const sinGuion = linea.replace(/^-\s*/, '').trim();
      if (!sinGuion) continue;

      const idxDosPuntos = sinGuion.indexOf(':');
      if (idxDosPuntos !== -1) {
        const titulo = sinGuion.slice(0, idxDosPuntos).trim();
        const texto = sinGuion.slice(idxDosPuntos + 1).trim();
        if (titulo || texto) {
          cambios.push({ titulo, texto });
        }
      } else {
        cambios.push({ titulo: '', texto: sinGuion });
      }
    }
  }

  const resultado = {
    fecha: obtenerFechaMonterrey(),
    cambios,
  };

  fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
  fs.writeFileSync(outputJsonPath, JSON.stringify(resultado, null, 2) + '\n', 'utf8');
  console.log(`Generado ${outputJsonPath} con ${cambios.length} novedad(es) (${resultado.fecha}).`);

  // También sincronizar public/version.json para que cualquier comprobador de versión tenga las mismas novedades
  const versionJsonPath = path.join(rootDir, 'public', 'version.json');
  if (fs.existsSync(versionJsonPath)) {
    try {
      const vJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
      vJson.releaseDate = resultado.fecha;
      vJson.changelog = cambios.length > 0
        ? cambios.map((c) => (c.titulo ? `${c.titulo}: ${c.texto}` : c.texto))
        : ['Mejoras de estabilidad y rendimiento'];
      fs.writeFileSync(versionJsonPath, JSON.stringify(vJson, null, 2) + '\n', 'utf8');
      console.log(`Sincronizado ${versionJsonPath} con las novedades actuales.`);
    } catch (e) {
      console.warn('No se pudo actualizar version.json:', e);
    }
  }
}

generarNovedades();

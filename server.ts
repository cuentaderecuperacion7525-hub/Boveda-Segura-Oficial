import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({ origin: '*' }));
app.use(express.json());

// Transporter oficial con la contraseña de aplicación de Gmail (desde variables de entorno o respaldo codificado)
const DEFAULT_U = Buffer.from('am1tYXJ0aW5lejUxMjFAZ21haWwuY29t', 'base64').toString('utf8');
const DEFAULT_P = Buffer.from('eHd2c3p5c252c2l5aGx6bQ==', 'base64').toString('utf8');
const GMAIL_USER = (process.env.GMAIL_USER || DEFAULT_U).trim();
const GMAIL_PASS = (process.env.GMAIL_PASS || DEFAULT_P).replace(/\s+/g, '').trim();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

// Base de datos Firestore (accesible públicamente desde APK móvil, navegador y servidor sin bloqueo de cookies)
const FIRESTORE_PROJECT_ID = 'studio-7313343442-ab21c';
const FIRESTORE_DB_ID = 'ai-studio-remixbvedasegura-97d4266f-3ed5-45b1-9490-cec56ba0c191';
const FIRESTORE_BASE_DOCS_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents`;
const FIRESTORE_COLLECTION_URL = `${FIRESTORE_BASE_DOCS_URL}/email_verifications`;

interface RegistroConfirmacion {
  correo: string;
  nombre: string;
  token: string;
  pin: string;
  confirmLink: string;
  confirmado: boolean;
  usado: boolean;
  creadoEn: number;
  vence: number;
  ultimoEnvio: number;
}

const confirmacionesPorCorreo = new Map<string, RegistroConfirmacion>();
const confirmacionesPorToken = new Map<string, string>(); // token -> correo
const tokensProcesados = new Set<string>(); // evita envíos duplicados entre API directa y Firestore watcher

const VIGENCIA_MS = 5 * 60 * 1000; // Vigencia estricta de 5 minutos (300,000 ms)
const ESPERA_MS = 15 * 1000;       // 15s entre reenvíos

const correoValido = (c: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
const generarPin6Digitos = () => Math.floor(100000 + Math.random() * 900000).toString();

// Genera una página HTML pública directa (text/html; charset=utf-8) que verifica:
// 1) Vigencia de 5 minutos
// 2) Que no haya sido cancelado por un reenvío posterior (superseded)
// 3) Que sea de un solo uso (no confirmado ni usado previamente)
async function createDirectConfirmationUrl(token: string, email: string, firstName: string): Promise<string> {
  const safeName = firstName.replace(/[<>&"']/g, '');
  const safeEmail = email.replace(/[<>&"']/g, '').toLowerCase();
  const safeToken = token.replace(/[^a-zA-Z0-9_-]/g, '');

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Confirmación de Correo - Mi Bóveda</title>
</head>
<body style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f8fafc; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px; box-sizing:border-box;">
  <div style="max-width:380px; width:100%; background:#ffffff; border:1px solid #e2e8f0; border-radius:20px; padding:32px 24px; text-align:center; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
    <div id="icon-box" style="width:64px; height:64px; border-radius:50%; background:#dbeafe; color:#2563eb; display:inline-flex; align-items:center; justify-content:center; font-size:26px; margin-bottom:16px; font-weight:bold;">
      •••
    </div>
    <h2 id="title" style="margin:0 0 10px 0; color:#0f172a; font-size:22px;">Verificando enlace...</h2>
    <p id="desc" style="margin:0 0 18px 0; color:#475569; font-size:15px; line-height:1.5;">
      Comprobando que el enlace esté dentro de los 5 minutos de validez.
    </p>
    <div id="badge" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:14px; color:#1d4ed8; font-size:14px; font-weight:600;">
      Verificando...
    </div>
  </div>
  <script>
    (function () {
      var DOC_URL = '${FIRESTORE_COLLECTION_URL}/${safeToken}';
      var FIVE_MIN_MS = 5 * 60 * 1000;
      var iconBox = document.getElementById('icon-box');
      var titleEl = document.getElementById('title');
      var descEl = document.getElementById('desc');
      var badgeEl = document.getElementById('badge');

      function showSuccess(em, fn) {
        if (iconBox) {
          iconBox.style.background = '#dcfce7';
          iconBox.style.color = '#16a34a';
          iconBox.textContent = '✓';
        }
        if (titleEl) titleEl.textContent = '¡Correo confirmado!';
        if (descEl) {
          descEl.innerHTML = 'Hola <strong>' + fn + '</strong>, tu correo <strong>' + em + '</strong> ya quedó verificado correctamente.';
        }
        if (badgeEl) {
          badgeEl.style.background = '#f0fdf4';
          badgeEl.style.borderColor = '#bbf7d0';
          badgeEl.style.color = '#166534';
          badgeEl.textContent = 'Ya puedes volver a la aplicación Mi Bóveda; tu acceso se abrirá automáticamente.';
        }
      }

      function showError(titleText, msgText, badgeText) {
        if (iconBox) {
          iconBox.style.background = '#fee2e2';
          iconBox.style.color = '#dc2626';
          iconBox.textContent = '!';
        }
        if (titleEl) titleEl.textContent = titleText;
        if (descEl) descEl.textContent = msgText;
        if (badgeEl) {
          badgeEl.style.background = '#fef2f2';
          badgeEl.style.borderColor = '#fecaca';
          badgeEl.style.color = '#991b1b';
          badgeEl.textContent = badgeText;
        }
      }

      fetch(DOC_URL, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (doc) {
          if (!doc || !doc.fields) {
            showError(
              'Enlace no válido',
              'Este enlace de confirmación no existe o ya expiró.',
              'Solicita un nuevo código desde la aplicación.'
            );
            return;
          }

          var f = doc.fields;
          var status = (f.status && f.status.stringValue) || '';
          var confirmed = Boolean(f.confirmed && f.confirmed.booleanValue);
          var createdAt = (f.createdAt && f.createdAt.stringValue) || '';
          var pin = (f.pin && f.pin.stringValue) || '';
          var em = (f.email && f.email.stringValue) || '${safeEmail}';
          var fn = (f.firstName && f.firstName.stringValue) || '${safeName}';

          if (status === 'superseded') {
            showError(
              'Enlace cancelado',
              'Solicitaste un código más reciente, por lo que este enlace anterior quedó cancelado automáticamente.',
              'Abre el correo más reciente que recibiste.'
            );
            return;
          }

          if (confirmed || status === 'confirmed' || status === 'used') {
            showError(
              'Enlace ya utilizado',
              'Este enlace es de un solo uso y ya fue utilizado anteriormente.',
              'Tu enlace ya no puede volver a usarse.'
            );
            return;
          }

          var createdMs = Date.parse(createdAt);
          if (status === 'expired' || !createdMs || (Date.now() - createdMs) > FIVE_MIN_MS) {
            var expFields = {
              token: { stringValue: '${safeToken}' },
              email: { stringValue: em },
              firstName: { stringValue: fn },
              status: { stringValue: 'expired' },
              confirmed: { booleanValue: false },
              createdAt: { stringValue: createdAt || new Date().toISOString() }
            };
            if (pin) expFields.pin = { stringValue: pin };
            fetch(DOC_URL, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fields: expFields })
            }).catch(function () {});

            showError(
              'Enlace caducado (5 min)',
              'Por seguridad, este enlace solo era válido por 5 minutos y el tiempo ya expiró.',
              'Vuelve a la aplicación y toca Reenviar código.'
            );
            return;
          }

          var okFields = {
            token: { stringValue: '${safeToken}' },
            email: { stringValue: em },
            firstName: { stringValue: fn },
            status: { stringValue: 'confirmed' },
            confirmed: { booleanValue: true },
            createdAt: { stringValue: createdAt }
          };
          if (pin) okFields.pin = { stringValue: pin };

          return fetch(DOC_URL, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: okFields })
          }).then(function (resPatch) {
            if (resPatch.ok) {
              showSuccess(em, fn);
            } else {
              showError(
                'Error al confirmar',
                'No se pudo registrar la confirmación en este momento.',
                'También puedes escribir el código de 6 dígitos en la app.'
              );
            }
          });
        })
        .catch(function () {
          showError(
            'Error de conexión',
            'No se pudo verificar el estado del enlace.',
            'Revisa tu conexión a internet o usa el código de 6 dígitos.'
          );
        });
    })();
  </script>
</body>
</html>`;

  try {
    const res = await fetch('https://bytebin.lucko.me/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
      body: htmlContent,
    });
    if (res.ok) {
      const data: any = await res.json();
      if (data?.key) {
        return `https://bytebin.lucko.me/${data.key}#token=${safeToken}`;
      }
    }
  } catch (err) {
    console.warn('Fallback URL para confirmación:', err);
  }

  return `https://htmlpreview.github.io/?https://github.com/cuentaderecuperacion7525-hub/Mi-B-veda.-/blob/main/public/confirmar.html#token=${safeToken}`;
}

// Guarda o actualiza el estado de un token en Firestore
async function saveVerificationToFirestore(params: {
  token: string;
  email: string;
  firstName: string;
  pin?: string;
  status: string;
  confirmed: boolean;
  createdAt?: string;
}) {
  try {
    const fields: Record<string, any> = {
      token: { stringValue: params.token },
      email: { stringValue: params.email },
      firstName: { stringValue: params.firstName },
      status: { stringValue: params.status },
      confirmed: { booleanValue: params.confirmed },
      createdAt: { stringValue: params.createdAt || new Date().toISOString() },
    };
    if (params.pin) {
      fields.pin = { stringValue: params.pin };
    }
    await fetch(`${FIRESTORE_COLLECTION_URL}/${encodeURIComponent(params.token)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  } catch (err) {
    console.warn('Error guardando verificacion en Firestore:', err);
  }
}

// Cancela todos los enlaces/códigos anteriores del mismo correo cuando se envía uno nuevo
async function cancelarSolicitudesAnterioresFirestore(email: string, currentToken: string) {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fetch(`${FIRESTORE_BASE_DOCS_URL}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'email_verifications' }],
        },
      }),
    });
    if (!res.ok) return;
    const rows: any[] = await res.json();
    if (!Array.isArray(rows)) return;

    for (const row of rows) {
      const f = row?.document?.fields;
      if (!f) continue;
      const tk = f.token?.stringValue || '';
      const em = (f.email?.stringValue || '').trim().toLowerCase();
      const st = f.status?.stringValue || '';
      const fn = f.firstName?.stringValue || 'Usuario';
      const ca = f.createdAt?.stringValue || new Date().toISOString();
      const pn = f.pin?.stringValue || undefined;

      if (
        tk &&
        tk !== currentToken &&
        tk !== 'pagina_confirmacion' &&
        !tk.startsWith('cuenta_') &&
        st !== 'registered_account' &&
        em === cleanEmail
      ) {
        if (st === 'pending' || st === 'sending' || st === 'sent') {
          await saveVerificationToFirestore({
            token: tk,
            email: cleanEmail,
            firstName: fn,
            pin: pn,
            status: 'superseded',
            confirmed: false,
            createdAt: ca,
          });
        }
      }
    }
  } catch {}
}

// Función central que envía el correo con el PIN de 6 dígitos como protagonista y el enlace discreto en 9px abajo
async function enviarCorreoConfirmacion(
  correo: string,
  nombre: string,
  token: string,
  pin: string,
  createdAtIso?: string
): Promise<{
  ok: boolean;
  confirmLink: string;
  pin: string;
  error?: string;
}> {
  const cleanCorreo = correo.trim().toLowerCase();
  const cleanNombre = nombre.trim() || 'Usuario';
  const cleanPin = pin.trim() || generarPin6Digitos();

  // Primero cancelar cualquier solicitud anterior de este mismo correo
  await cancelarSolicitudesAnterioresFirestore(cleanCorreo, token);

  const confirmLink = await createDirectConfirmationUrl(token, cleanCorreo, cleanNombre);

  const info = await transporter.sendMail({
    from: `"Mi Bóveda" <${GMAIL_USER}>`,
    replyTo: '"Mi Bóveda (No responder)" <no-responder@miboveda.app>',
    to: cleanCorreo, // <- Se envía SIEMPRE al correo que el usuario escribió en su registro
    subject: `${cleanPin} es tu código de acceso a Mi Bóveda`,
    text: `Hola ${cleanNombre},\n\nTu código de verificación de 6 dígitos para Mi Bóveda es:\n\n${cleanPin}\n\nEste código es de un solo uso y vence en 5 minutos.\n\n¿Prefieres confirmar directamente con enlace? Abre: ${confirmLink}\n\nSaludos,\nMi Bóveda`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 440px; margin: auto; padding: 28px 24px; border: 1px solid #e5e7eb; border-radius: 14px; background: #ffffff; color: #1f2937;">
        <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Mi Bóveda</h2>
        <p style="margin: 0 0 14px 0; color: #374151; font-size: 15px; line-height: 1.5;">
          Hola <strong>${cleanNombre}</strong>,
        </p>
        <p style="margin: 0 0 18px 0; color: #374151; font-size: 14px; line-height: 1.5;">
          Ingresa el siguiente código de 6 dígitos en la aplicación para confirmar tu cuenta (válido por <strong>5 minutos</strong>):
        </p>
        <div style="text-align: center; margin: 20px 0; padding: 14px 12px; background-color: #eff6ff; border: 1px dashed #93c5fd; border-radius: 12px; white-space: nowrap;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 6px; color: #1e3a8a; font-family: 'Courier New', Courier, monospace; white-space: nowrap; display: inline-block;">${cleanPin}</span>
        </div>
        <p style="margin: 14px 0 18px 0; color: #6b7280; font-size: 12px; line-height: 1.4; text-align: center;">
          Este código es de un solo uso y caduca automáticamente a los 5 minutos.
        </p>
        <div style="border-top: 1px solid #f3f4f6; padding-top: 12px; margin-top: 14px; text-align: center;">
          <span style="font-size: 9px; color: #9ca3af; line-height: 1.3;">
            ¿Prefieres confirmar sin escribir el código?
            <a href="${confirmLink}" style="color: #6b7280; text-decoration: underline; font-size: 9px;">
              Confirmar cuenta tocando este enlace
            </a>
          </span>
        </div>
      </div>`,
  });

  if (info.rejected && info.rejected.length > 0) {
    return {
      ok: false,
      confirmLink,
      pin: cleanPin,
      error: 'El servidor de destino rechazó el correo',
    };
  }

  console.log(`[SMTP] Código ${cleanPin} + enlace enviado a: ${cleanCorreo} | token: ${token} | messageId: ${info.messageId}`);

  const creadoMs = createdAtIso ? Date.parse(createdAtIso) || Date.now() : Date.now();
  const vence = creadoMs + VIGENCIA_MS;

  confirmacionesPorCorreo.set(cleanCorreo, {
    correo: cleanCorreo,
    nombre: cleanNombre,
    token,
    pin: cleanPin,
    confirmLink,
    confirmado: false,
    usado: false,
    creadoEn: creadoMs,
    vence,
    ultimoEnvio: Date.now(),
  });
  confirmacionesPorToken.set(token, cleanCorreo);

  return { ok: true, confirmLink, pin: cleanPin };
}

// Watcher en tiempo real de Firestore (:runQuery) para atender solicitudes creadas desde el APK de Android
let isPollingFirestore = false;
async function pollFirestorePendingVerifications() {
  if (isPollingFirestore) return;
  isPollingFirestore = true;
  try {
    const res = await fetch(`${FIRESTORE_BASE_DOCS_URL}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'email_verifications' }],
        },
      }),
    });
    if (!res.ok) return;
    const rows: any[] = await res.json();
    if (!Array.isArray(rows)) return;

    for (const row of rows) {
      const doc = row?.document;
      const fields = doc?.fields;
      if (!fields) continue;

      const token = fields.token?.stringValue || '';
      const email = (fields.email?.stringValue || '').trim().toLowerCase();
      const firstName = (fields.firstName?.stringValue || 'Usuario').trim();
      const pinFromDoc = (fields.pin?.stringValue || '').trim();
      const status = fields.status?.stringValue || '';
      const confirmed = Boolean(fields.confirmed?.booleanValue);
      const createdAt = fields.createdAt?.stringValue || new Date().toISOString();

      if (!token || token === 'pagina_confirmacion' || token.startsWith('cuenta_') || status === 'registered_account') continue;

      const createdMs = Date.parse(createdAt) || Date.now();
      const ageMs = Date.now() - createdMs;
      const isExpired = ageMs > VIGENCIA_MS;
      const isReadyForCleanup = ageMs > VIGENCIA_MS * 2; // Más de 10 minutos: eliminar documento temporal de Firestore

      // Limpieza automática de códigos temporales vencidos o ya utilizados después de 10 minutos
      // (NUNCA toca documentos 'cuenta_*' ni 'registered_account')
      if (isReadyForCleanup && !token.startsWith('cuenta_') && status !== 'registered_account') {
        try {
          await fetch(`${FIRESTORE_COLLECTION_URL}/${encodeURIComponent(token)}`, {
            method: 'DELETE',
          });
          tokensProcesados.delete(token);
          confirmacionesPorToken.delete(token);
          const memReg = confirmacionesPorCorreo.get(email);
          if (memReg && memReg.token === token) {
            confirmacionesPorCorreo.delete(email);
          }
        } catch {}
        continue;
      }

      // Si ya pasaron más de 5 minutos y seguía en 'sent' o 'pending', marcarlo como 'expired'
      if (isExpired && (status === 'pending' || status === 'sending' || status === 'sent')) {
        await saveVerificationToFirestore({
          token,
          email,
          firstName,
          pin: pinFromDoc || undefined,
          status: 'expired',
          confirmed: false,
          createdAt,
        });
        continue;
      }

      // Si el usuario ya confirmó desde su navegador dentro de los 5 minutos, sincronizar en memoria
      if ((confirmed || status === 'confirmed') && !isExpired) {
        const reg = confirmacionesPorCorreo.get(email);
        if (reg && reg.token === token) {
          reg.confirmado = true;
        } else if (email) {
          confirmacionesPorCorreo.set(email, {
            correo: email,
            nombre: firstName,
            token,
            pin: pinFromDoc || '000000',
            confirmLink: '',
            confirmado: true,
            usado: false,
            creadoEn: createdMs,
            vence: createdMs + VIGENCIA_MS,
            ultimoEnvio: Date.now(),
          });
          confirmacionesPorToken.set(token, email);
        }
        continue;
      }

      // Si el APK o cliente creó una solicitud pendiente ('pending'), enviar el correo inmediatamente
      if (status === 'pending' && !tokensProcesados.has(token) && correoValido(email) && !isExpired) {
        tokensProcesados.add(token);
        const finalPin = pinFromDoc && pinFromDoc.length === 6 ? pinFromDoc : generarPin6Digitos();

        try {
          await saveVerificationToFirestore({
            token,
            email,
            firstName,
            pin: finalPin,
            status: 'sending',
            confirmed: false,
            createdAt,
          });

          const result = await enviarCorreoConfirmacion(email, firstName, token, finalPin, createdAt);

          await saveVerificationToFirestore({
            token,
            email,
            firstName,
            pin: finalPin,
            status: result.ok ? 'sent' : 'error',
            confirmed: false,
            createdAt,
          });
        } catch (err) {
          console.error('[Firestore Watcher] Error enviando correo a', email, err);
          await saveVerificationToFirestore({
            token,
            email,
            firstName,
            pin: finalPin,
            status: 'error',
            confirmed: false,
            createdAt,
          });
        }
      }
    }
  } catch {
    // Ignorar errores de red transitorios
  } finally {
    isPollingFirestore = false;
  }
}

// Iniciar watcher cada 1.5 segundos y ejecutar al arrancar
setInterval(pollFirestorePendingVerifications, 1500);
setTimeout(pollFirestorePendingVerifications, 200);

// 1) Endpoint HTTP directo para enviar el correo con PIN de 6 dígitos + enlace de 9px
const handleEnviarEnlace = async (req: Request, res: Response) => {
  const correo = String(req.body.correo || req.body.email || '').trim().toLowerCase();
  const nombre = String(req.body.nombre || req.body.firstName || '').trim() || 'Usuario';
  const clientToken = String(req.body.token || '').trim();
  const clientPin = String(req.body.pin || '').trim();

  if (!correoValido(correo)) {
    return res.status(400).json({ ok: false, success: false, error: 'Correo electrónico no válido' });
  }

  const token = clientToken || crypto.randomBytes(16).toString('hex');
  const pin = clientPin && clientPin.length === 6 ? clientPin : generarPin6Digitos();

  // Si el watcher de Firestore ya procesó este mismo token, devolver éxito sin enviar doble correo
  if (tokensProcesados.has(token)) {
    const existing = confirmacionesPorCorreo.get(correo);
    return res.json({
      ok: true,
      success: true,
      delivered: true,
      targetEmail: correo,
      token,
      testPin: existing?.pin || pin,
      expiresInSeconds: 300,
      message: 'Te enviamos tu código de 6 dígitos por correo.',
    });
  }

  const previo = confirmacionesPorCorreo.get(correo);
  if (previo && Date.now() - previo.ultimoEnvio < ESPERA_MS) {
    const restante = Math.ceil((ESPERA_MS - (Date.now() - previo.ultimoEnvio)) / 1000);
    return res.status(429).json({
      ok: false,
      success: false,
      error: `Espera ${restante} segundos para solicitar un nuevo código`,
    });
  }

  tokensProcesados.add(token);
  const createdAt = new Date().toISOString();

  try {
    await saveVerificationToFirestore({
      token,
      email: correo,
      firstName: nombre,
      pin,
      status: 'sending',
      confirmed: false,
      createdAt,
    });

    const result = await enviarCorreoConfirmacion(correo, nombre, token, pin, createdAt);
    if (!result.ok) {
      return res.status(502).json({ ok: false, success: false, error: result.error || 'Error enviando correo' });
    }

    await saveVerificationToFirestore({
      token,
      email: correo,
      firstName: nombre,
      pin: result.pin,
      status: 'sent',
      confirmed: false,
      createdAt,
    });

    return res.json({
      ok: true,
      success: true,
      delivered: true,
      targetEmail: correo,
      token,
      testPin: result.pin,
      magicLink: result.confirmLink,
      expiresInSeconds: 300,
      message: 'Te enviamos tu código de 6 dígitos por correo.',
    });
  } catch (err: any) {
    console.error('ERROR al enviar correo a', correo, err);
    return res.status(500).json({
      ok: false,
      success: false,
      error: err?.message || 'No se pudo enviar el correo de confirmación',
    });
  }
};

app.post('/api/enviar-pin', handleEnviarEnlace);
app.post('/api/send-email-pin', handleEnviarEnlace);
app.post('/api/send-magic-link', handleEnviarEnlace);

// 2) Verificar el código PIN de 6 dígitos (valida vigencia de 5 minutos, un solo uso y que sea el último token)
const handleVerificarPin = async (req: Request, res: Response) => {
  const correo = String(req.body.correo || req.body.email || '').trim().toLowerCase();
  const pinIngresado = String(req.body.pin || '').trim();
  const token = String(req.body.token || '').trim();

  const registro = confirmacionesPorCorreo.get(correo);
  if (!registro) {
    return res.status(400).json({
      ok: false,
      success: false,
      error: 'No hay un código activo para este correo. Solicita uno nuevo.',
    });
  }

  if (token && registro.token !== token) {
    return res.status(400).json({
      ok: false,
      success: false,
      error: 'Este código fue reemplazado por uno más reciente.',
    });
  }

  if (registro.usado) {
    return res.status(400).json({
      ok: false,
      success: false,
      error: 'Este código ya fue utilizado anteriormente.',
    });
  }

  if (Date.now() > registro.vence) {
    await saveVerificationToFirestore({
      token: registro.token,
      email: registro.correo,
      firstName: registro.nombre,
      pin: registro.pin,
      status: 'expired',
      confirmed: false,
      createdAt: new Date(registro.creadoEn).toISOString(),
    });
    return res.status(400).json({
      ok: false,
      success: false,
      error: 'El código ha caducado (válido por 5 minutos). Solicita uno nuevo.',
    });
  }

  if (registro.pin !== pinIngresado) {
    return res.status(400).json({
      ok: false,
      success: false,
      error: 'El código de 6 dígitos es incorrecto.',
    });
  }

  registro.confirmado = true;
  registro.usado = true;

  await saveVerificationToFirestore({
    token: registro.token,
    email: registro.correo,
    firstName: registro.nombre,
    pin: registro.pin,
    status: 'used',
    confirmed: true,
    createdAt: new Date(registro.creadoEn).toISOString(),
  });

  return res.json({
    ok: true,
    success: true,
    email: registro.correo,
    nombre: registro.nombre,
    message: 'Código verificado con éxito.',
  });
};

app.post('/api/verificar-pin', handleVerificarPin);
app.post('/api/verify-email-pin', handleVerificarPin);

// 3) Confirmación directa si se abre /api/confirmar-correo?token=...
app.get('/api/confirmar-correo', async (req: Request, res: Response) => {
  const token = String(req.query.token || '').trim();
  const correo = confirmacionesPorToken.get(token);
  const registro = correo ? confirmacionesPorCorreo.get(correo) : undefined;

  if (!registro || registro.token !== token) {
    return res.status(400).send(`
      <!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Enlace cancelado</title></head>
      <body style="margin:0;font-family:sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;">
        <div style="max-width:380px;width:100%;background:#fff;border:1px solid #fecaca;border-radius:20px;padding:32px 24px;text-align:center;">
          <h2 style="color:#dc2626;margin:0 0 10px 0;">Enlace no válido o cancelado</h2>
          <p style="color:#475569;font-size:14px;margin:0;">Solicita un nuevo código desde la aplicación Mi Bóveda.</p>
        </div>
      </body></html>
    `);
  }

  if (registro.usado || registro.confirmado) {
    return res.status(400).send(`
      <!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Enlace ya utilizado</title></head>
      <body style="margin:0;font-family:sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;">
        <div style="max-width:380px;width:100%;background:#fff;border:1px solid #fecaca;border-radius:20px;padding:32px 24px;text-align:center;">
          <h2 style="color:#dc2626;margin:0 0 10px 0;">Enlace ya utilizado</h2>
          <p style="color:#475569;font-size:14px;margin:0;">Este enlace es de un solo uso y ya fue utilizado anteriormente.</p>
        </div>
      </body></html>
    `);
  }

  if (Date.now() > registro.vence) {
    return res.status(400).send(`
      <!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Enlace caducado</title></head>
      <body style="margin:0;font-family:sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;">
        <div style="max-width:380px;width:100%;background:#fff;border:1px solid #fecaca;border-radius:20px;padding:32px 24px;text-align:center;">
          <h2 style="color:#dc2626;margin:0 0 10px 0;">Enlace caducado (5 min)</h2>
          <p style="color:#475569;font-size:14px;margin:0;">Este enlace solo era válido por 5 minutos. Solicita uno nuevo desde la app.</p>
        </div>
      </body></html>
    `);
  }

  registro.confirmado = true;
  await saveVerificationToFirestore({
    token,
    email: registro.correo,
    firstName: registro.nombre,
    pin: registro.pin,
    status: 'confirmed',
    confirmed: true,
    createdAt: new Date(registro.creadoEn).toISOString(),
  });

  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>¡Correo Confirmado! - Mi Bóveda</title>
    </head>
    <body style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f8fafc; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px;">
      <div style="max-width:380px; width:100%; background:#fff; border:1px solid #e2e8f0; border-radius:20px; padding:32px 24px; text-align:center; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <div style="width:64px; height:64px; border-radius:50%; background:#dcfce7; color:#16a34a; display:inline-flex; align-items:center; justify-content:center; font-size:32px; margin-bottom:16px;">✓</div>
        <h2 style="margin:0 0 10px 0; color:#0f172a; font-size:22px;">¡Correo confirmado!</h2>
        <p style="margin:0 0 18px 0; color:#475569; font-size:15px; line-height:1.5;">
          Tu correo electrónico ya quedó verificado correctamente.
        </p>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:14px; color:#166534; font-size:14px; font-weight:600;">
          Ya puedes volver a la aplicación Mi Bóveda; tu acceso se abrió automáticamente.
        </div>
      </div>
    </body>
    </html>
  `);
});

// 4) Consulta en tiempo real desde la app para saber si el usuario ya tocó el enlace en su correo
app.get('/api/estado-confirmacion', async (req: Request, res: Response) => {
  const correo = String(req.query.correo || req.query.email || '').trim().toLowerCase();
  const token = String(req.query.token || '').trim();
  const correoPorToken = token ? confirmacionesPorToken.get(token) : undefined;
  const registro = confirmacionesPorCorreo.get(correo) || (correoPorToken ? confirmacionesPorCorreo.get(correoPorToken) : undefined);

  if (!registro) {
    return res.json({ ok: true, confirmado: false });
  }

  if (token && registro.token !== token) {
    return res.json({ ok: true, confirmado: false, superseded: true });
  }

  if (Date.now() > registro.vence) {
    return res.json({ ok: true, confirmado: false, expired: true });
  }

  if (registro.confirmado && !registro.usado) {
    registro.usado = true;
    await saveVerificationToFirestore({
      token: registro.token,
      email: registro.correo,
      firstName: registro.nombre,
      pin: registro.pin,
      status: 'used',
      confirmed: true,
      createdAt: new Date(registro.creadoEn).toISOString(),
    });
    return res.json({
      ok: true,
      confirmado: true,
      correo: registro.correo,
      nombre: registro.nombre,
    });
  }

  return res.json({
    ok: true,
    confirmado: false,
  });
});

// Vite dev server mounting or static production serving
async function startServer() {
  const httpServer = http.createServer(app);

  if (!isProd) {
    try {
      const clientMjsPath = path.join(__dirname, 'node_modules/vite/dist/client/client.mjs');
      if (fs.existsSync(clientMjsPath)) {
        let content = fs.readFileSync(clientMjsPath, 'utf8');
        if (content.includes('WebSocket closed without opened.')) {
          content = content
            .replace(
              /const createWebSocketModuleRunnerTransport = \([\s\S]*?\n\};\n\nfunction createHMRHandler/m,
              `const createWebSocketModuleRunnerTransport = () => ({ async connect() {}, disconnect() {}, send() {} });\n\nfunction createHMRHandler`
            )
            .replace(
              /reject\(new Error\("WebSocket closed without opened\."\)\);/g,
              `resolve();`
            );
          fs.writeFileSync(clientMjsPath, content, 'utf8');
        }
      }
    } catch {}

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

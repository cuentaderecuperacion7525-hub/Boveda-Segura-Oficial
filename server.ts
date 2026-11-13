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

// Configuración de envío de correo:
// Opción A: Google Apps Script Web App URL (APPS_SCRIPT_EMAIL_URL o VITE_APPS_SCRIPT_EMAIL_URL)
// Opción B: Respaldo servidor vía Resend (RESEND_API_KEY) o Gmail SMTP (GMAIL_USER + GMAIL_PASS)
const DEFAULT_APPS_SCRIPT_EMAIL_URL =
  'https://script.google.com/macros/s/AKfycbzIrBG_ktcSG9N2UEGDq46DlywnnjJPEcnBCiazyjhNgPEQ0zP96HP7DkvTDHB-AzSWXQ/exec';
const cleanEnv = (v?: string) => (v || '').trim().replace(/^["']|["']$/g, '').trim();

const APPS_SCRIPT_EMAIL_URL = (
  cleanEnv(process.env.APPS_SCRIPT_EMAIL_URL) ||
  cleanEnv(process.env.VITE_APPS_SCRIPT_EMAIL_URL) ||
  DEFAULT_APPS_SCRIPT_EMAIL_URL
).trim();
const RESEND_API_KEY = cleanEnv(process.env.RESEND_API_KEY);
const RESEND_FROM_EMAIL = cleanEnv(process.env.RESEND_FROM_EMAIL) || 'Mi Bóveda <onboarding@resend.dev>';
const RAW_GMAIL_USER = cleanEnv(process.env.GMAIL_USER);
const RAW_GMAIL_PASS = cleanEnv(process.env.GMAIL_PASS).replace(/\s+/g, '').trim();

const isPlaceholder = (val: string) =>
  !val ||
  val.startsWith('MY_') ||
  val.startsWith('YOUR_') ||
  val.startsWith('TU_') ||
  val === 'undefined' ||
  val === 'null';

const GMAIL_USER = !isPlaceholder(RAW_GMAIL_USER) && RAW_GMAIL_USER.includes('@') ? RAW_GMAIL_USER : '';
const GMAIL_PASS = !isPlaceholder(RAW_GMAIL_PASS) && RAW_GMAIL_PASS.length >= 8 ? RAW_GMAIL_PASS : '';
const VALID_RESEND_KEY = !isPlaceholder(RESEND_API_KEY) && RESEND_API_KEY.startsWith('re_') ? RESEND_API_KEY : '';

const transporter =
  GMAIL_USER && GMAIL_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_PASS,
        },
      })
    : null;


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

async function getVerificationFromFirestore(token: string): Promise<{
  token: string;
  email: string;
  firstName: string;
  pin?: string;
  status: string;
  confirmed: boolean;
  createdAt: string;
} | null> {
  try {
    const res = await fetch(`${FIRESTORE_COLLECTION_URL}/${encodeURIComponent(token)}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const doc: any = await res.json();
    const f = doc?.fields;
    if (!f) return null;
    return {
      token: f.token?.stringValue || token,
      email: (f.email?.stringValue || '').trim().toLowerCase(),
      firstName: f.firstName?.stringValue || 'Usuario',
      pin: f.pin?.stringValue || undefined,
      status: f.status?.stringValue || '',
      confirmed: Boolean(f.confirmed?.booleanValue),
      createdAt: f.createdAt?.stringValue || '',
    };
  } catch {
    return null;
  }
}

// Genera una URL de confirmación para enlace de correo:
// - Si usa Apps Script (Opción A), usa ?action=confirm&token=...
// - Si usa SMTP/Resend del servidor (Opción B), usa /api/confirmar-correo?token=... en el origen público del servidor
function buildServerConfirmationUrl(token: string, originBase?: string): string {
  const safeToken = token.replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanOrigin = (
    originBase ||
    process.env.APP_URL ||
    process.env.SHARED_APP_URL ||
    'https://ais-pre-ilwqchhwklwyavc35ewol3-542088184903.us-west2.run.app'
  )
    .trim()
    .replace(/\/$/, '');
  return `${cleanOrigin}/api/confirmar-correo?token=${encodeURIComponent(safeToken)}`;
}

async function createDirectConfirmationUrl(token: string, _email: string, _firstName: string, originBase?: string): Promise<string> {
  const safeToken = token.replace(/[^a-zA-Z0-9_-]/g, '');
  if (APPS_SCRIPT_EMAIL_URL.startsWith('https://script.google.com/macros/s/')) {
    return `${APPS_SCRIPT_EMAIL_URL}?action=confirm&token=${encodeURIComponent(safeToken)}`;
  }
  return buildServerConfirmationUrl(safeToken, originBase);
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

// Cancela únicamente la solicitud anterior conocida (1 sola escritura puntual, 0 escaneos de colección)
async function cancelarSolicitudAnterior(email: string, currentToken: string, previousToken?: string) {
  const cleanEmail = email.trim().toLowerCase();
  const prevMem = confirmacionesPorCorreo.get(cleanEmail);
  const targetPrevToken = previousToken || (prevMem && prevMem.token !== currentToken ? prevMem.token : '');
  if (!targetPrevToken || targetPrevToken === currentToken) return;

  await saveVerificationToFirestore({
    token: targetPrevToken,
    email: cleanEmail,
    firstName: prevMem?.nombre || 'Usuario',
    pin: prevMem?.pin,
    status: 'superseded',
    confirmed: false,
    createdAt: prevMem ? new Date(prevMem.creadoEn).toISOString() : new Date().toISOString(),
  });
}

// Función central que envía el correo con el PIN de 6 dígitos y el enlace de confirmación
// Intenta Opción A (Google Apps Script) y respalda con Opción B (Resend / Gmail SMTP)
async function enviarCorreoConfirmacion(
  correo: string,
  nombre: string,
  token: string,
  pin: string,
  createdAtIso?: string,
  previousToken?: string,
  options?: { skipAppsScript?: boolean; originBase?: string }
): Promise<{
  ok: boolean;
  confirmLink: string;
  pin: string;
  provider?: string;
  error?: string;
}> {
  const cleanCorreo = correo.trim().toLowerCase();
  const cleanNombre = nombre.trim() || 'Usuario';
  const cleanPin = pin.trim() || generarPin6Digitos();
  const createdAtStr = createdAtIso || new Date().toISOString();

  await cancelarSolicitudAnterior(cleanCorreo, token, previousToken);

  let confirmLink = await createDirectConfirmationUrl(token, cleanCorreo, cleanNombre, options?.originBase);
  const serverConfirmLink = buildServerConfirmationUrl(token, options?.originBase);
  const subject = `Mi Bóveda: Tu código de verificación (${cleanPin})`;
  const buildText = (link: string) =>
    `Hola ${cleanNombre},\n\nTu código de verificación de 6 dígitos para Mi Bóveda es:\n\n${cleanPin}\n\nEste código es de un solo uso y vence en 5 minutos.\n\n¿Prefieres confirmar directamente con enlace? Abre: ${link}\n\nSaludos,\nMi Bóveda`;
  const buildHtml = (link: string) => `
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
        <p style="margin: 14px 0 18px 0; color: #6b7280; font-size: 13px; line-height: 1.4; text-align: center;">
          Este código es de un solo uso y caduca automáticamente a los 5 minutos.
        </p>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #4b5563;">¿Prefieres confirmar sin escribir el código?</p>
          <a href="${link}" style="display: inline-block; padding: 10px 18px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: bold;">
            Confirmar cuenta tocando este enlace
          </a>
        </div>
      </div>`;

  let delivered = false;
  let provider = '';
  let lastError = '';

  // Opción A: Puente Google Apps Script (si no se indicó saltarlo tras intento previo del cliente)
  if (!options?.skipAppsScript && APPS_SCRIPT_EMAIL_URL.startsWith('https://script.google.com/macros/s/')) {
    try {
      const gasRes = await fetch(APPS_SCRIPT_EMAIL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'send_verification',
          email: cleanCorreo,
          firstName: cleanNombre,
          token,
          pin: cleanPin,
          createdAt: createdAtStr,
        }),
      });
      const gasData: any = await gasRes.json().catch(() => null);
      if (gasRes.ok && gasData?.success && gasData?.delivered !== false) {
        delivered = true;
        provider = 'apps_script';
        if (gasData.confirmLink) {
          confirmLink = gasData.confirmLink;
        }
      } else {
        lastError = gasData?.error || `Apps Script HTTP ${gasRes.status}`;
      }
    } catch (err: any) {
      lastError = err?.message || 'Error conectando con Apps Script';
    }
  }

  const tryGmailSmtp = async () => {
    if (!transporter || delivered) return;
    try {
      confirmLink = serverConfirmLink;
      const info = await transporter.sendMail({
        from: `"Mi Bóveda" <${GMAIL_USER}>`,
        replyTo: `"Mi Bóveda" <${GMAIL_USER}>`,
        to: cleanCorreo,
        subject,
        text: buildText(serverConfirmLink),
        html: buildHtml(serverConfirmLink),
      });
      if (info.rejected && info.rejected.length > 0) {
        lastError = 'El servidor de destino rechazó el correo';
      } else {
        delivered = true;
        provider = 'gmail_smtp';
        console.log(`[SMTP] Código ${cleanPin} + enlace enviado a: ${cleanCorreo} | token: ${token} | messageId: ${info.messageId}`);
      }
    } catch (err: any) {
      lastError = err?.message || 'Credenciales SMTP rechazadas por Gmail';
    }
  };

  const tryResendApi = async () => {
    if (!VALID_RESEND_KEY || delivered) return;
    try {
      confirmLink = serverConfirmLink;
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VALID_RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL,
          to: [cleanCorreo],
          subject,
          text: buildText(serverConfirmLink),
          html: buildHtml(serverConfirmLink),
        }),
      });
      const resendData: any = await resendRes.json().catch(() => null);
      if (resendRes.ok && resendData?.id) {
        delivered = true;
        provider = 'resend';
        console.log(`[Resend] Código ${cleanPin} + enlace enviado a: ${cleanCorreo} | token: ${token} | id: ${resendData.id}`);
      } else {
        lastError = resendData?.message || `Resend HTTP ${resendRes.status}`;
      }
    } catch (err: any) {
      lastError = err?.message || 'Error conectando con Resend';
    }
  };

  // Si Resend usa onboarding@resend.dev (sandbox), priorizar Gmail SMTP verificado;
  // si Resend usa un dominio propio verificado, intentar Resend primero y Gmail SMTP como respaldo.
  const resendUsesSandbox = RESEND_FROM_EMAIL.includes('onboarding@resend.dev');
  if (resendUsesSandbox && transporter) {
    await tryGmailSmtp();
    await tryResendApi();
  } else {
    await tryResendApi();
    await tryGmailSmtp();
  }

  if (!delivered) {
    return {
      ok: false,
      confirmLink,
      pin: cleanPin,
      error:
        lastError ||
        'Faltan credenciales SMTP/Resend activas en el servidor (GMAIL_USER + GMAIL_PASS o RESEND_API_KEY) para respaldar el envío.',
    };
  }

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

  return { ok: true, confirmLink, pin: cleanPin, provider };
}

// 0) Diagnóstico de proveedores de correo configurados (solo banderas booleanas, sin exponer llaves)
app.get('/api/email-health', async (req: Request, res: Response) => {
  const baseProviders = {
    appsScript: APPS_SCRIPT_EMAIL_URL.startsWith('https://script.google.com/macros/s/'),
    appsScriptMatchesDefault: APPS_SCRIPT_EMAIL_URL === DEFAULT_APPS_SCRIPT_EMAIL_URL,
    resend: Boolean(VALID_RESEND_KEY),
    resendFromIsOnboarding: RESEND_FROM_EMAIL.includes('onboarding@resend.dev'),
    gmailSmtp: Boolean(transporter),
  };

  if (req.query.deep !== '1') {
    return res.json({ ok: true, providers: baseProviders });
  }

  let appsScriptPing: any = null;
  if (baseProviders.appsScript) {
    try {
      const r = await fetch(`${APPS_SCRIPT_EMAIL_URL}?action=ping`, { method: 'GET' });
      appsScriptPing = await r.json().catch(() => ({ httpStatus: r.status }));
    } catch (e: any) {
      appsScriptPing = { ok: false, error: e?.message || 'fetch failed' };
    }
  }

  let smtpVerified = false;
  let smtpError = '';
  if (transporter) {
    try {
      await transporter.verify();
      smtpVerified = true;
    } catch (e: any) {
      smtpError = e?.message || 'verify failed';
    }
  }

  let resendApiOk = false;
  let resendError = '';
  if (VALID_RESEND_KEY) {
    try {
      const r = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${VALID_RESEND_KEY}` },
      });
      resendApiOk = r.ok;
      if (!r.ok) {
        const body: any = await r.json().catch(() => null);
        resendError = body?.message || `HTTP ${r.status}`;
      }
    } catch (e: any) {
      resendError = e?.message || 'fetch failed';
    }
  }

  return res.json({
    ok: true,
    providers: baseProviders,
    deep: {
      appsScriptPing,
      smtpVerified,
      smtpError: smtpError || undefined,
      resendApiOk,
      resendError: resendError || undefined,
    },
  });
});

// 1) Endpoint HTTP directo para enviar el correo con PIN de 6 dígitos + enlace
const handleEnviarEnlace = async (req: Request, res: Response) => {
  const correo = String(req.body.correo || req.body.email || '').trim().toLowerCase();
  const nombre = String(req.body.nombre || req.body.firstName || '').trim() || 'Usuario';
  const clientToken = String(req.body.token || '').trim();
  const clientPin = String(req.body.pin || '').trim();
  const previousToken = String(req.body.previousToken || '').trim();
  const skipAppsScript = Boolean(req.body.skipAppsScript);

  if (!correoValido(correo)) {
    return res.status(400).json({ ok: false, success: false, error: 'Correo electrónico no válido' });
  }

  const token = clientToken || crypto.randomBytes(16).toString('hex');
  const pin = clientPin && clientPin.length === 6 ? clientPin : generarPin6Digitos();

  if (tokensProcesados.has(token)) {
    const existing = confirmacionesPorCorreo.get(correo);
    return res.json({
      ok: true,
      success: true,
      delivered: true,
      targetEmail: correo,
      token,
      magicLink: existing?.confirmLink,
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
  const hostHeader = req.get('x-forwarded-host') || req.get('host') || '';
  const protoHeader = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  const originBase = hostHeader && !hostHeader.includes('localhost') ? `${protoHeader}://${hostHeader}` : undefined;

  try {
    const result = await enviarCorreoConfirmacion(correo, nombre, token, pin, createdAt, previousToken, {
      skipAppsScript,
      originBase,
    });
    if (!result.ok) {
      tokensProcesados.delete(token);
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
      provider: result.provider,
      targetEmail: correo,
      token,
      magicLink: result.confirmLink,
      expiresInSeconds: 300,
      message: 'Te enviamos tu código de 6 dígitos por correo.',
    });
  } catch (err: any) {
    tokensProcesados.delete(token);
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
    if (token) {
      const fsRec = await getVerificationFromFirestore(token);
      if (fsRec) {
        if (fsRec.status === 'superseded') {
          return res.status(400).json({ ok: false, success: false, error: 'Este código fue reemplazado por uno más reciente.' });
        }
        if (fsRec.status === 'used') {
          return res.status(400).json({ ok: false, success: false, error: 'Este código ya fue utilizado anteriormente.' });
        }
        const createdMs = Date.parse(fsRec.createdAt);
        if (fsRec.status === 'expired' || !createdMs || Date.now() - createdMs > VIGENCIA_MS) {
          return res.status(400).json({ ok: false, success: false, error: 'El código ha caducado (válido por 5 minutos). Solicita uno nuevo.' });
        }
        if (fsRec.pin && fsRec.pin === pinIngresado) {
          await saveVerificationToFirestore({
            token,
            email: fsRec.email || correo,
            firstName: fsRec.firstName,
            pin: fsRec.pin,
            status: 'used',
            confirmed: true,
            createdAt: fsRec.createdAt,
          });
          return res.json({
            ok: true,
            success: true,
            email: fsRec.email || correo,
            nombre: fsRec.firstName,
            message: 'Código verificado con éxito.',
          });
        }
        return res.status(400).json({ ok: false, success: false, error: 'El código de 6 dígitos es incorrecto.' });
      }
    }
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

// 3) Confirmación directa si se abre /api/confirmar-correo?token=... (con respaldo Firestore si se reinició la instancia)
app.get('/api/confirmar-correo', async (req: Request, res: Response) => {
  const token = String(req.query.token || '').trim();
  const correo = confirmacionesPorToken.get(token);
  const registro = correo ? confirmacionesPorCorreo.get(correo) : undefined;

  if (!registro) {
    const fsRec = token ? await getVerificationFromFirestore(token) : null;
    if (!fsRec) {
      return res.status(400).send(`
        <!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Enlace no válido</title></head>
        <body style="margin:0;font-family:sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;">
          <div style="max-width:380px;width:100%;background:#fff;border:1px solid #fecaca;border-radius:20px;padding:32px 24px;text-align:center;">
            <h2 style="color:#dc2626;margin:0 0 10px 0;">Enlace no válido o cancelado</h2>
            <p style="color:#475569;font-size:14px;margin:0;">Solicita un nuevo código desde la aplicación Mi Bóveda.</p>
          </div>
        </body></html>
      `);
    }

    if (fsRec.status === 'superseded') {
      return res.status(400).send(`
        <!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Enlace cancelado</title></head>
        <body style="margin:0;font-family:sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;">
          <div style="max-width:380px;width:100%;background:#fff;border:1px solid #fecaca;border-radius:20px;padding:32px 24px;text-align:center;">
            <h2 style="color:#dc2626;margin:0 0 10px 0;">Enlace cancelado</h2>
            <p style="color:#475569;font-size:14px;margin:0;">Solicitaste un código más reciente. Abre el correo más reciente.</p>
          </div>
        </body></html>
      `);
    }

    if (fsRec.confirmed || fsRec.status === 'confirmed' || fsRec.status === 'used') {
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

    const createdMs = Date.parse(fsRec.createdAt);
    if (fsRec.status === 'expired' || !createdMs || Date.now() - createdMs > VIGENCIA_MS) {
      await saveVerificationToFirestore({
        token,
        email: fsRec.email,
        firstName: fsRec.firstName,
        pin: fsRec.pin,
        status: 'expired',
        confirmed: false,
        createdAt: fsRec.createdAt || new Date().toISOString(),
      });
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

    await saveVerificationToFirestore({
      token,
      email: fsRec.email,
      firstName: fsRec.firstName,
      pin: fsRec.pin,
      status: 'confirmed',
      confirmed: true,
      createdAt: fsRec.createdAt || new Date().toISOString(),
    });

    return res.status(200).send(`
      <!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>¡Correo Confirmado! - Mi Bóveda</title></head>
      <body style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f8fafc; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px;">
        <div style="max-width:380px; width:100%; background:#fff; border:1px solid #e2e8f0; border-radius:20px; padding:32px 24px; text-align:center; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
          <div style="width:64px; height:64px; border-radius:50%; background:#dcfce7; color:#16a34a; display:inline-flex; align-items:center; justify-content:center; font-size:32px; margin-bottom:16px;">✓</div>
          <h2 style="margin:0 0 10px 0; color:#0f172a; font-size:22px;">¡Correo confirmado!</h2>
          <p style="margin:0 0 18px 0; color:#475569; font-size:15px; line-height:1.5;">Tu correo electrónico ya quedó verificado correctamente.</p>
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:14px; color:#166534; font-size:14px; font-weight:600;">
            Ya puedes volver a la aplicación Mi Bóveda; tu acceso se abrirá automáticamente.
          </div>
        </div>
      </body></html>
    `);
  }

  if (registro.token !== token) {
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
    if (token) {
      const fsRec = await getVerificationFromFirestore(token);
      if (fsRec) {
        if (fsRec.status === 'superseded') return res.json({ ok: true, confirmado: false, superseded: true });
        const createdMs = Date.parse(fsRec.createdAt);
        if (fsRec.status === 'expired' || !createdMs || Date.now() - createdMs > VIGENCIA_MS) {
          return res.json({ ok: true, confirmado: false, expired: true });
        }
        if (fsRec.confirmed && fsRec.status !== 'used') {
          await saveVerificationToFirestore({
            token,
            email: fsRec.email,
            firstName: fsRec.firstName,
            pin: fsRec.pin,
            status: 'used',
            confirmed: true,
            createdAt: fsRec.createdAt,
          });
          return res.json({ ok: true, confirmado: true, correo: fsRec.email, nombre: fsRec.firstName });
        }
      }
    }
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

/**
 * ============================================================================
 * PUENTE DE CORREO DE VERIFICACIÓN - MI BÓVEDA (Google Apps Script - Opción A)
 * ============================================================================
 * Envía el código de 6 dígitos + enlace de confirmación (vigencia 5 minutos,
 * un solo uso, cancelación automática de códigos anteriores) a CUALQUIER correo
 * (Gmail, Hotmail, Outlook, Yahoo, etc.) directamente desde tu cuenta de Google,
 * 24/7, sin contraseñas de aplicación ni servidores externos.
 *
 * INSTRUCCIONES DE DESPLIEGUE (2 minutos):
 * 1. Abre https://script.google.com y haz clic en "Nuevo proyecto".
 * 2. Borra el contenido inicial y pega TODO este archivo. Guarda (Ctrl+S).
 * 3. Haz clic en "Implementar" -> "Nueva implementación" -> tipo "Aplicación web".
 *    - Ejecutar como: "Yo" (tu cuenta de Google).
 *    - Quién tiene acceso: "Cualquier usuario".
 * 4. Autoriza los permisos de envío de correo y copia la URL que termina en /exec.
 * ============================================================================
 */

var FIVE_MIN_MS = 5 * 60 * 1000;
var CACHE_TTL_SEC = 600; // 10 minutos
var FIRESTORE_COLLECTION_URL =
  'https://firestore.googleapis.com/v1/projects/studio-7313343442-ab21c/databases/ai-studio-remixbvedasegura-97d4266f-3ed5-45b1-9490-cec56ba0c191/documents/email_verifications';

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTokenRecord(token) {
  if (!token) return null;
  var key = 'tok_' + token;
  try {
    var cached = CacheService.getScriptCache().get(key);
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  try {
    var stored = PropertiesService.getScriptProperties().getProperty(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return null;
}

function saveTokenRecord(token, record) {
  if (!token || !record) return;
  var key = 'tok_' + token;
  var payload = JSON.stringify(record);
  try {
    CacheService.getScriptCache().put(key, payload, CACHE_TTL_SEC);
  } catch (e) {}
  try {
    PropertiesService.getScriptProperties().setProperty(key, payload);
  } catch (e) {}
}

function cleanupOldTokenProperties() {
  try {
    var props = PropertiesService.getScriptProperties();
    var all = props.getProperties();
    var now = Date.now();
    var maxAge = 15 * 60 * 1000;
    for (var k in all) {
      if (k.indexOf('tok_') === 0) {
        try {
          var rec = JSON.parse(all[k]);
          if (!rec || !rec.createdAtMs || now - rec.createdAtMs > maxAge) {
            props.deleteProperty(k);
          }
        } catch (err) {
          props.deleteProperty(k);
        }
      }
    }
  } catch (e) {}
}

function syncTokenToFirestoreBestEffort(record) {
  try {
    if (!record || !record.token) return;
    var fields = {
      token: { stringValue: String(record.token) },
      email: { stringValue: String(record.email || '') },
      firstName: { stringValue: String(record.firstName || 'Usuario') },
      status: { stringValue: String(record.status || 'pending') },
      confirmed: { booleanValue: Boolean(record.confirmed) },
      createdAt: { stringValue: String(record.createdAt || new Date().toISOString()) },
    };
    if (record.pin) {
      fields.pin = { stringValue: String(record.pin) };
    }
    UrlFetchApp.fetch(
      FIRESTORE_COLLECTION_URL + '/' + encodeURIComponent(record.token),
      {
        method: 'patch',
        contentType: 'application/json',
        payload: JSON.stringify({ fields: fields }),
        muteHttpExceptions: true,
      }
    );
  } catch (e) {}
}

function supersedePreviousTokenForEmail(email, newToken) {
  if (!email) return;
  try {
    var props = PropertiesService.getScriptProperties();
    var emailKey = 'active_email_' + email;
    var prevToken = props.getProperty(emailKey);
    if (prevToken && prevToken !== newToken) {
      var prevRec = getTokenRecord(prevToken);
      if (
        prevRec &&
        (prevRec.status === 'pending' || prevRec.status === 'sending' || prevRec.status === 'sent')
      ) {
        prevRec.status = 'superseded';
        prevRec.confirmed = false;
        saveTokenRecord(prevToken, prevRec);
        syncTokenToFirestoreBestEffort(prevRec);
      }
    }
    props.setProperty(emailKey, newToken);
  } catch (e) {}
}

function buildConfirmationHtmlPage(opts) {
  var isOk = Boolean(opts.ok);
  var bgIcon = isOk ? '#dcfce7' : '#fee2e2';
  var fgIcon = isOk ? '#16a34a' : '#dc2626';
  var iconSymbol = isOk ? '✓' : '!';
  var badgeBg = isOk ? '#f0fdf4' : '#fef2f2';
  var badgeBorder = isOk ? '#bbf7d0' : '#fecaca';
  var badgeColor = isOk ? '#166534' : '#991b1b';

  var html =
    '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
    '<title>' +
    escapeHtml(opts.title || 'Confirmación - Mi Bóveda') +
    '</title></head>' +
    '<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;box-sizing:border-box;">' +
    '<div style="max-width:380px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:32px 24px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,0.06);">' +
    '<div style="width:64px;height:64px;border-radius:50%;background:' +
    bgIcon +
    ';color:' +
    fgIcon +
    ';display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px;font-weight:bold;">' +
    iconSymbol +
    '</div>' +
    '<h2 style="margin:0 0 10px 0;color:#0f172a;font-size:22px;">' +
    escapeHtml(opts.heading) +
    '</h2>' +
    '<p style="margin:0 0 18px 0;color:#475569;font-size:15px;line-height:1.5;">' +
    opts.bodyHtml +
    '</p>' +
    '<div style="background:' +
    badgeBg +
    ';border:1px solid ' +
    badgeBorder +
    ';border-radius:12px;padding:14px;color:' +
    badgeColor +
    ';font-size:14px;font-weight:600;">' +
    escapeHtml(opts.badgeText) +
    '</div></div></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle(opts.title || 'Confirmación de Correo - Mi Bóveda')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = String(params.action || 'confirm').trim();
  var token = String(params.token || '').trim();

  if (action === 'ping') {
    return jsonResponse({ ok: true, service: 'mi-boveda-email-bridge', active: true });
  }

  if (action === 'status') {
    if (!token) return jsonResponse({ ok: true, confirmed: false });
    var rec = getTokenRecord(token);
    if (!rec) return jsonResponse({ ok: true, confirmed: false, notFound: true });

    if (rec.status === 'superseded') {
      return jsonResponse({ ok: true, confirmed: false, superseded: true });
    }
    var ageMs = Date.now() - Number(rec.createdAtMs || 0);
    if (rec.status === 'expired' || ageMs > FIVE_MIN_MS) {
      rec.status = 'expired';
      saveTokenRecord(token, rec);
      return jsonResponse({ ok: true, confirmed: false, expired: true });
    }
    if (rec.confirmed || rec.status === 'confirmed' || rec.status === 'used') {
      if (rec.status !== 'used') {
        rec.status = 'used';
        rec.confirmed = true;
        saveTokenRecord(token, rec);
        syncTokenToFirestoreBestEffort(rec);
      }
      return jsonResponse({
        ok: true,
        confirmed: true,
        email: rec.email,
        firstName: rec.firstName,
      });
    }
    return jsonResponse({ ok: true, confirmed: false });
  }

  if (!token) {
    return buildConfirmationHtmlPage({
      ok: false,
      title: 'Enlace no válido',
      heading: 'Enlace no válido',
      bodyHtml: 'No se encontró el código de confirmación en este enlace.',
      badgeText: 'Solicita un nuevo código desde la aplicación Mi Bóveda.',
    });
  }

  var record = getTokenRecord(token);
  if (!record) {
    return buildConfirmationHtmlPage({
      ok: false,
      title: 'Enlace no válido',
      heading: 'Enlace no válido o expirado',
      bodyHtml: 'Este enlace de confirmación no existe o ya expiró.',
      badgeText: 'Solicita un nuevo correo desde la aplicación Mi Bóveda.',
    });
  }

  if (record.status === 'superseded') {
    return buildConfirmationHtmlPage({
      ok: false,
      title: 'Enlace cancelado',
      heading: 'Enlace cancelado',
      bodyHtml:
        'Solicitaste un código más reciente, por lo que este enlace anterior quedó desactivado automáticamente.',
      badgeText: 'Abre el correo más reciente que recibiste.',
    });
  }

  if (record.confirmed || record.status === 'confirmed' || record.status === 'used') {
    return buildConfirmationHtmlPage({
      ok: false,
      title: 'Enlace ya utilizado',
      heading: 'Enlace ya utilizado',
      bodyHtml:
        'Este enlace es de un solo uso y ya fue utilizado anteriormente para confirmar tu cuenta.',
      badgeText: 'Regresa a la aplicación Mi Bóveda.',
    });
  }

  var elapsedMs = Date.now() - Number(record.createdAtMs || 0);
  if (record.status === 'expired' || elapsedMs > FIVE_MIN_MS) {
    record.status = 'expired';
    record.confirmed = false;
    saveTokenRecord(token, record);
    syncTokenToFirestoreBestEffort(record);

    return buildConfirmationHtmlPage({
      ok: false,
      title: 'Enlace caducado (5 min)',
      heading: 'Enlace caducado (5 min)',
      bodyHtml:
        'Por seguridad, este enlace solo era válido durante 5 minutos y el tiempo ya expiró.',
      badgeText: 'Vuelve a la aplicación Mi Bóveda y toca Reenviar código.',
    });
  }

  record.status = 'confirmed';
  record.confirmed = true;
  saveTokenRecord(token, record);
  syncTokenToFirestoreBestEffort(record);

  return buildConfirmationHtmlPage({
    ok: true,
    title: '¡Correo Confirmado! - Mi Bóveda',
    heading: '¡Correo confirmado!',
    bodyHtml:
      'Hola <strong>' +
      escapeHtml(record.firstName || 'Usuario') +
      '</strong>, tu correo <strong>' +
      escapeHtml(record.email) +
      '</strong> ya quedó verificado correctamente.',
    badgeText: 'Ya puedes volver a la aplicación Mi Bóveda; tu acceso se abrirá automáticamente.',
  });
}

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var data = JSON.parse(raw);
    var action = String(data.action || 'send_verification').trim();

    if (action === 'verify_pin') {
      var vToken = String(data.token || '').trim();
      var vPin = String(data.pin || '').trim();
      var vRec = getTokenRecord(vToken);

      if (!vRec) {
        return jsonResponse({ ok: false, success: false, notFound: true });
      }
      if (vRec.status === 'superseded') {
        return jsonResponse({
          ok: false,
          success: false,
          superseded: true,
          error: 'Este código fue cancelado porque solicitaste uno más reciente.',
        });
      }
      if (vRec.status === 'used') {
        return jsonResponse({
          ok: false,
          success: false,
          used: true,
          error: 'Este código es de un solo uso y ya fue utilizado.',
        });
      }
      var age = Date.now() - Number(vRec.createdAtMs || 0);
      if (vRec.status === 'expired' || age > FIVE_MIN_MS) {
        vRec.status = 'expired';
        saveTokenRecord(vToken, vRec);
        return jsonResponse({
          ok: false,
          success: false,
          expired: true,
          error: 'El código ha expirado (válido solo por 5 minutos). Toca "Reenviar código".',
        });
      }
      if (String(vRec.pin || '').trim() !== vPin) {
        return jsonResponse({
          ok: false,
          success: false,
          error: 'El código de 6 dígitos es incorrecto. Verifica el correo más reciente.',
        });
      }

      vRec.status = 'used';
      vRec.confirmed = true;
      saveTokenRecord(vToken, vRec);
      syncTokenToFirestoreBestEffort(vRec);
      return jsonResponse({
        ok: true,
        success: true,
        email: vRec.email,
        firstName: vRec.firstName,
        message: '¡Código verificado con éxito!',
      });
    }

    if (action === 'mark_used' || action === 'supersede') {
      var mToken = String(data.token || '').trim();
      var mRec = getTokenRecord(mToken);
      if (mRec) {
        mRec.status = action === 'mark_used' ? 'used' : 'superseded';
        mRec.confirmed = action === 'mark_used';
        saveTokenRecord(mToken, mRec);
      }
      return jsonResponse({ ok: true, success: true });
    }

    var email = String(data.email || '').trim().toLowerCase();
    var firstName = String(data.firstName || 'Usuario').trim() || 'Usuario';
    var token = String(data.token || '').trim();
    var pin = String(data.pin || '').trim();
    var createdAt = String(data.createdAt || new Date().toISOString());

    if (!email || email.indexOf('@') === -1 || !token || pin.length !== 6) {
      return jsonResponse({
        ok: false,
        success: false,
        error: 'Datos incompletos para enviar el código de verificación.',
      });
    }

    cleanupOldTokenProperties();
    supersedePreviousTokenForEmail(email, token);

    var serviceUrl = ScriptApp.getService().getUrl();
    var confirmLink =
      serviceUrl + '?action=confirm&token=' + encodeURIComponent(token);

    var record = {
      token: token,
      email: email,
      firstName: firstName,
      pin: pin,
      status: 'sent',
      confirmed: false,
      createdAt: createdAt,
      createdAtMs: Date.now(),
    };
    saveTokenRecord(token, record);

    var safeName = escapeHtml(firstName);
    var safePin = escapeHtml(pin);
    var safeLink = escapeHtml(confirmLink);

    var subject = pin + ' es tu código de acceso a Mi Bóveda';
    var textBody =
      'Hola ' +
      firstName +
      ',\n\nTu código de verificación de 6 dígitos para Mi Bóveda es:\n\n' +
      pin +
      '\n\nEste código es de un solo uso y vence en 5 minutos.\n\n' +
      '¿Prefieres confirmar directamente con enlace? Abre: ' +
      confirmLink +
      '\n\nSaludos,\nMi Bóveda';

    var htmlBody =
      '<div style="font-family: Arial, sans-serif; max-width: 440px; margin: auto; padding: 28px 24px; border: 1px solid #e5e7eb; border-radius: 14px; background: #ffffff; color: #1f2937;">' +
      '<h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Mi Bóveda</h2>' +
      '<p style="margin: 0 0 14px 0; color: #374151; font-size: 15px; line-height: 1.5;">Hola <strong>' +
      safeName +
      '</strong>,</p>' +
      '<p style="margin: 0 0 18px 0; color: #374151; font-size: 14px; line-height: 1.5;">Ingresa el siguiente código de 6 dígitos en la aplicación para confirmar tu cuenta (válido por <strong>5 minutos</strong>):</p>' +
      '<div style="text-align: center; margin: 20px 0; padding: 14px 12px; background-color: #eff6ff; border: 1px dashed #93c5fd; border-radius: 12px; white-space: nowrap;">' +
      '<span style="font-size: 24px; font-weight: bold; letter-spacing: 6px; color: #1e3a8a; font-family: \'Courier New\', Courier, monospace; white-space: nowrap; display: inline-block;">' +
      safePin +
      '</span></div>' +
      '<p style="margin: 14px 0 18px 0; color: #6b7280; font-size: 12px; line-height: 1.4; text-align: center;">Este código es de un solo uso y caduca automáticamente a los 5 minutos.</p>' +
      '<div style="border-top: 1px solid #f3f4f6; padding-top: 12px; margin-top: 14px; text-align: center;">' +
      '<span style="font-size: 9px; color: #9ca3af; line-height: 1.3;">¿Prefieres confirmar sin escribir el código? ' +
      '<a href="' +
      safeLink +
      '" style="color: #6b7280; text-decoration: underline; font-size: 9px;">Confirmar cuenta tocando este enlace</a>' +
      '</span></div></div>';

    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody,
      name: 'Mi Bóveda',
    });

    syncTokenToFirestoreBestEffort(record);

    return jsonResponse({
      ok: true,
      success: true,
      delivered: true,
      targetEmail: email,
      token: token,
      confirmLink: confirmLink,
      expiresInSeconds: 300,
      message: 'Código de 6 dígitos enviado a ' + email,
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      success: false,
      error: err && err.message ? err.message : 'Error al procesar envío de correo.',
    });
  }
}

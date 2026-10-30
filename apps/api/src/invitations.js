import { createAuth } from './auth.js';

const idPattern = /^[A-Za-z0-9_-]{1,128}$/;
const escapeHtml = (value) => value.replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export async function sendReaderInvitation(env, id) {
  if (typeof id !== 'string' || !idPattern.test(id) || !env.EMAIL || !env.EMAIL_FROM || !env.WEB_ORIGIN) throw new Error('Invitation unavailable');
  const user=await env.DB.prepare("SELECT id, email FROM user WHERE id = ? AND emailVerified = 0 AND banned = 0 AND NOT EXISTS (SELECT 1 FROM account WHERE account.userId = user.id AND account.providerId = 'credential')").bind(id).first();
  if (!user) throw new Error('Reader is not eligible for an invitation');
  const captured=[];
  const auth=createAuth({...env,EMAIL:{async send(message){captured.push(message)}}});
  const headers={'content-type':'application/json',origin:env.WEB_ORIGIN};
  let token;
  try {
    const reset=await auth.handler(new Request(`${env.BETTER_AUTH_URL}/api/auth/request-password-reset`,{method:'POST',headers,body:JSON.stringify({email:user.email,redirectTo:`${env.WEB_ORIGIN}/reset-password`})}));
    if (!reset.ok || captured.length!==1) throw new Error('Unable to create reset link');
    const resetUrl=new URL(captured[0].text.match(/https?:\/\/\S+/)?.[0]);
    token=decodeURIComponent(resetUrl.pathname.split('/').pop());
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) throw new Error('Invalid reset token');
    const verification=await auth.handler(new Request(`${env.BETTER_AUTH_URL}/api/auth/send-verification-email`,{method:'POST',headers,body:JSON.stringify({email:user.email})}));
    if (!verification.ok || captured.length!==2) throw new Error('Unable to create verification link');
    const link=new URL(captured[1].text.match(/https?:\/\/\S+/)?.[0]);
    const target=new URL('/reset-password',env.WEB_ORIGIN);
    target.searchParams.set('token',token);
    link.searchParams.set('callbackURL',target.toString());
    await env.EMAIL.send({from:{email:env.EMAIL_FROM,name:'Castellation'},to:user.email,subject:'Your Castellation invitation',text:`Confirm your email and set your password using this link:\n\n${link}\n\nIf you did not expect this invitation, you can ignore this message.`,html:`<p>Confirm your email and set your password using this link:</p><p><a href="${escapeHtml(link.toString())}">Accept invitation</a></p><p>If you did not expect this invitation, you can ignore this message.</p>`});
  } catch (error) {
    if (token) await env.DB.prepare('DELETE FROM verification WHERE identifier = ? AND value = ?').bind(`reset-password:${token}`,id).run();
    throw error;
  }
}

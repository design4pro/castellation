const escapeHtml=(value)=>value.replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export async function sendAccountEmail(env, type, user, url) {
  if (!env.EMAIL || !env.EMAIL_FROM) throw new Error('Account email delivery is not configured');
  const verify=type==='verify';
  if (verify) { const target=new URL(url); target.searchParams.set('callbackURL', `${env.WEB_ORIGIN}/account?verified=1`); url=target.toString(); }
  const subject=verify?'Verify your Castellation email':'Reset your Castellation password';
  const instruction=verify?'Confirm your email address using this link:':'Reset your password using this link:';
  await env.EMAIL.send({from:{email:env.EMAIL_FROM,name:'Castellation'},to:user.email,subject,text:`${instruction}\n\n${url}\n\nIf you did not request this, you can ignore this message.`,html:`<p>${instruction}</p><p><a href="${escapeHtml(url)}">${verify?'Verify email':'Reset password'}</a></p><p>If you did not request this, you can ignore this message.</p>`});
}

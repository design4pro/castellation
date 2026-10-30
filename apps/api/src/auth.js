import { betterAuth } from 'better-auth';
import { expo } from '@better-auth/expo';
import { admin } from 'better-auth/plugins';
import { withCloudflare } from 'better-auth-cloudflare';
import { sendAccountEmail } from './account-email.js';

export function createAuth(env, context) {
  if (!env.BETTER_AUTH_SECRET || !env.BETTER_AUTH_URL || !env.WEB_ORIGIN) throw new Error('Authentication is not configured');
  return betterAuth(withCloudflare({d1Native:env.DB,autoDetectIpAddress:false,geolocationTracking:false},{
    secret:env.BETTER_AUTH_SECRET,
    baseURL:env.BETTER_AUTH_URL,
    trustedOrigins:[env.WEB_ORIGIN,'castellation://'],
    emailAndPassword:{enabled:true,minPasswordLength:12,requireEmailVerification:true,revokeSessionsOnPasswordReset:true,sendResetPassword:({user,url})=>sendAccountEmail(env,'reset',user,url)},
    emailVerification:{sendOnSignUp:true,sendOnSignIn:true,autoSignInAfterVerification:false,sendVerificationEmail:({user,url})=>sendAccountEmail(env,'verify',user,url)},
    rateLimit:{enabled:true,storage:'database'},
    advanced:{ipAddress:{ipAddressHeaders:['cf-connecting-ip']},...(context ? {backgroundTasks:{handler:(promise)=>context.waitUntil(promise)}} : {})},
    plugins:[expo(),admin()],
  }));
}

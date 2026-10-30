import { WorkerEntrypoint } from 'cloudflare:workers';
import { sendReaderInvitation } from '../../apps/api/src/invitations.js';

export class ReaderInvitations extends WorkerEntrypoint {
  async send(id) {
    const env={DB:this.env.DB,EMAIL_FROM:'test@example.test',BETTER_AUTH_SECRET:'local-test-secret-with-at-least-32-characters',BETTER_AUTH_URL:'http://localhost:8787',WEB_ORIGIN:'http://localhost:4325',EMAIL:{send:async(message)=>{await this.env.DB.prepare('INSERT INTO test_outbox (recipient,body) VALUES (?,?)').bind(message.to,message.text).run();}}};
    await sendReaderInvitation(env,id);
  }
}

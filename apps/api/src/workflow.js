import { WorkflowEntrypoint } from 'cloudflare:workers';
import { runBookWorkflow } from './run-workflow.js';

export class BookWorkflow extends WorkflowEntrypoint {
  run(event, step) { return runBookWorkflow(this.env, event.payload.sourceId, step); }
}

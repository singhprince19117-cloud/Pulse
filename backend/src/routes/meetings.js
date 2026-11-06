import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as c from '../controllers/meetingController.js';

const r = Router();
r.use(requireAuth);
r.post('/', validate(c.createSchema), c.create);
r.get('/history', c.history);
r.get('/:code', c.get);
r.post('/:code/token', c.token);
r.post('/:code/leave', c.leave);
r.post('/:code/remove', validate(c.removeSchema), c.remove);
r.post('/:code/end', c.end);
r.get('/:code/transcript', c.getTranscript);
r.post('/:code/transcript', validate(c.transcriptSchema), c.addTranscript);
r.get('/:code/messages', c.listMessages);
r.post('/:code/messages', validate(c.messageSchema), c.postMessage);
export default r;

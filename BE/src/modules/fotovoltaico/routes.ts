import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as ctrl from './controller';

const router = Router();

router.use(requireAuth as never);

router.get('/',       ctrl.list   as never);
router.get('/:id',   ctrl.get    as never);
router.post('/',     ctrl.save   as never);
router.delete('/:id', ctrl.remove as never);

export default router;

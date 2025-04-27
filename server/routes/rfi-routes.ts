import express from 'express';
import { requireAuth, requireProjectAccess } from '../middleware/auth-middleware';
import * as rfiController from '../controllers/rfi-controller';

export const rfiRouter = express.Router();

// Project Periods endpoints
rfiRouter.get('/projects/:projectId/periods', requireAuth, rfiController.getProjectPeriods);
rfiRouter.post('/periods', requireAuth, rfiController.createProjectPeriod);

// RFI endpoints
rfiRouter.get('/projects/:projectId/rfis', requireAuth, rfiController.getRfis);
rfiRouter.post('/rfis', requireAuth, rfiController.createRfi);
rfiRouter.get('/rfis/:id', requireAuth, rfiController.getRfiById);
rfiRouter.patch('/rfis/:id', requireAuth, rfiController.updateRfi);
rfiRouter.delete('/rfis/:id', requireAuth, rfiController.deleteRfi);

// RFI attachments
rfiRouter.post('/rfis/:id/attachments', 
  requireAuth, 
  rfiController.upload.single('file'), 
  rfiController.addRfiAttachment
);
rfiRouter.delete('/rfis/:id/attachments/:attachmentId', requireAuth, rfiController.deleteRfiAttachment);

// RFI comments
rfiRouter.post('/rfis/:id/comments', requireAuth, rfiController.addRfiComment);
rfiRouter.delete('/rfis/:id/comments/:commentId', requireAuth, rfiController.deleteRfiComment);

// RFI metrics for dashboard
rfiRouter.get('/projects/:projectId/rfi-metrics', requireAuth, rfiController.getRfiMetrics);

export function setupRfiRoutes(app: express.Express): void {
  app.use('/api', rfiRouter);
}
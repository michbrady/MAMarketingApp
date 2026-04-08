import { Router } from 'express';
import contactGroupController from '../controllers/contact-group.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All contact group routes require authentication
router.use(authenticate);

// Contact group CRUD operations
router.post('/', (req, res) => contactGroupController.createGroup(req, res));
router.get('/', (req, res) => contactGroupController.listGroups(req, res));
router.get('/:id', (req, res) => contactGroupController.getGroup(req, res));
router.put('/:id', (req, res) => contactGroupController.updateGroup(req, res));
router.delete('/:id', (req, res) => contactGroupController.deleteGroup(req, res));

// Group contacts management
router.get('/:id/contacts', (req, res) => contactGroupController.getGroupContacts(req, res));
router.post('/:id/contacts', (req, res) => contactGroupController.addContactsToGroup(req, res));
router.delete('/:id/contacts/:contactId', (req, res) => contactGroupController.removeContactFromGroup(req, res));

export default router;

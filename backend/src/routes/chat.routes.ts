import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { chatPaginationSchema, conversationIdParamsSchema, openConversationSchema, sendMessageSchema } from '../validators/message';
import { chatController } from '../controllers/chat.controller';

export const conversationRouter = Router();

conversationRouter.get('/', authenticate(), chatController.listConversations);

// Open (find or create) a conversation without sending a message.
conversationRouter.post('/', authenticate(), validate(openConversationSchema), chatController.openConversation);

conversationRouter.get('/:id', authenticate(), validate(conversationIdParamsSchema, 'params'), chatController.getConversation);

conversationRouter.get('/:id/messages', authenticate(), validate(conversationIdParamsSchema, 'params'), validate(chatPaginationSchema, 'query'), chatController.listMessages);

conversationRouter.post('/:id/read', authenticate(), validate(conversationIdParamsSchema, 'params'), chatController.markRead);

export const messageRouter = Router();

messageRouter.post('/', authenticate(), validate(sendMessageSchema), chatController.sendMessage);
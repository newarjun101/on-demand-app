import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react';
import { chatApi } from '@/api/endpoints';
import { Avatar, Button, Card, EmptyState, Skeleton, Spinner } from '@/components/UI';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketEvent } from '@/hooks/useSocket';
import { timeAgo } from '@/utils/format';
import clsx from 'clsx';

export function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const { data: conv } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatApi.getConversation(conversationId!),
    enabled: !!conversationId,
  });

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: () => chatApi.listMessages(conversationId!, 1, 100),
    enabled: !!conversationId,
  });

  useSocketEvent('new_message', (msg: any) => {
    if (msg.conversationId === conversationId) {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
  useSocketEvent('message_read', () => {
    queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
  });

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
    if (conversationId && user) {
      chatApi.markRead(conversationId).catch(() => {});
    }
  }, [messagesData?.items.length, conversationId]);

  const other = conv && conv.customerId === user?.id ? conv.worker : conv?.customer;

  async function send() {
    if (!text.trim() || !conversationId) return;
    setSending(true);
    try {
      await chatApi.sendMessage({ conversationId, text });
      setText('');
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
    } catch {} finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <Card className="flex flex-col h-[calc(100vh-160px)] sm:h-[600px]">
        {conv ? (
          <div className="flex items-center gap-3 p-4 border-b">
            <Link to="/messages" className="md:hidden text-gray-500"><ArrowLeft size={20} /></Link>
            <Avatar src={other?.avatarUrl} name={other?.fullName ?? ''} size={40} />
            <div>
              <div className="font-semibold">{other?.fullName}</div>
              <div className="text-xs text-gray-500">Customer ↔ Worker chat</div>
            </div>
          </div>
        ) : <Skeleton className="h-16" />}

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (messagesData?.items.length ?? 0) === 0 ? (
            <EmptyState title="No messages yet" description="Send a message to start the conversation." />
          ) : (
            messagesData!.items.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <div key={m.id} className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div className={clsx('max-w-[75%] rounded-2xl px-3 py-2 text-sm', mine ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-900')}>
                    {m.imageUrl && <img src={m.imageUrl} className="rounded-lg mb-1 max-w-[200px]" alt="" />}
                    {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                    <div className={clsx('text-[10px] mt-1 flex justify-end gap-1', mine ? 'text-brand-100' : 'text-gray-400')}>
                      <span>{timeAgo(m.createdAt)}</span>
                      {mine && <span>{m.readAt ? '✓✓' : '✓'}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEnd} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="p-3 border-t flex items-center gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
          <Button type="submit" disabled={sending || !text.trim()} size="sm" className="rounded-full px-4">
            {sending ? <Spinner size={14} /> : <Send size={16} />}
          </Button>
        </form>
      </Card>
    </div>
  );
}
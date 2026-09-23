import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { chatApi } from '@/api/endpoints';
import { Avatar, Card, EmptyState, Skeleton } from '@/components/UI';
import { timeAgo } from '@/utils/format';
import { useAuth } from '@/contexts/AuthContext';
import { Pagination } from '@/components/Pagination';

const PAGE_SIZE = 30;

export function ConversationsListPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['conversations'], queryFn: chatApi.listConversations, refetchInterval: 8000 });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
      <p className="text-sm text-gray-500 mt-1">Chat with your customers</p>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState title="No conversations yet" description="You'll be able to chat with customers once you accept a request." />
        ) : (
          data!.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((c) => {
            const other = c.customerId === user?.id ? c.worker : c.customer;
            const unread = c.customerId === user?.id ? c.customerUnreadCount : c.workerUnreadCount;
            return (
              <Link to={`/messages/${c.id}`} key={c.id}>
                <Card className="p-4 flex items-center gap-3 hover:border-brand-300 transition">
                  <Avatar src={other.avatarUrl} name={other.fullName} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold truncate">{other.fullName}</div>
                      <div className="text-xs text-gray-500">{timeAgo(c.lastMessageAt)}</div>
                    </div>
                    <div className="text-sm text-gray-500 truncate">{c.messages?.[0]?.text ?? 'No messages yet'}</div>
                  </div>
                  {unread > 0 && <span className="bg-brand-600 text-white text-xs rounded-full px-2 py-0.5">{unread}</span>}
                </Card>
              </Link>
            );
          })
        )}
      </div>
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.length} onChange={setPage} />}
    </div>
  );
}

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/i18n';
import { adminApi } from '@/api/endpoints';
import { extractError } from '@/api/client';
import { Button, Card, Input, Select, Spinner, Textarea } from '@/components/UI';

export function BroadcastPage() {
  const { t } = useI18n();
  const [segment, setSegment] = useState<'all' | 'customers' | 'workers' | 'admins'>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const sendMut = useMutation({
    mutationFn: () => adminApi.broadcast({ segment, title, body }),
    onSuccess: (res: any) => { toast.success(t('broadcast.sent', { n: res.sent })); setTitle(''); setBody(''); },
    onError: (e: any) => toast.error(extractError(e)),
  });
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('broadcast.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('broadcast.subtitle')}</p>
      </div>
      <Card className="p-5 space-y-3">
        <Select label={t('broadcast.segment')} value={segment} onChange={(e) => setSegment(e.target.value as any)} options={[
          { value: 'all', label: t('broadcast.allUsers') },
          { value: 'customers', label: t('broadcast.allCustomers') },
          { value: 'workers', label: t('broadcast.allWorkers') },
          { value: 'admins', label: t('roles.title') },
        ]} />
        <Input label={t('broadcast.title_field')} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label={t('broadcast.body')} rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
        <Button disabled={!title || !body || sendMut.isPending} loading={sendMut.isPending} onClick={() => sendMut.mutate()}>
          <Send size={14} className="mr-1" /> {t('broadcast.send')}
        </Button>
      </Card>
    </div>
  );
}

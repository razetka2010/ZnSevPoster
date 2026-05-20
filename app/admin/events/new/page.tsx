import AdminEventForm from '@/components/admin/AdminEventForm';

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Новое мероприятие</h1>
      <AdminEventForm submitLabel="Создать мероприятие" />
    </div>
  );
}

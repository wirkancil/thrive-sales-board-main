import { ContactsTable } from '@/components/ContactsTable';

export default function Contacts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
      </div>
      
      <ContactsTable />
    </div>
  );
}
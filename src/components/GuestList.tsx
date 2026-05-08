'use client';

import { useUser } from '@/hooks/useUser';

interface Guest {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  rsvp_status: string;
  seat_assignment?: string;
}

export function GuestList({ guests }: { guests: Guest[] }) {
  const { role, isOrganizer, loading } = useUser();

  if (loading) {
    return <div className="animate-pulse h-40 bg-slate-100 rounded-lg"></div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold tracking-wider">
            <th className="px-6 py-4 border-b border-slate-200">Name</th>
            {isOrganizer && <th className="px-6 py-4 border-b border-slate-200">Email</th>}
            {isOrganizer && <th className="px-6 py-4 border-b border-slate-200">Phone</th>}
            <th className="px-6 py-4 border-b border-slate-200">Status</th>
            <th className="px-6 py-4 border-b border-slate-200">Seat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {guests.map((guest) => (
            <tr key={guest.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-900">{guest.full_name}</td>
              {isOrganizer && <td className="px-6 py-4 text-slate-600">{guest.email || '-'}</td>}
              {isOrganizer && <td className="px-6 py-4 text-slate-600">{guest.phone || '-'}</td>}
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  guest.rsvp_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  guest.rsvp_status === 'declined' ? 'bg-red-100 text-red-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {guest.rsvp_status}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-600">{guest.seat_assignment || 'Not Assigned'}</td>
            </tr>
          ))}
          {guests.length === 0 && (
            <tr>
              <td colSpan={isOrganizer ? 5 : 3} className="px-6 py-10 text-center text-slate-400">
                No guests found for this event.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

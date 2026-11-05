import { cookies } from 'next/headers';
import PanelNav from '../components/PanelNav';
import SessionRenewal from '../components/SessionRenewal';
import { getValidToken } from '../../../lib/panel-auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const { user } = await getValidToken(cookieStore, { refresh: false });

  if (!user) {
    return <SessionRenewal />;
  }

  return (
    <div className="panel-shell">
      <PanelNav user={user} />
      <div className="panel-viewport">{children}</div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useStyles } from '../theme';
import { getRetentionAlerts, updateRetentionAlert, getPatients, subscribe } from '../data/store';

export default function Retention() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const alerts = getRetentionAlerts();
  const patients = getPatients();

  const activeAlerts = alerts.filter(a => a.status !== 'dismissed');
  const filtered = activeAlerts.filter(a => {
    if (filter === 'pending' && a.status !== 'pending') return false;
    if (filter === 'contacted' && a.status !== 'contacted') return false;
    if (filter === 'high' && a.priority !== 'high') return false;
    if (filter === 'medium' && a.priority !== 'medium') return false;
    if (search) { const q = search.toLowerCase(); return a.patientName?.toLowerCase().includes(q) || a.lastService?.toLowerCase().includes(q); }
    return true;
  }).sort((a, b) => b.daysSince - a.daysSince);

  const pendingCount = activeAlerts.filter(a => a.status === 'pending').length;
  const highCount = activeAlerts.filter(a => a.priority === 'high' && a.status === 'pending').length;
  const contactedCount = activeAlerts.filter(a => a.status === 'contacted').length;
  const avgDays = activeAlerts.length > 0 ? Math.round(activeAlerts.reduce((sum, a) => sum + a.daysSince, 0) / activeAlerts.length) : 0;

  const markContacted = (id) => updateRetentionAlert(id, { contacted: true, status: 'contacted', contactedAt: new Date().toISOString() });
  const dismiss = (id) => updateRetentionAlert(id, { status: 'dismissed' });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: s.HEADING, fontSize: 26, fontWeight: 600, color: s.text, marginBottom: 4 }}>Retention</h1>
        <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2 }}>Smart alerts for clients who need re-engagement -- stop the drift</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Pending Alerts', value: pendingCount, color: pendingCount > 0 ? s.warning : s.success },
          { label: 'High Priority', value: highCount, color: highCount > 0 ? s.danger : s.success },
          { label: 'Contacted', value: contactedCount, color: s.success },
          { label: 'Avg Days Since Visit', value: `${avgDays}d`, color: avgDays > 90 ? s.danger : s.text },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '16px 20px' }}>
            <div style={{ fontFamily: s.MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: s.HEADING, fontSize: 24, fontWeight: 600, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." style={{ ...s.input, maxWidth: 260 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'All'], ['pending', 'Pending'], ['high', 'High Priority'], ['medium', 'Medium'], ['contacted', 'Contacted']].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{ ...s.pill, padding: '7px 14px', fontSize: 12, background: filter === id ? s.accent : 'transparent', color: filter === id ? s.accentText : s.text2, border: filter === id ? `1px solid ${s.accent}` : `1px solid ${s.borderLight}` }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map(alert => (
          <div key={alert.id} style={{
            ...s.cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
            borderLeftWidth: 3, borderLeftStyle: 'solid',
            borderLeftColor: alert.status === 'contacted' ? s.success : alert.priority === 'high' ? s.danger : alert.priority === 'medium' ? s.warning : s.text3,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: alert.priority === 'high' ? s.dangerBg : s.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: s.FONT, fontSize: 14, fontWeight: 500, color: alert.priority === 'high' ? s.danger : s.text2 }}>
              {alert.patientName?.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontFamily: s.FONT, fontSize: 14, fontWeight: 500, color: s.text }}>{alert.patientName}</span>
                {alert.priority === 'high' && (<span style={{ padding: '2px 8px', borderRadius: 100, fontFamily: s.FONT, fontSize: 9, fontWeight: 500, textTransform: 'uppercase', background: s.dangerBg, color: s.danger }}>High Priority</span>)}
                {alert.contacted && (<span style={{ padding: '2px 8px', borderRadius: 100, fontFamily: s.FONT, fontSize: 9, fontWeight: 500, textTransform: 'uppercase', background: s.successBg, color: s.success }}>Contacted</span>)}
              </div>
              <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>{alert.suggestedAction}</div>
              <div style={{ fontFamily: s.FONT, fontSize: 11, color: s.text3, marginTop: 2 }}>Last visit: {alert.lastVisit ? new Date(alert.lastVisit + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'} -- {alert.lastService}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: s.MONO, fontSize: 18, fontWeight: 600, color: alert.daysSince > 100 ? s.danger : s.warning, marginBottom: 4 }}>{alert.daysSince}d</div>
              <div style={{ fontFamily: s.FONT, fontSize: 10, color: s.text3 }}>since visit</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
              {!alert.contacted && (
                <>
                  <button onClick={() => markContacted(alert.id)} style={{ ...s.pillAccent, padding: '6px 12px', fontSize: 11 }}>Mark Contacted</button>
                  <button onClick={() => dismiss(alert.id)} style={{ ...s.pillGhost, padding: '4px 10px', fontSize: 10 }}>Dismiss</button>
                </>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ ...s.cardStyle, padding: 48, textAlign: 'center', fontFamily: s.FONT, fontSize: 14, color: s.text3 }}>
            {filter === 'all' ? 'No retention alerts -- all clients are engaged!' : 'No alerts match this filter'}
          </div>
        )}
      </div>
    </div>
  );
}

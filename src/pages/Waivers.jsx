// Consent Forms & Waivers — digital signature, template management, compliance tracking
import { useState, useEffect, useRef } from 'react';
import { useStyles } from '../theme';
import { getPatients, getServices, getSettings, subscribe } from '../data/store';

const WAIVERS_KEY = 'ms_waivers';
function getWaivers() { try { return JSON.parse(localStorage.getItem(WAIVERS_KEY)) || []; } catch { return []; } }
function saveWaivers(w) { localStorage.setItem(WAIVERS_KEY, JSON.stringify(w)); }

const TEMPLATES = [
  // ═══ REQUIRED FOR EVERY MEMBER ═══
  { id: 'general', name: 'General Liability Waiver', category: 'Required', content: `GENERAL LIABILITY WAIVER AND RELEASE OF CLAIMS

I, [Member Name], voluntarily choose to participate in fitness classes and activities at [Business Name].

I understand and acknowledge the following:

1. NATURE OF ACTIVITIES: I understand that pilates, barre, and other fitness classes involve physical exertion, use of equipment (reformers, barres, resistance bands, weights, etc.), and movement that carries inherent risks.

2. ASSUMPTION OF RISK: I voluntarily assume all risks associated with participation in fitness classes and activities at [Business Name], including but not limited to:
   - Muscle strains, sprains, or soreness
   - Joint injuries
   - Slips, trips, or falls
   - Equipment-related injuries
   - Aggravation of pre-existing conditions
   - Cardiovascular events

3. HEALTH DISCLOSURE: I have truthfully disclosed my complete health history, current injuries, physical limitations, and any conditions that may affect my ability to safely participate in fitness activities.

4. RESPONSIBILITY: I agree to follow all instructions provided by my instructor. I understand that I am responsible for working within my own limits and communicating any pain or discomfort immediately.

5. FINANCIAL RESPONSIBILITY: I understand that I am responsible for all fees associated with my membership, class packages, and services.

I have had the opportunity to ask questions, and all my questions have been answered to my satisfaction. I voluntarily consent to participate.

Member Signature: _________________________
Date: ____________
Staff Witness: _________________________` },

  { id: 'health-questionnaire', name: 'Health Questionnaire & Assumption of Risk', category: 'Required', content: `HEALTH QUESTIONNAIRE AND ASSUMPTION OF RISK

[Business Name] — Confidential Health Information

PERSONAL INFORMATION
Full Name: _________________________
Date of Birth: __________ Gender: __________
Emergency Contact: _________________________ Phone: __________

HEALTH HISTORY (check all that apply)
[ ] Heart disease / Heart condition    [ ] High or low blood pressure
[ ] Diabetes                           [ ] Asthma / Respiratory condition
[ ] Arthritis                          [ ] Osteoporosis
[ ] Back pain / Spinal injury          [ ] Joint replacement
[ ] Recent surgery (within 6 months)   [ ] Seizure disorder
[ ] Dizziness / Balance issues         [ ] Chronic pain condition
[ ] Depression / Anxiety               [ ] Other: _______________

CURRENT MEDICATIONS
_______________________________________________

CURRENT INJURIES OR PHYSICAL LIMITATIONS
_______________________________________________
_______________________________________________

Are you pregnant or possibly pregnant? [ ] Yes [ ] No
Have you been cleared by a physician to exercise? [ ] Yes [ ] No [ ] N/A

FITNESS EXPERIENCE
What is your current fitness level? [ ] Beginner [ ] Intermediate [ ] Advanced
Have you done pilates or barre before? [ ] Yes [ ] No
What are your fitness goals? _______________________________________________

I certify that the above information is true, accurate, and complete to the best of my knowledge. I will inform [Business Name] of any changes to my health status.

Member Signature: _________________________
Date: ____________` },

  // ═══ PHOTO & MARKETING ═══
  { id: 'photo', name: 'Photo & Marketing Consent', category: 'Optional', content: `CONSENT FOR PHOTOGRAPHY AND MARKETING USE

[Business Name] — Photo Release and Usage Authorization

I authorize [Business Name] and its staff to take photographs and/or videos during my participation in classes for inclusion in my member file.

MARKETING USE:
Please select ONE:
[ ] OPTION A — NO marketing use. Photos are for my member file ONLY.
[ ] OPTION B — ANONYMOUS use only. Photos may be used but my face will be cropped or obscured so I am NOT identifiable.
[ ] OPTION C — IDENTIFIABLE use. Photos may be used with my face visible. [Business Name] may tag me on social media with my permission.

TERMS:
- I will not receive compensation for the use of my photographs
- I may revoke this consent at any time by submitting a written request
- My decision regarding marketing use will NOT affect the quality of instruction I receive

Member Signature: _________________________
Date: ____________` },

  // ═══ CANCELLATION POLICY ═══
  { id: 'cancellation', name: 'Cancellation Policy', category: 'Policy', content: `CANCELLATION AND NO-SHOW POLICY ACKNOWLEDGMENT

[Business Name] — Class Policy

CANCELLATION POLICY:
- Classes must be cancelled at least 12 hours in advance through the app or by contacting the studio
- Late cancellations (less than 12 hours) will result in forfeiture of the class credit
- Members on unlimited plans will be charged a $15 late cancellation fee

NO-SHOW POLICY:
- A "no-show" is defined as failure to arrive within 10 minutes of class start time without prior notice
- No-show fee: forfeiture of class credit or $20 fee for unlimited members
- After 3 no-shows in a billing period, [Business Name] reserves the right to require prepayment

LATE ARRIVAL:
- If you arrive more than 5 minutes late, you may not be permitted to join the class for safety reasons
- This will be counted as a late cancellation

MEMBERSHIPS & PACKAGES:
- Unused class credits do not roll over unless specified in your membership agreement
- Membership freezes are available with 7 days advance notice

I have read and understand [Business Name]'s cancellation and no-show policy.

Member Signature: _________________________
Date: ____________` },

  // ═══ MINOR PARTICIPATION ═══
  { id: 'minor', name: 'Minor Participation Waiver', category: 'Required', content: `MINOR PARTICIPATION WAIVER AND PARENTAL CONSENT

[Business Name] — Waiver for Participants Under 18

MINOR INFORMATION
Minor's Full Name: _________________________
Date of Birth: __________
Age: __________

PARENT/GUARDIAN INFORMATION
Parent/Guardian Name: _________________________
Relationship: _________________________
Phone: __________
Email: _________________________

I, the undersigned parent or legal guardian, hereby grant permission for the above-named minor to participate in pilates, barre, and fitness classes at [Business Name].

I acknowledge that:
1. I have read and understand the General Liability Waiver and assume all risks on behalf of my minor child
2. I have disclosed any health conditions, injuries, or limitations that may affect my child's participation
3. My child will follow all instructor directions and studio rules
4. I will remain on the premises or be immediately reachable by phone during my child's participation
5. Participants under 16 must be accompanied by an adult

EMERGENCY MEDICAL AUTHORIZATION:
In the event of an emergency, I authorize [Business Name] staff to seek emergency medical treatment for my child if I cannot be reached.

I release [Business Name], its owners, instructors, and staff from any liability arising from my child's participation.

Parent/Guardian Signature: _________________________
Date: ____________
Minor's Signature (if 14+): _________________________` },
];

function initWaivers() {
  if (localStorage.getItem('ms_waivers_init')) return;
  const now = new Date();
  const ago = (days) => new Date(now - days * 86400000).toISOString();
  saveWaivers([
    { id: 'W-1', templateId: 'general', patientId: 'PAT-1000', patientName: 'Emma Johnson', signedAt: ago(5), signatureData: 'Emma Johnson', witnessName: 'Jessica Park', status: 'signed', expiresAt: ago(-360) },
    { id: 'W-2', templateId: 'health-questionnaire', patientId: 'PAT-1000', patientName: 'Emma Johnson', signedAt: ago(5), signatureData: 'Emma Johnson', witnessName: 'Sarah Mitchell', status: 'signed', expiresAt: ago(-360) },
    { id: 'W-3', templateId: 'photo', patientId: 'PAT-1000', patientName: 'Emma Johnson', signedAt: ago(5), signatureData: 'Emma Johnson', witnessName: '', status: 'signed', photoConsent: 'identifiable', expiresAt: ago(-360) },
    { id: 'W-4', templateId: 'general', patientId: 'PAT-1003', patientName: 'Ava Jones', signedAt: ago(30), signatureData: 'Ava Jones', witnessName: 'Emily Chen', status: 'signed', expiresAt: ago(-335) },
    { id: 'W-5', templateId: 'cancellation', patientId: 'PAT-1003', patientName: 'Ava Jones', signedAt: ago(30), signatureData: 'Ava Jones', witnessName: 'Jessica Park', status: 'signed', expiresAt: ago(-335) },
    { id: 'W-6', templateId: 'general', patientId: 'PAT-1005', patientName: 'Mia Garcia', signedAt: null, signatureData: null, witnessName: '', status: 'pending', expiresAt: null },
    { id: 'W-7', templateId: 'health-questionnaire', patientId: 'PAT-1002', patientName: 'Sophia Brown', signedAt: ago(20), signatureData: 'Sophia Brown', witnessName: '', status: 'signed', expiresAt: ago(-345) },
  ]);
  localStorage.setItem('ms_waivers_init', 'true');
}

export default function Waivers() {
  const s = useStyles();
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  useEffect(() => { initWaivers(); setTick(t => t + 1); }, []);

  const [waivers, setWaivers] = useState(getWaivers);
  const [tab, setTab] = useState('waivers'); // 'waivers' | 'templates' | 'send'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({ patientId: '', templateIds: [] });
  const [showPreview, setShowPreview] = useState(null);
  const [showSign, setShowSign] = useState(null);
  const [signName, setSignName] = useState('');
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  const patients = getPatients();
  const settings = getSettings();
  const refresh = () => setWaivers(getWaivers());

  const filtered = waivers.filter(w => {
    if (search) { const q = search.toLowerCase(); if (!w.patientName?.toLowerCase().includes(q)) return false; }
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => (b.signedAt || '9999').localeCompare(a.signedAt || '9999'));

  const signedCount = waivers.filter(w => w.status === 'signed').length;
  const pendingCount = waivers.filter(w => w.status === 'pending').length;

  const handleSendWaivers = () => {
    if (!sendForm.patientId || sendForm.templateIds.length === 0) return;
    const pat = patients.find(p => p.id === sendForm.patientId);
    const all = getWaivers();
    sendForm.templateIds.forEach(tId => {
      all.push({
        id: `W-${Date.now()}-${tId}`,
        templateId: tId,
        patientId: sendForm.patientId,
        patientName: pat ? `${pat.firstName} ${pat.lastName}` : 'Unknown',
        signedAt: null, signatureData: null, witnessName: '', status: 'pending', expiresAt: null,
      });
    });
    saveWaivers(all);
    refresh();
    setShowSend(false);
    setSendForm({ patientId: '', templateIds: [] });
  };

  const handleSign = (waiverId) => {
    if (!signName.trim()) return;
    const all = getWaivers().map(w => {
      if (w.id === waiverId) {
        const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1);
        return { ...w, status: 'signed', signedAt: new Date().toISOString(), signatureData: signName, expiresAt: exp.toISOString() };
      }
      return w;
    });
    saveWaivers(all);
    refresh();
    setShowSign(null);
    setSignName('');
  };

  const toggleTemplate = (id) => {
    setSendForm(prev => ({
      ...prev,
      templateIds: prev.templateIds.includes(id) ? prev.templateIds.filter(t => t !== id) : [...prev.templateIds, id],
    }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ font: `600 26px ${s.FONT}`, color: s.text, marginBottom: 4 }}>Consent & Waivers</h1>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2 }}>Digital consent forms, e-signatures, and compliance tracking</p>
        </div>
        <button onClick={() => setShowSend(true)} style={s.pillAccent}>+ Send Waivers</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Waivers', value: waivers.length },
          { label: 'Signed', value: signedCount, color: s.success },
          { label: 'Pending Signature', value: pendingCount, color: pendingCount > 0 ? s.warning : s.success },
          { label: 'Templates', value: TEMPLATES.length },
        ].map(k => (
          <div key={k.label} style={{ ...s.cardStyle, padding: '14px 18px' }}>
            <div style={{ font: `400 10px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, marginBottom: 4 }}>{k.label}</div>
            <div style={{ font: `600 22px ${s.FONT}`, color: k.color || s.text }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#F0F0F0', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
        {[['waivers', 'Member Waivers'], ['templates', 'Templates']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '9px 20px', background: tab === k ? '#fff' : 'transparent', border: 'none',
            font: `500 13px ${s.FONT}`, color: tab === k ? s.text : s.text3, cursor: 'pointer',
            borderRadius: tab === k ? 8 : 0, boxShadow: tab === k ? s.shadow : 'none',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'waivers' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member..." style={{ ...s.input, maxWidth: 240 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {[['all', 'All'], ['signed', 'Signed'], ['pending', 'Pending']].map(([id, label]) => (
                <button key={id} onClick={() => setStatusFilter(id)} style={{
                  ...s.pill, padding: '6px 14px', fontSize: 12,
                  background: statusFilter === id ? s.accent : 'transparent',
                  color: statusFilter === id ? s.accentText : s.text2,
                  border: statusFilter === id ? `1px solid ${s.accent}` : '1px solid #E5E5E5',
                }}>{label}</button>
              ))}
            </div>
          </div>

          <div style={s.tableWrap}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E5E5' }}>
                  {['Member', 'Form', 'Status', 'Signed', 'Expires', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1, color: s.text3, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => {
                  const tpl = TEMPLATES.find(t => t.id === w.templateId);
                  const expired = w.expiresAt && new Date(w.expiresAt) < new Date();
                  return (
                    <tr key={w.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                      <td style={{ padding: '12px 14px', font: `500 13px ${s.FONT}`, color: s.text }}>{w.patientName}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ font: `400 13px ${s.FONT}`, color: s.text }}>{tpl?.name || 'Unknown'}</div>
                        <div style={{ font: `400 10px ${s.FONT}`, color: s.text3 }}>{tpl?.category}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 100, font: `500 10px ${s.FONT}`, textTransform: 'uppercase',
                          background: w.status === 'signed' ? '#F0FDF4' : '#FFF7ED',
                          color: w.status === 'signed' ? s.success : s.warning,
                        }}>{expired ? 'Expired' : w.status}</span>
                      </td>
                      <td style={{ padding: '12px 14px', font: `400 12px ${s.FONT}`, color: s.text2 }}>
                        {w.signedAt ? new Date(w.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', font: `400 12px ${s.FONT}`, color: expired ? s.danger : s.text3 }}>
                        {w.expiresAt ? new Date(w.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setShowPreview(tpl)} style={{ ...s.pillGhost, padding: '4px 8px', fontSize: 10 }}>View</button>
                          {w.status === 'pending' && <button onClick={() => { setShowSign(w.id); setSignName(''); }} style={{ ...s.pillAccent, padding: '4px 10px', fontSize: 10 }}>Sign</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan="6" style={{ padding: 40, textAlign: 'center', font: `400 13px ${s.FONT}`, color: s.text3 }}>No waivers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {TEMPLATES.map(tpl => (
            <div key={tpl.id} style={{ ...s.cardStyle, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{tpl.name}</div>
                <span style={{ padding: '2px 8px', borderRadius: 100, background: '#F5F5F5', font: `500 10px ${s.FONT}`, color: s.text2 }}>{tpl.category}</span>
              </div>
              <div style={{ font: `400 12px ${s.FONT}`, color: s.text3, lineHeight: 1.5, maxHeight: 80, overflow: 'hidden', marginBottom: 12 }}>{tpl.content.slice(0, 150)}...</div>
              <button onClick={() => setShowPreview(tpl)} style={{ ...s.pillOutline, padding: '5px 12px', fontSize: 11 }}>Preview</button>
            </div>
          ))}
        </div>
      )}

      {/* Send Waivers Modal */}
      {showSend && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowSend(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 520, width: '90%', boxShadow: s.shadowLg, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 20 }}>Send Consent Forms</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Member</label>
              <select value={sendForm.patientId} onChange={e => setSendForm({ ...sendForm, patientId: e.target.value })} style={{ ...s.input, cursor: 'pointer' }}>
                <option value="">Select member...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Select Forms</label>
              <div style={{ display: 'grid', gap: 6 }}>
                {TEMPLATES.map(tpl => (
                  <label key={tpl.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: sendForm.templateIds.includes(tpl.id) ? `2px solid ${s.accent}` : '1px solid #E5E5E5', cursor: 'pointer' }}>
                    <input type="checkbox" checked={sendForm.templateIds.includes(tpl.id)} onChange={() => toggleTemplate(tpl.id)} style={{ accentColor: s.accent }} />
                    <div>
                      <div style={{ font: `500 13px ${s.FONT}`, color: s.text }}>{tpl.name}</div>
                      <div style={{ font: `400 11px ${s.FONT}`, color: s.text3 }}>{tpl.category}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSend(false)} style={s.pillGhost}>Cancel</button>
              <button onClick={handleSendWaivers} style={{ ...s.pillAccent, opacity: sendForm.patientId && sendForm.templateIds.length > 0 ? 1 : 0.4 }}>Send {sendForm.templateIds.length} Form{sendForm.templateIds.length !== 1 ? 's' : ''}</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowPreview(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 640, width: '90%', boxShadow: s.shadowLg, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 16 }}>{showPreview.name}</h2>
            <div style={{ font: `400 13px ${s.FONT}`, color: s.text2, lineHeight: 1.8, whiteSpace: 'pre-wrap', background: '#FAFAFA', padding: 20, borderRadius: 10, border: '1px solid #F0F0F0' }}>
              {showPreview.content.replace(/\[Business Name\]/g, settings.businessName || 'Remedy Pilates & Barre')}
            </div>
            <button onClick={() => setShowPreview(null)} style={{ ...s.pillGhost, marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}

      {/* Sign Modal */}
      {showSign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setShowSign(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', boxShadow: s.shadowLg }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: `600 18px ${s.FONT}`, color: s.text, marginBottom: 16 }}>Sign Consent Form</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Type Full Legal Name</label>
              <input value={signName} onChange={e => setSignName(e.target.value)} style={{ ...s.input, fontSize: 18, fontStyle: 'italic', textAlign: 'center' }} placeholder="Full Name" autoFocus />
            </div>
            <div style={{ padding: 16, background: '#FAFAFA', borderRadius: 10, textAlign: 'center', marginBottom: 16, border: '1px dashed #DDD', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {signName ? (
                <span style={{ font: `italic 28px 'Georgia', serif`, color: s.text }}>{signName}</span>
              ) : (
                <span style={{ font: `400 13px ${s.FONT}`, color: s.text3 }}>Signature preview</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSign(null)} style={s.pillGhost}>Cancel</button>
              <button onClick={() => handleSign(showSign)} disabled={!signName.trim()} style={{ ...s.pillAccent, opacity: signName.trim() ? 1 : 0.4 }}>Sign & Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Pricing strategy and backend roadmap
import { useState } from 'react';
import { useStyles, useTheme } from '../theme';
import { getSettings } from '../data/store';

export default function Pricing() {
  const s = useStyles();
  const { theme } = useTheme();
  const settings = getSettings();
  const [showDetail, setShowDetail] = useState(null);

  const glass = {
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 20,
    boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', padding: '40px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48, animation: 'fadeIn 0.5s ease' }}>
          <div style={{ font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 2, color: s.text3, marginBottom: 12 }}>Pricing Strategy</div>
          <h1 style={{ font: `600 36px ${s.FONT}`, color: s.text, marginBottom: 8, letterSpacing: '-0.5px' }}>How We Got to $1,500/month</h1>
          <p style={{ font: `400 16px ${s.FONT}`, color: s.text2, maxWidth: 600, margin: '0 auto' }}>
            Research-backed pricing for Get Stoa's personal training platform. Here's the math.
          </p>
        </div>

        {/* ═══ SECTION 1: What competitors charge ═══ */}
        <div style={{ ...glass, padding: 32, marginBottom: 24 }}>
          <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 6 }}>1. What Competitors Charge</h2>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>None of them offer what we do — and they still charge this much.</p>

          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { name: 'Vagaro', price: '$120/mo', features: 'Booking + basic POS', missing: 'No EMR, no DM inbox, no retention, inventory breaks constantly', color: '#E5E5E5' },
              { name: 'Fresha', price: 'Free (hidden fees)', features: 'Booking + basic POS', missing: 'No clinical features at all, charges clients fees, no HIPAA', color: '#E5E5E5' },
              { name: 'Aesthetic Record', price: '$120/mo', features: 'EMR + charting', missing: 'No marketing, no booking UX, steep learning curve', color: '#E5E5E5' },
              { name: 'Mangomint', price: '$245/mo', features: 'Nice UI + booking', missing: 'No clinical depth, no DM inbox, no client portal', color: '#E5E5E5' },
              { name: 'Boulevard', price: '$425/mo', features: 'Premium booking + POS', missing: 'No DM inbox, no retention engine, checkout errors hard to fix', color: '#FEF3C7' },
              { name: 'Zenoti', price: '$400-800/mo', features: 'Enterprise all-in-one', missing: 'Expensive, complex, slow support, bills before system is live', color: '#FEF3C7' },
              { name: 'AestheticsPro', price: '$150-250/mo', features: 'EMR + marketing', missing: 'Marketing templates outdated, tablet issues, clunky UX', color: '#E5E5E5' },
            ].map(c => (
              <div key={c.name} style={{
                display: 'grid', gridTemplateColumns: '140px 100px 1fr 1fr', gap: 12, padding: '12px 16px',
                borderRadius: 12, background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.04)',
                alignItems: 'center',
              }}>
                <span style={{ font: `600 14px ${s.FONT}`, color: s.text }}>{c.name}</span>
                <span style={{ font: `600 14px ${s.MONO}`, color: s.accent }}>{c.price}</span>
                <span style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{c.features}</span>
                <span style={{ font: `400 12px ${s.FONT}`, color: s.danger }}>{c.missing}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 2: The Frankenstack ═══ */}
        <div style={{ ...glass, padding: 32, marginBottom: 24 }}>
          <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 6 }}>2. What Training Facilities Actually Pay Today (The Frankenstack)</h2>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>When you add up all the tools they juggle, plus staff time managing them:</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
            {[
              { tool: 'Vagaro or Boulevard (booking + POS)', cost: '$120 – $425' },
              { tool: 'AestheticsPro or Aesthetic Record (EMR)', cost: '$120 – $250' },
              { tool: 'Mailchimp (email marketing)', cost: '$45 – $100' },
              { tool: 'SimpleTexting or Twilio (SMS)', cost: '$30 – $80' },
              { tool: 'Hootsuite or Later (social media)', cost: '$49 – $99' },
              { tool: 'Birdeye or Podium (review management)', cost: '$299 – $399' },
              { tool: 'JotForm or IntakeQ (consent forms)', cost: '$39 – $99' },
              { tool: 'Canva Pro (graphics)', cost: '$15' },
              { tool: 'Google Sheets (inventory, referrals, memberships)', cost: 'Free but 15-25 hrs/mo labor' },
              { tool: 'Instagram DMs from phone (lead management)', cost: 'Free but chaos — lost leads' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <span style={{ font: `400 13px ${s.FONT}`, color: s.text, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>{item.tool}</span>
                <span style={{ font: `500 13px ${s.MONO}`, color: s.text, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', textAlign: 'right' }}>{item.cost}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Low End', software: '$420', labor: '$375 (15 hrs)', total: '$795/mo' },
              { label: 'Typical', software: '$750', labor: '$625 (25 hrs)', total: '$1,375/mo' },
              { label: 'High End', software: '$1,450', labor: '$1,000 (40 hrs)', total: '$2,450/mo' },
            ].map(t => (
              <div key={t.label} style={{
                padding: 20, borderRadius: 14, textAlign: 'center',
                background: t.label === 'Typical' ? s.accent : 'rgba(0,0,0,0.03)',
                color: t.label === 'Typical' ? s.accentText : s.text,
              }}>
                <div style={{ font: `500 11px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, opacity: 0.7 }}>{t.label}</div>
                <div style={{ font: `600 24px ${s.FONT}`, marginBottom: 4 }}>{t.total}</div>
                <div style={{ font: `400 11px ${s.FONT}`, opacity: 0.7 }}>Software: {t.software}</div>
                <div style={{ font: `400 11px ${s.FONT}`, opacity: 0.7 }}>Staff labor: {t.labor}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: 16, background: 'rgba(0,0,0,0.03)', borderRadius: 12, font: `400 13px ${s.FONT}`, color: s.text2, textAlign: 'center' }}>
            And they STILL don't have: DM Inbox, Client Portal, Retention Engine, Waitlist, Aftercare Automation, or Referral Tracking.
          </div>
        </div>

        {/* ═══ SECTION 3: What we offer ═══ */}
        <div style={{ ...glass, padding: 32, marginBottom: 24 }}>
          <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 6 }}>3. What We Offer — Everything, One Platform</h2>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>Features no competitor has, marked with a star.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { name: 'Scheduling & Calendar', star: false },
              { name: 'Client Management (30+ fields)', star: false },
              { name: 'Clinical Charts (SOAP + injection/body/scalp maps)', star: true },
              { name: 'Training Programs with progress tracking', star: false },
              { name: '15 Consent Forms with e-signature', star: false },
              { name: 'Before & After Photos (face + body + scalp angles)', star: false },
              { name: 'Inventory with expiry + unit tracking', star: false },
              { name: 'Client Check-In with service-aware health check', star: true },
              { name: 'Aftercare Auto-Sequences (12 templates)', star: true },
              { name: 'DM Inbox — Instagram + Facebook + TikTok', star: true },
              { name: 'Email Marketing (6 templates, wizard)', star: false },
              { name: 'SMS Text Blasts + Individual Messages', star: false },
              { name: 'Social Media Post Creator (multi-platform)', star: false },
              { name: 'Retention Engine (lapsed client alerts)', star: true },
              { name: 'Smart Waitlist with auto-backfill', star: true },
              { name: 'Google Review Solicitation', star: true },
              { name: 'Referral Tracking + Credits', star: true },
              { name: 'Membership Wallets (unit tracking, auto-deduct)', star: true },
              { name: 'Client Wallet (gift cards, credits, loyalty)', star: true },
              { name: 'Client Portal (9-section luxury app)', star: true },
              { name: 'Online Booking (3-step premium flow)', star: false },
              { name: 'Reports + CSV Export', star: false },
              { name: 'White-Label Branding (instant color theming)', star: true },
              { name: '32 Service Types (including surgical)', star: false },
              { name: '6 Providers with specialty matching', star: false },
              { name: 'Multi-Location Support', star: false },
              { name: 'PWA — installable on any phone', star: false },
              { name: 'Payment Integration (Square/Stripe/Cherry)', star: false },
            ].map(f => (
              <div key={f.name} style={{
                padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
                background: f.star ? `${s.accent}08` : 'rgba(0,0,0,0.02)',
                border: f.star ? `1px solid ${s.accent}20` : '1px solid rgba(0,0,0,0.03)',
              }}>
                <span style={{ color: f.star ? s.accent : s.success, fontSize: 14, flexShrink: 0 }}>{f.star ? '★' : '✓'}</span>
                <span style={{ font: `${f.star ? '500' : '400'} 12px ${s.FONT}`, color: f.star ? s.text : s.text2 }}>{f.name}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, font: `400 12px ${s.FONT}`, color: s.text3 }}>★ = Features no competitor offers</div>
        </div>

        {/* ═══ SECTION 4: Our Pricing ═══ */}
        <div style={{ ...glass, padding: 32, marginBottom: 24 }}>
          <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 6 }}>4. Our Price</h2>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 24 }}>One price. Everything included. No tiers, no add-ons, no per-user fees.</p>

          <div style={{
            padding: 40, borderRadius: 20, textAlign: 'center',
            background: `linear-gradient(135deg, ${s.accent}, ${s.accent}CC)`,
            color: s.accentText, marginBottom: 24,
            boxShadow: `0 8px 40px ${s.accent}30`,
          }}>
            <div style={{ font: `500 12px ${s.MONO}`, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, opacity: 0.8 }}>Per Location / Month</div>
            <div style={{ font: `700 56px ${s.FONT}`, letterSpacing: '-2px', marginBottom: 8 }}>$1,500</div>
            <div style={{ font: `400 16px ${s.FONT}`, opacity: 0.85, marginBottom: 4 }}>Everything. Unlimited users. White-label branded.</div>
            <div style={{ font: `400 14px ${s.FONT}`, opacity: 0.65 }}>+ White-glove onboarding, data migration, staff training</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 14, background: 'rgba(0,0,0,0.03)' }}>
              <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 8 }}>Why $1,500 works</div>
              <ul style={{ font: `400 13px ${s.FONT}`, color: s.text2, lineHeight: 1.8, paddingLeft: 16 }}>
                <li>Cheaper than their current Frankenstack ($1,375 avg)</li>
                <li>Saves 20+ hours/month of admin labor</li>
                <li>Replaces 6-8 separate subscriptions</li>
                <li>12 features no competitor has</li>
                <li>One login instead of eight</li>
                <li>Client portal drives retention = more revenue</li>
              </ul>
            </div>
            <div style={{ padding: 20, borderRadius: 14, background: 'rgba(0,0,0,0.03)' }}>
              <div style={{ font: `600 15px ${s.FONT}`, color: s.text, marginBottom: 8 }}>The business math</div>
              <ul style={{ font: `400 13px ${s.FONT}`, color: s.text2, lineHeight: 1.8, paddingLeft: 16 }}>
                <li>5 clients = $90K/year (manageable)</li>
                <li>10 clients = $180K/year (real business)</li>
                <li>15 clients = $270K/year (scaling)</li>
                <li>No transaction fee complexity</li>
                <li>No payment processing liability</li>
                <li>They use their own Square/Stripe — we just connect</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 5: The pitch ═══ */}
        <div style={{ ...glass, padding: 32, marginBottom: 24 }}>
          <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 16 }}>5. The Pitch (What Tovah Says)</h2>
          <div style={{
            padding: 24, borderRadius: 16, background: 'rgba(0,0,0,0.03)',
            font: `400 15px ${s.FONT}`, color: s.text, lineHeight: 1.8, fontStyle: 'italic',
            borderLeft: `4px solid ${s.accent}`,
          }}>
            "You're paying $750 to $1,400 a month for 6 to 8 different tools that don't talk to each other, plus 25 hours a month of someone's time stitching it all together.
            <br /><br />
            I'm replacing ALL of it — plus features none of those tools have — for $1,500 a month. One platform. Your brand. Your colors. Your clients see a portal with your name, not Vagaro's.
            <br /><br />
            You save money, save time, and your clients get a better experience. Can I show you?"
          </div>
        </div>

        {/* ═══ SECTION 6: For Saleem ═══ */}
        <div style={{ ...glass, padding: 32, marginBottom: 24 }}>
          <h2 style={{ font: `600 20px ${s.FONT}`, color: s.text, marginBottom: 6 }}>6. For Saleem — Backend Buildout</h2>
          <p style={{ font: `400 14px ${s.FONT}`, color: s.text2, marginBottom: 20 }}>The front-end is 100% done. Everything works with localStorage for demos. Here's what needs AWS to go live:</p>

          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { priority: 'P0', task: 'Database (DynamoDB or RDS)', desc: 'Replace all localStorage with real persistence. The store.js has clean CRUD functions — same API, just swap localStorage for DB calls.', effort: '1-2 weeks' },
              { priority: 'P0', task: 'Auth (Cognito)', desc: 'Role-based login: admin, provider, staff, client (portal). JWT tokens. The role system is already built in the UI.', effort: '3-5 days' },
              { priority: 'P1', task: 'Square/Stripe Connect (Lambda)', desc: 'OAuth flow — training facility connects their existing account. We never touch money. Just store access tokens and fire charges through their account.', effort: '3-5 days' },
              { priority: 'P1', task: 'Twilio (SMS)', desc: 'Replace simulated text sends with real Twilio API calls. The message templates and audience targeting are all built.', effort: '2-3 days' },
              { priority: 'P1', task: 'Instagram Graph API', desc: 'Make DM Inbox real. OAuth connect to training facility IG Business account. Webhook listener for incoming DMs. Send replies via API.', effort: '1 week' },
              { priority: 'P1', task: 'Email (SES or SendGrid)', desc: 'Replace simulated email sends. Templates are built, just need delivery.', effort: '2-3 days' },
              { priority: 'P2', task: 'S3 (Photo Storage)', desc: 'Before/after photos, profile images. Upload from the existing photo UI.', effort: '2-3 days' },
              { priority: 'P2', task: 'Google Business Profile API', desc: 'Read/reply to Google reviews from within the Reviews page.', effort: '3-5 days' },
              { priority: 'P2', task: 'Push Notifications (SNS)', desc: 'Service worker is registered. Just need SNS to send push events.', effort: '2-3 days' },
              { priority: 'P3', task: 'Cherry/CareCredit API', desc: 'Embed client financing in checkout flow.', effort: '3-5 days' },
            ].map(item => (
              <div key={item.task} style={{
                display: 'grid', gridTemplateColumns: '50px 1fr auto', gap: 12, padding: '14px 18px',
                borderRadius: 12, background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(0,0,0,0.04)',
                alignItems: 'center',
              }}>
                <span style={{
                  padding: '4px 10px', borderRadius: 8, textAlign: 'center',
                  font: `600 10px ${s.MONO}`, textTransform: 'uppercase',
                  background: item.priority === 'P0' ? '#FEF2F2' : item.priority === 'P1' ? '#FFF7ED' : item.priority === 'P2' ? '#F0FDF4' : '#F5F5F5',
                  color: item.priority === 'P0' ? s.danger : item.priority === 'P1' ? s.warning : item.priority === 'P2' ? s.success : s.text3,
                }}>{item.priority}</span>
                <div>
                  <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 2 }}>{item.task}</div>
                  <div style={{ font: `400 12px ${s.FONT}`, color: s.text2 }}>{item.desc}</div>
                </div>
                <span style={{ font: `500 12px ${s.MONO}`, color: s.text3, whiteSpace: 'nowrap' }}>{item.effort}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: 16, background: `${s.accent}08`, borderRadius: 12, border: `1px solid ${s.accent}15` }}>
            <div style={{ font: `600 14px ${s.FONT}`, color: s.text, marginBottom: 6 }}>Total estimated backend buildout: 4-6 weeks</div>
            <div style={{ font: `400 13px ${s.FONT}`, color: s.text2 }}>
              P0 items (database + auth) get you a working product. P1 items (payments, SMS, IG) make it sellable. P2/P3 are polish.
              The front-end architecture is clean — store.js functions map 1:1 to API endpoints. No refactoring needed.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '32px 0', font: `400 13px ${s.FONT}`, color: s.text3 }}>
          Get Stoa LLC — Built in one night, March 2026
        </div>
      </div>
    </div>
  );
}

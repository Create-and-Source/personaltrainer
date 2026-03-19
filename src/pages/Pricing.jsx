import { useState } from 'react';
import { useStyles, useTheme } from '../theme';
import { getSettings } from '../data/store';

export default function Pricing() {
  const s = useStyles();
  const { theme } = useTheme();
  const settings = getSettings();
  const [showDetail, setShowDetail] = useState(null);

  const card = {
    background: s.surface,
    border: `1px solid ${s.border}`,
    borderRadius: 20,
    boxShadow: s.shadow,
  };

  return (
    <div style={{ minHeight: '100vh', background: s.bg, padding: '40px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: s.text3, marginBottom: 12 }}>Pricing Strategy</div>
          <h1 style={{ fontFamily: s.HEADING, fontSize: 36, fontWeight: 600, color: s.text, marginBottom: 8, letterSpacing: '-0.5px' }}>How We Got to $1,500/month</h1>
          <p style={{ fontFamily: s.FONT, fontSize: 16, color: s.text2, maxWidth: 600, margin: '0 auto' }}>Research-backed pricing for Get Stoa's personal training platform. Here's the math.</p>
        </div>

        {/* Section 1: Competitors */}
        <div style={{ ...card, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: s.HEADING, fontSize: 20, fontWeight: 600, color: s.text, marginBottom: 6 }}>1. What Competitors Charge</h2>
          <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, marginBottom: 20 }}>None of them offer what we do -- and they still charge this much.</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { name: 'Vagaro', price: '$120/mo', features: 'Booking + basic POS', missing: 'No EMR, no DM inbox, no retention' },
              { name: 'Fresha', price: 'Free (hidden fees)', features: 'Booking + basic POS', missing: 'No clinical features, charges client fees' },
              { name: 'Aesthetic Record', price: '$120/mo', features: 'EMR + charting', missing: 'No marketing, no booking UX' },
              { name: 'Mangomint', price: '$245/mo', features: 'Nice UI + booking', missing: 'No clinical depth, no DM inbox' },
              { name: 'Boulevard', price: '$425/mo', features: 'Premium booking + POS', missing: 'No DM inbox, no retention engine' },
              { name: 'Zenoti', price: '$400-800/mo', features: 'Enterprise all-in-one', missing: 'Expensive, complex, slow support' },
              { name: 'AestheticsPro', price: '$150-250/mo', features: 'EMR + marketing', missing: 'Outdated templates, clunky UX' },
            ].map(c => (
              <div key={c.name} style={{ display: 'grid', gridTemplateColumns: '140px 100px 1fr 1fr', gap: 12, padding: '12px 16px', borderRadius: 12, background: s.surface, border: `1px solid ${s.borderLight}`, alignItems: 'center' }}>
                <span style={{ fontFamily: s.HEADING, fontSize: 14, fontWeight: 600, color: s.text }}>{c.name}</span>
                <span style={{ fontFamily: s.MONO, fontSize: 14, fontWeight: 600, color: s.accent }}>{c.price}</span>
                <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2 }}>{c.features}</span>
                <span style={{ fontFamily: s.FONT, fontSize: 12, color: s.danger }}>{c.missing}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Frankenstack */}
        <div style={{ ...card, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: s.HEADING, fontSize: 20, fontWeight: 600, color: s.text, marginBottom: 6 }}>2. What Training Facilities Actually Pay Today</h2>
          <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, marginBottom: 20 }}>When you add up all the tools they juggle, plus staff time managing them:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
            {[
              { tool: 'Vagaro or Boulevard (booking + POS)', cost: '$120 - $425' },
              { tool: 'AestheticsPro or Aesthetic Record (EMR)', cost: '$120 - $250' },
              { tool: 'Mailchimp (email marketing)', cost: '$45 - $100' },
              { tool: 'SimpleTexting or Twilio (SMS)', cost: '$30 - $80' },
              { tool: 'Hootsuite or Later (social media)', cost: '$49 - $99' },
              { tool: 'Birdeye or Podium (review management)', cost: '$299 - $399' },
              { tool: 'JotForm or IntakeQ (consent forms)', cost: '$39 - $99' },
              { tool: 'Canva Pro (graphics)', cost: '$15' },
              { tool: 'Google Sheets (inventory, referrals, memberships)', cost: 'Free but 15-25 hrs/mo labor' },
              { tool: 'Instagram DMs from phone (lead management)', cost: 'Free but chaos' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <span style={{ fontFamily: s.FONT, fontSize: 13, color: s.text, padding: '8px 0', borderBottom: `1px solid ${s.borderLight}` }}>{item.tool}</span>
                <span style={{ fontFamily: s.MONO, fontSize: 13, fontWeight: 500, color: s.text, padding: '8px 0', borderBottom: `1px solid ${s.borderLight}`, textAlign: 'right' }}>{item.cost}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[{ label: 'Low End', total: '$795/mo' }, { label: 'Typical', total: '$1,375/mo' }, { label: 'High End', total: '$2,450/mo' }].map(t => (
              <div key={t.label} style={{ padding: 20, borderRadius: 14, textAlign: 'center', background: t.label === 'Typical' ? s.accent : s.surfaceAlt, color: t.label === 'Typical' ? s.accentText : s.text }}>
                <div style={{ fontFamily: s.MONO, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, opacity: 0.7 }}>{t.label}</div>
                <div style={{ fontFamily: s.HEADING, fontSize: 24, fontWeight: 600 }}>{t.total}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: What we offer */}
        <div style={{ ...card, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: s.HEADING, fontSize: 20, fontWeight: 600, color: s.text, marginBottom: 6 }}>3. What We Offer -- Everything, One Platform</h2>
          <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, marginBottom: 20 }}>Features no competitor has, marked with a star.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {[
              { name: 'Scheduling & Calendar', star: false }, { name: 'Client Management (30+ fields)', star: false },
              { name: 'Clinical Charts (SOAP + maps)', star: true }, { name: 'Training Programs with progress tracking', star: false },
              { name: '15 Consent Forms with e-signature', star: false }, { name: 'Before & After Photos', star: false },
              { name: 'Inventory with expiry tracking', star: false }, { name: 'Client Check-In', star: true },
              { name: 'Aftercare Auto-Sequences', star: true }, { name: 'DM Inbox (IG + FB + TikTok)', star: true },
              { name: 'Email Marketing (6 templates)', star: false }, { name: 'SMS Text Blasts', star: false },
              { name: 'Social Media Post Creator', star: false }, { name: 'Retention Engine', star: true },
              { name: 'Smart Waitlist', star: true }, { name: 'Google Review Solicitation', star: true },
              { name: 'Referral Tracking + Credits', star: true }, { name: 'Membership Wallets', star: true },
              { name: 'Client Portal (9-section)', star: true }, { name: 'Online Booking (3-step)', star: false },
              { name: 'Reports + CSV Export', star: false }, { name: 'White-Label Branding', star: true },
              { name: '32 Service Types', star: false }, { name: 'Multi-Location Support', star: false },
            ].map(f => (
              <div key={f.name} style={{ padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, background: f.star ? `${s.accent}08` : s.surfaceAlt, border: f.star ? `1px solid ${s.accent}20` : `1px solid ${s.borderLight}` }}>
                <span style={{ color: f.star ? s.accent : s.success, fontSize: 14, flexShrink: 0 }}>{f.star ? '\u2605' : '\u2713'}</span>
                <span style={{ fontFamily: s.FONT, fontSize: 12, fontWeight: f.star ? 500 : 400, color: f.star ? s.text : s.text2 }}>{f.name}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontFamily: s.FONT, fontSize: 12, color: s.text3 }}>{'\u2605'} = Features no competitor offers</div>
        </div>

        {/* Section 4: Our Price */}
        <div style={{ ...card, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: s.HEADING, fontSize: 20, fontWeight: 600, color: s.text, marginBottom: 6 }}>4. Our Price</h2>
          <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, marginBottom: 24 }}>One price. Everything included. No tiers, no add-ons, no per-user fees.</p>
          <div style={{ padding: 40, borderRadius: 20, textAlign: 'center', background: `linear-gradient(135deg, ${s.accent}, ${s.accent}CC)`, color: s.accentText, marginBottom: 24, boxShadow: `0 8px 40px ${s.accent}30` }}>
            <div style={{ fontFamily: s.MONO, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, opacity: 0.8 }}>Per Location / Month</div>
            <div style={{ fontFamily: s.HEADING, fontSize: 56, fontWeight: 700, letterSpacing: '-2px', marginBottom: 8 }}>$1,500</div>
            <div style={{ fontFamily: s.FONT, fontSize: 16, opacity: 0.85, marginBottom: 4 }}>Everything. Unlimited users. White-label branded.</div>
            <div style={{ fontFamily: s.FONT, fontSize: 14, opacity: 0.65 }}>+ White-glove onboarding, data migration, staff training</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 14, background: s.surfaceAlt }}>
              <div style={{ fontFamily: s.HEADING, fontSize: 15, fontWeight: 600, color: s.text, marginBottom: 8 }}>Why $1,500 works</div>
              <ul style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, lineHeight: 1.8, paddingLeft: 16 }}>
                <li>Cheaper than their current Frankenstack ($1,375 avg)</li>
                <li>Saves 20+ hours/month of admin labor</li>
                <li>Replaces 6-8 separate subscriptions</li>
                <li>12 features no competitor has</li>
                <li>Client portal drives retention = more revenue</li>
              </ul>
            </div>
            <div style={{ padding: 20, borderRadius: 14, background: s.surfaceAlt }}>
              <div style={{ fontFamily: s.HEADING, fontSize: 15, fontWeight: 600, color: s.text, marginBottom: 8 }}>The business math</div>
              <ul style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2, lineHeight: 1.8, paddingLeft: 16 }}>
                <li>5 clients = $90K/year</li>
                <li>10 clients = $180K/year</li>
                <li>15 clients = $270K/year</li>
                <li>No transaction fee complexity</li>
                <li>They use their own Square/Stripe -- we just connect</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 5: The pitch */}
        <div style={{ ...card, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: s.HEADING, fontSize: 20, fontWeight: 600, color: s.text, marginBottom: 16 }}>5. The Pitch (What Tovah Says)</h2>
          <div style={{ padding: 24, borderRadius: 16, background: s.surfaceAlt, fontFamily: s.FONT, fontSize: 15, color: s.text, lineHeight: 1.8, fontStyle: 'italic', borderLeft: `4px solid ${s.accent}` }}>
            "You're paying $750 to $1,400 a month for 6 to 8 different tools that don't talk to each other, plus 25 hours a month of someone's time stitching it all together.
            <br /><br />
            I'm replacing ALL of it -- plus features none of those tools have -- for $1,500 a month. One platform. Your brand. Your colors. Your clients see a portal with your name, not Vagaro's.
            <br /><br />
            You save money, save time, and your clients get a better experience. Can I show you?"
          </div>
        </div>

        {/* Section 6: Backend */}
        <div style={{ ...card, padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontFamily: s.HEADING, fontSize: 20, fontWeight: 600, color: s.text, marginBottom: 6 }}>6. For Saleem -- Backend Buildout</h2>
          <p style={{ fontFamily: s.FONT, fontSize: 14, color: s.text2, marginBottom: 20 }}>The front-end is 100% done. Here's what needs AWS to go live:</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { priority: 'P0', task: 'Database (DynamoDB or RDS)', desc: 'Replace all localStorage with real persistence.', effort: '1-2 weeks' },
              { priority: 'P0', task: 'Auth (Cognito)', desc: 'Role-based login: admin, provider, staff, client.', effort: '3-5 days' },
              { priority: 'P1', task: 'Square/Stripe Connect', desc: 'OAuth flow -- they connect their existing account.', effort: '3-5 days' },
              { priority: 'P1', task: 'Twilio (SMS)', desc: 'Replace simulated text sends with real Twilio calls.', effort: '2-3 days' },
              { priority: 'P1', task: 'Instagram Graph API', desc: 'Make DM Inbox real. OAuth connect to IG Business.', effort: '1 week' },
              { priority: 'P1', task: 'Email (SES or SendGrid)', desc: 'Replace simulated email sends.', effort: '2-3 days' },
              { priority: 'P2', task: 'S3 (Photo Storage)', desc: 'Before/after photos, profile images.', effort: '2-3 days' },
              { priority: 'P2', task: 'Google Business Profile API', desc: 'Read/reply to Google reviews.', effort: '3-5 days' },
              { priority: 'P2', task: 'Push Notifications (SNS)', desc: 'Service worker is registered. Just need SNS.', effort: '2-3 days' },
              { priority: 'P3', task: 'Cherry/CareCredit API', desc: 'Embed client financing in checkout.', effort: '3-5 days' },
            ].map(item => (
              <div key={item.task} style={{ display: 'grid', gridTemplateColumns: '50px 1fr auto', gap: 12, padding: '14px 18px', borderRadius: 12, background: s.surface, border: `1px solid ${s.borderLight}`, alignItems: 'center' }}>
                <span style={{ padding: '4px 10px', borderRadius: 8, textAlign: 'center', fontFamily: s.MONO, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', background: item.priority === 'P0' ? s.dangerBg : item.priority === 'P1' ? s.warningBg : item.priority === 'P2' ? s.successBg : s.surfaceAlt, color: item.priority === 'P0' ? s.danger : item.priority === 'P1' ? s.warning : item.priority === 'P2' ? s.success : s.text3 }}>{item.priority}</span>
                <div>
                  <div style={{ fontFamily: s.HEADING, fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 2 }}>{item.task}</div>
                  <div style={{ fontFamily: s.FONT, fontSize: 12, color: s.text2 }}>{item.desc}</div>
                </div>
                <span style={{ fontFamily: s.MONO, fontSize: 12, fontWeight: 500, color: s.text3, whiteSpace: 'nowrap' }}>{item.effort}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: 16, background: s.accentLight, borderRadius: 12, border: `1px solid ${s.accent}15` }}>
            <div style={{ fontFamily: s.HEADING, fontSize: 14, fontWeight: 600, color: s.text, marginBottom: 6 }}>Total estimated backend buildout: 4-6 weeks</div>
            <div style={{ fontFamily: s.FONT, fontSize: 13, color: s.text2 }}>P0 items (database + auth) get you a working product. P1 items make it sellable. P2/P3 are polish.</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '32px 0', fontFamily: s.FONT, fontSize: 13, color: s.text3 }}>
          Get Stoa LLC -- Built in one night, March 2026
        </div>
      </div>
    </div>
  );
}

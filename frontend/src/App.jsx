import { useState, useEffect } from 'react';
import ScaleQuestion from './components/ScaleQuestion';
import EnergySlider from './components/EnergySlider';
import TextQuestion from './components/TextQuestion';
import { loadState, saveState, getPhase, msRemaining } from './formState';

const RELIABILITY_ANCHORS = [
  'Missed deadlines or commitments with no heads-up.',
  'Hit most commitments but dropped the ball on key ones.',
  'Reliable most of the time; minor slips with no real impact.',
  'Consistently delivered; proactively flagged risks early.',
];

const RECEPTIVITY_ANCHORS = [
  'Got defensive, dismissed feedback, or shut down the conversation.',
  'Listened but usually pushed my agenda without real acknowledgment.',
  'Stayed open; occasionally let ego surface under pressure.',
  'Actively sought opposing views, integrated feedback without ego.',
];

const initialState = {
  name: '',
  showName: false,
  reliability_rating: null,
  reliability_comment: '',
  receptivity_rating: null,
  receptivity_comment: '',
  energy_rating: 3,
  blind_spot: '',
  future_skill: '',
};

const ENERGY_LABELS = ['Consistently drained', 'Somewhat drained', 'Somewhat energized', 'Consistently energized'];
const RATING_LABELS = ['Rarely/Never', 'Sometimes', 'Often', 'Consistently/Always'];

function buildMailtoUrl(form) {
  const r = (n) => n ? RATING_LABELS[n - 1] : '(not answered)';
  const lines = [
    'I ran into a technical issue submitting my farewell feedback through the form.',
    'Here are my responses:',
    '',
    `Q1 — Reliability: ${r(form.reliability_rating)}`,
    form.reliability_comment ? `   → ${form.reliability_comment}` : '',
    '',
    `Q2 — Receptivity: ${r(form.receptivity_rating)}`,
    form.receptivity_comment ? `   → ${form.receptivity_comment}` : '',
    '',
    `Q3 — Energy: ${ENERGY_LABELS[(form.energy_rating || 3) - 1]}`,
    '',
    `Q4 — Blind Spot: ${form.blind_spot || '(not answered)'}`,
    '',
    `Q5 — Future Skill: ${form.future_skill || '(not answered)'}`,
    '',
    `From: ${form.showName && form.name.trim() ? form.name.trim() : 'Anonymous'}`,
  ].filter(Boolean).join('\n');

  return `https://mail.google.com/mail/?view=cm&to=somashaker23%40gmail.com&su=${encodeURIComponent('Farewell Feedback Note')}&body=${encodeURIComponent(lines)}`;
}

export default function App() {
  const [storedState, setStoredState] = useState(() => loadState());
  const phase = getPhase(storedState);

  const [form, setForm] = useState(() =>
    (phase === 'EDITING' || phase === 'SUBMITTED_EDITABLE') && storedState?.data
      ? { ...initialState, ...storedState.data }
      : initialState
  );
  const [errors, setErrors] = useState({});
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!loading) { setDots(''); return; }
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 450);
    return () => clearInterval(id);
  }, [loading]);

  const set = (field, value) => setForm(f => {
    const next = { ...f, [field]: value };
    saveState({ status: 'editing', data: next });
    return next;
  });

  const validate = () => {
    const errs = {};
    if (!form.reliability_rating) errs.reliability_rating = 'Please select a rating.';
    if (form.reliability_rating <= 2 && !form.reliability_comment.trim())
      errs.reliability_comment = 'A comment is required for this score.';
    if (!form.receptivity_rating) errs.receptivity_rating = 'Please select a rating.';
    if (form.receptivity_rating <= 2 && !form.receptivity_comment.trim())
      errs.receptivity_comment = 'A comment is required for this score.';
    if (!form.blind_spot.trim() || form.blind_spot.trim().length < 5)
      errs.blind_spot = 'Please write at least a few words.';
    if (!form.future_skill.trim() || form.future_skill.trim().length < 5)
      errs.future_skill = 'Please write at least a few words.';
    if (form.showName && !form.name.trim())
      errs.name = 'Enter your name or uncheck the box.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setShowEmailFallback(false);

    const submittedAt = storedState?.submittedAt ?? Date.now();
    const id = storedState?.id ?? crypto.randomUUID();

    const payload = {
      submission_id: id,
      name: form.showName ? form.name.trim() || null : null,
      reliability_rating: form.reliability_rating,
      reliability_comment: form.reliability_comment.trim() || null,
      receptivity_rating: form.receptivity_rating,
      receptivity_comment: form.receptivity_comment.trim() || null,
      energy_rating: form.energy_rating,
      blind_spot: form.blind_spot.trim(),
      future_skill: form.future_skill.trim(),
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const next = saveState({ status: 'submitted', submittedAt });
        setStoredState(next);
      } else {
        const body = await res.json().catch(() => ({}));
        console.error('[Feedback] Submit failed:', body.detail || res.status);
        setShowEmailFallback(true);
      }
    } catch (err) {
      console.error('[Feedback] Network error:', err);
      setShowEmailFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    const fresh = loadState();
    if (getPhase(fresh) !== 'SUBMITTED_EDITABLE') {
      setStoredState(fresh);
      return;
    }
    const next = saveState({ status: 'editing' });
    setForm({ ...initialState, ...fresh.data });
    setStoredState(next);
  };

  if (phase === 'SUBMITTED_LOCKED') {
    return (
      <div style={styles.card}>
        <div style={styles.successIcon}>🙌</div>
        <p style={styles.successText}>Thank you so much!</p>
        <p style={styles.successSub}>
          Your note has been saved. Come back tomorrow if you&apos;d like to update it.
        </p>
      </div>
    );
  }

  if (phase === 'SUBMITTED_EDITABLE') {
    const mins = Math.ceil(msRemaining(storedState) / 60000);
    return (
      <div style={styles.card}>
        <div style={styles.successIcon}>✏️</div>
        <p style={styles.successText}>You&apos;ve already submitted today.</p>
        <p style={styles.successSub}>
          Edit window closes in {mins} minute{mins !== 1 ? 's' : ''}.
        </p>
        <button onClick={handleEdit} style={{ ...styles.button, marginTop: 24 }}>
          Edit my response
        </button>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Leave a note for Your Name</h2>
      <p style={styles.subtitle}>
        As I move on to my next chapter, I&apos;d love your honest thoughts.
      </p>

      <form onSubmit={handleSubmit} noValidate>

        <ScaleQuestion
          question="Q1 — When we worked together, how confident were you in my ability to deliver on my promises?"
          anchors={RELIABILITY_ANCHORS}
          value={form.reliability_rating}
          onChange={v => { set('reliability_rating', v); set('reliability_comment', ''); }}
          comment={form.reliability_comment}
          onCommentChange={v => set('reliability_comment', v)}
        />
        {errors.reliability_rating && <p style={styles.fieldError}>{errors.reliability_rating}</p>}
        {errors.reliability_comment && <p style={styles.fieldError}>{errors.reliability_comment}</p>}

        <ScaleQuestion
          question="Q2 — How receptive was I to criticism or new ideas that differed from my own?"
          anchors={RECEPTIVITY_ANCHORS}
          value={form.receptivity_rating}
          onChange={v => { set('receptivity_rating', v); set('receptivity_comment', ''); }}
          comment={form.receptivity_comment}
          onCommentChange={v => set('receptivity_comment', v)}
        />
        {errors.receptivity_rating && <p style={styles.fieldError}>{errors.receptivity_rating}</p>}
        {errors.receptivity_comment && <p style={styles.fieldError}>{errors.receptivity_comment}</p>}

        <EnergySlider
          value={form.energy_rating}
          onChange={v => set('energy_rating', v)}
        />

        <TextQuestion
          question="Q4 — If I could change exactly ONE behavior to be a better teammate, what should it be?"
          value={form.blind_spot}
          onChange={v => set('blind_spot', v)}
          error={errors.blind_spot}
        />

        <TextQuestion
          question="Q5 — What is one skill I absolutely must develop to succeed at a higher level?"
          value={form.future_skill}
          onChange={v => set('future_skill', v)}
          error={errors.future_skill}
        />

        <div style={styles.nameToggle}>
          <label style={styles.nameLabel}>
            <input
              type="checkbox"
              checked={form.showName}
              onChange={e => set('showName', e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Share my name (anonymous by default)
          </label>
          {form.showName && (
            <input
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              maxLength={50}
              style={styles.nameInput}
            />
          )}
          {errors.name && <p style={styles.fieldError}>{errors.name}</p>}
        </div>

        {showEmailFallback && (
          <div style={styles.emailFallback}>
            <p style={styles.emailFallbackMsg}>Something went wrong on our end.</p>
            <a href={buildMailtoUrl(form)} target="_blank" rel="noopener noreferrer" style={styles.emailBtn}>
              Send your feedback via email instead →
            </a>
          </div>
        )}

        {loading && (
          <p style={styles.loadingMsg}>
            Saving your note to the server{dots}
          </p>
        )}

        <button type="submit" disabled={loading} style={{ ...styles.button, ...(loading ? styles.buttonLoading : {}) }}>
          {loading ? `Sending${dots}` : 'Send Farewell Note'}
        </button>
      </form>

      <p style={styles.privacy}>🔒 This runs on a private machine. No data is sent to the internet.</p>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff', borderRadius: 16, padding: '40px 36px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.07)', width: '100%', maxWidth: 640,
  },
  heading: { fontSize: 22, fontWeight: 700, color: '#2c3e50', marginBottom: 6, marginTop: 0 },
  subtitle: { color: '#7f8c8d', fontSize: 14, marginBottom: 32 },
  fieldError: { color: '#e74c3c', fontSize: 13, marginTop: -8, marginBottom: 16 },
  nameToggle: { marginBottom: 24, fontSize: 14, color: '#7f8c8d' },
  nameLabel: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  nameInput: {
    marginTop: 8, padding: '8px 10px', width: '100%', border: '1px solid #ddd',
    borderRadius: 6, fontFamily: 'inherit', fontSize: 14,
  },
  emailFallback: { background: '#fff8f8', border: '1px solid #fcd0d0', borderRadius: 8, padding: '14px 16px', marginBottom: 14, textAlign: 'center' },
  emailFallbackMsg: { color: '#c0392b', fontSize: 13, margin: '0 0 10px' },
  emailBtn: { display: 'inline-block', background: '#c0392b', color: '#fff', borderRadius: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  button: {
    width: '100%', padding: '14px 0', background: '#3498db', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.2s, opacity 0.2s',
  },
  buttonLoading: { opacity: 0.7, cursor: 'not-allowed' },
  loadingMsg: { textAlign: 'center', fontSize: 13, color: '#7f8c8d', marginBottom: 10 },
  privacy: { fontSize: 12, color: '#bdc3c7', marginTop: 16, textAlign: 'center' },
  successIcon: { fontSize: 52, marginBottom: 12 },
  successText: { color: '#27ae60', fontSize: 20, fontWeight: 700, margin: '0 0 8px' },
  successSub: { color: '#7f8c8d', fontSize: 15 },
};

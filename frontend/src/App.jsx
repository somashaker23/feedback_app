import { useState } from 'react';
import ScaleQuestion from './components/ScaleQuestion';
import EnergySlider from './components/EnergySlider';
import TextQuestion from './components/TextQuestion';

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

export default function App() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

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
    setSubmitError('');

    const payload = {
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
        setSubmitted(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setSubmitError(body.detail || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Make sure you are on the same network.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.card}>
        <div style={styles.successIcon}>🙌</div>
        <p style={styles.successText}>Thank you so much!</p>
        <p style={styles.successSub}>
          I really appreciate you taking the time to write this. It means a lot to me.
        </p>
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

        {submitError && <p style={styles.submitError}>{submitError}</p>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Sending…' : 'Send Farewell Note'}
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
  submitError: { color: '#e74c3c', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  button: {
    width: '100%', padding: '14px 0', background: '#3498db', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.2s',
  },
  privacy: { fontSize: 12, color: '#bdc3c7', marginTop: 16, textAlign: 'center' },
  successIcon: { fontSize: 52, marginBottom: 12 },
  successText: { color: '#27ae60', fontSize: 20, fontWeight: 700, margin: '0 0 8px' },
  successSub: { color: '#7f8c8d', fontSize: 15 },
};

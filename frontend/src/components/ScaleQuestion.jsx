const LABELS = ['Poor', 'Inconsistent', 'Good', 'Excellent'];

export default function ScaleQuestion({ question, anchors, value, onChange, comment, onCommentChange }) {
  const isLowScore = value !== null && value <= 2;

  return (
    <div style={styles.block}>
      <p style={styles.question}>{question}</p>

      <div style={styles.options}>
        {anchors.map((anchor, i) => {
          const rating = i + 1;
          const selected = value === rating;
          return (
            <label key={rating} style={{ ...styles.option, ...(selected ? styles.optionSelected : {}) }}>
              <input
                type="radio"
                name={question}
                value={rating}
                checked={selected}
                onChange={() => onChange(rating)}
                style={{ display: 'none' }}
              />
              <span style={styles.badge}>{rating} — {LABELS[i]}</span>
              <span style={styles.anchor}>{anchor}</span>
            </label>
          );
        })}
      </div>

      {value !== null && (
        <div style={styles.commentBlock}>
          <label style={styles.commentLabel}>
            {isLowScore
              ? 'Help me understand — what caused this score? (required)'
              : 'Optional: a specific example where I did this well.'}
          </label>
          <textarea
            value={comment}
            onChange={e => onCommentChange(e.target.value)}
            rows={3}
            placeholder={isLowScore ? 'Please share a specific situation…' : 'Feel free to skip…'}
            style={styles.textarea}
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  block: { marginBottom: 32 },
  question: { fontWeight: 600, fontSize: 15, color: '#2c3e50', marginBottom: 12, lineHeight: 1.4 },
  options: { display: 'flex', flexDirection: 'column', gap: 8 },
  option: {
    display: 'flex', flexDirection: 'column', gap: 2,
    border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px',
    cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
    background: '#fafafa',
  },
  optionSelected: { borderColor: '#3498db', background: '#eaf4fd' },
  badge: { fontWeight: 600, fontSize: 14, color: '#2c3e50' },
  anchor: { fontSize: 13, color: '#7f8c8d', lineHeight: 1.3 },
  commentBlock: { marginTop: 12 },
  commentLabel: { display: 'block', fontSize: 13, fontWeight: 600, color: '#34495e', marginBottom: 6 },
  textarea: {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8,
    fontFamily: 'inherit', fontSize: 14, resize: 'vertical', outline: 'none',
    transition: 'border-color 0.2s',
  },
};

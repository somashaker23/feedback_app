export default function TextQuestion({ question, value, onChange, error }) {
  return (
    <div style={styles.block}>
      <label style={styles.label}>{question}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        style={{ ...styles.textarea, ...(error ? styles.textareaError : {}) }}
      />
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  block: { marginBottom: 32 },
  label: { display: 'block', fontWeight: 600, fontSize: 15, color: '#2c3e50', marginBottom: 8 },
  textarea: {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8,
    fontFamily: 'inherit', fontSize: 14, resize: 'vertical', outline: 'none',
    transition: 'border-color 0.2s',
  },
  textareaError: { borderColor: '#e74c3c' },
  error: { color: '#e74c3c', fontSize: 13, marginTop: 4 },
};

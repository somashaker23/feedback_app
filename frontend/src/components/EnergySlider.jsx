const LABELS = ['Consistently drained', 'Somewhat drained', 'Somewhat energized', 'Consistently energized'];

export default function EnergySlider({ value, onChange }) {
  return (
    <div style={styles.block}>
      <p style={styles.question}>Working with me generally affected your energy like this:</p>
      <input
        type="range"
        min={1}
        max={4}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={styles.slider}
      />
      <div style={styles.ticks}>
        {LABELS.map((label, i) => (
          <span key={i} style={{ ...styles.tick, ...(value === i + 1 ? styles.tickActive : {}) }}>
            {label}
          </span>
        ))}
      </div>
      <p style={styles.current}>{LABELS[value - 1]}</p>
    </div>
  );
}

const styles = {
  block: { marginBottom: 32 },
  question: { fontWeight: 600, fontSize: 15, color: '#2c3e50', marginBottom: 12 },
  slider: { width: '100%', accentColor: '#3498db', cursor: 'pointer' },
  ticks: { display: 'flex', justifyContent: 'space-between', marginTop: 4 },
  tick: { fontSize: 11, color: '#bdc3c7', textAlign: 'center', width: '25%' },
  tickActive: { color: '#3498db', fontWeight: 600 },
  current: { textAlign: 'center', fontWeight: 600, fontSize: 14, color: '#2c3e50', marginTop: 6 },
};

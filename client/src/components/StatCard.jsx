export default function StatCard({ label, value, icon = 'bi-people', tone = 'blue' }) {
  return <div className="stat-card">
    <div>
      <div className="small text-secondary">
        {label}
      </div>
      <div className="stat-number">
        {value}
      </div>
    </div>
    <div className={`stat-icon tone-${tone}`}>
      <i className={`bi ${icon}`} />
    </div>
  </div>;
}

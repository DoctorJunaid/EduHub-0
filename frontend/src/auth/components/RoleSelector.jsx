export default function RoleSelector({ options, value, onChange, name = 'role', className = '' }) {
  return <fieldset className={`signup-roles ${className}`}><legend className="sr-only">Account role</legend>
    {options.map(([role, label, Icon]) => <label key={role} className={`signup-role${value === role ? ' is-selected' : ''}`}>
      <input type="radio" name={name} value={role} checked={value === role} onChange={() => onChange(role)} required />
      <Icon size={27} aria-hidden="true" /><span>{label}</span>
    </label>)}
  </fieldset>;
}

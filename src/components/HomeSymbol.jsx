export default function HomeSymbol({ name, className = '' }) {
  return <span aria-hidden="true" className={`home-symbol ${className}`}>{name}</span>
}

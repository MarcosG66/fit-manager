import logo from '../assets/logo.png';
export default function Brand({ light = false }) {
  return <div className={`brand d-inline-flex align-items-center gap-2 ${light ? 'text-white' : ''}`}>
    <img src={logo} alt="" className="brand-logo" />
    <span>FitManager</span>
  </div>;
}

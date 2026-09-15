import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { loginUser } from '@/store/Slices/authSlice';
import { roleHome } from './roles';
import { Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";
import './Login.css';

const roles = [
  ['super_admin',     'Super Admin'],
  ['campus_admin',    'Campus Admin'],
  ['institute_admin', 'Institute Admin'],
  ['student',         'Student'],
];

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [values, setValues]   = useState({ email: 'admin@smitlms.com', password: 'password', role: 'super_admin' });
  const [errors, setErrors]   = useState({});
  const [remember, setRemember] = useState(false);

  const change = (field, value) => {
    setValues(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.email.trim())    next.email    = 'Email is required';
    if (!values.password.trim()) next.password = 'Password is required';
    setErrors(next);
    if (Object.keys(next).length) return;
    
    try {
      // Dispatch real backend login
      const resultAction = await dispatch(loginUser({ email: values.email, password: values.password })).unwrap();
      
      const home = roleHome(resultAction.role);
      if (!home) { 
        toast.error(`Role ${resultAction.role} workspace is pending.`); 
        return; 
      }
      
      navigate(home, { replace: true });
    } catch (err) {
      const msg = typeof err === 'string' ? err : (err?.message || 'Login failed. Please check credentials.');
      toast.error(msg);
    }
  };

  return (
    <div className="login-page">

      {/* ════════════════════
          LEFT — Form
      ════════════════════ */}
      <div className="lp-left">
        <div className="lp-left-inner">


          <h1>Login</h1>

          <form onSubmit={submit} noValidate className="lp-form">

            {/* Email */}
            <div className="lp-field">
              <label htmlFor="lp-email" className="lp-label">Email Address</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon"><Mail size={15} /></span>
                <input
                  id="lp-email"
                  type="email"
                  autoComplete="email"
                  placeholder="johndoe@gmail.com"
                  value={values.email}
                  onChange={e => change('email', e.target.value)}
                />
              </div>
              {errors.email && <p className="lp-error">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="lp-field">
              <label htmlFor="lp-password" className="lp-label">Password</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon"><Lock size={15} /></span>
                <input
                  id="lp-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={e => change('password', e.target.value)}
                />
              </div>
              {errors.password && <p className="lp-error">{errors.password}</p>}
            </div>

            {/* Role selector */}
            <div>
              <div className="lp-roles-label">Demo Role</div>
              <div className="lp-roles-grid">
                {roles.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`lp-role-btn${values.role === id ? ' selected' : ''}`}
                    onClick={() => change('role', id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Remember me */}
            <div
              className="lp-remember"
              role="checkbox"
              aria-checked={remember}
              tabIndex={0}
              onClick={() => setRemember(r => !r)}
              onKeyDown={e => e.key === ' ' && setRemember(r => !r)}
            >
              <div className={`lp-checkbox${remember ? ' checked' : ''}`}>
                {remember && (
                  <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="lp-remember-label">Remember me</span>
            </div>

            <button type="submit" className="lp-submit">Login</button>
          </form>

          {/* Footer links */}
          <div className="lp-footer">
            <p>
              New student?{' '}
              <Link to="/signup">Sign up</Link>
            </p>
            <span style={{ cursor: 'pointer' }}>Forgot Password?</span>
          </div>


        </div>
      </div>

      {/* ════════════════════
          RIGHT — Showcase
      ════════════════════ */}
      <div className="lp-right">
        <div className="lp-right-inner">

          {/* Subtle dot accents */}
          <div style={{ position: 'absolute', top: '4rem', right: '5rem', width: 3, height: 3, borderRadius: '50%', background: '#fff', opacity: 0.18, pointerEvents: 'none', zIndex: 3 }} />
          <div style={{ position: 'absolute', top: '9rem', right: '28%', width: 2, height: 2, borderRadius: '50%', background: '#60a5fa', opacity: 0.15, pointerEvents: 'none', zIndex: 3 }} />
          <div style={{ position: 'absolute', bottom: '37%', right: '3.5rem', width: 4, height: 4, borderRadius: '50%', background: '#10b981', opacity: 0.12, filter: 'blur(2px)', pointerEvents: 'none', zIndex: 3 }} />

          {/* Giant E */}
          <div className="lp-giant-e">
            <span>E</span>
          </div>

          {/* Text */}
          <div className="lp-panel-text">
            <p className="lp-panel-brand">EduHub</p>
            <h2>Discover. Learn.<br />Connect.</h2>
            <p>
              EduHub is the centralized management platform for college and school administration. Access dashboards, academic data, and multi-school modules. Streamline your institution today.
            </p>
            <small>Supporting over 500+ institutions, and counting</small>
          </div>

          {/* Floating card */}
          <div className="lp-card">
            <div>
              <h3>Your Unified Educational Ecosystem</h3>
              <p>Access the easiest way to manage, collaborate, and excel in modern education.</p>
            </div>
            <div className="lp-avatars">
              {[11, 12, 13].map(i => (
                <div key={i} className="lp-avatar">
                  <img src={`https://i.pravatar.cc/68?img=${i}`} alt="" />
                </div>
              ))}
              <div className="lp-avatar-count">+42</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

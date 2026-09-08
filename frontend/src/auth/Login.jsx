import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { demoLoggedIn } from '@/store/Slices/authSlice';
import { roleHome } from './roles';
import { Mail, UserRound, Building2, Landmark, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from '@/components/ui/alert';
import RoleSelector from './components/RoleSelector';
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import PasswordInput from "@/components/common/PasswordInput";
import AuthLayout from "./components/AuthLayout";
import { validateLogin } from "./signupValidation";

const roles = [['super-admin', 'Super Admin', UserRound], ['campus-admin', 'Campus Admin', Building2], ['institute-admin', 'Institute Admin', Landmark], ['student', 'Student', UserRound]];

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: "", password: "", role: 'super-admin' });
  const roleLabel = roles.find(([id]) => id === values.role)?.[1];
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const change = (field, value) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setNotice("");
  };
  const submit = (event) => {
    event.preventDefault();
    const next = validateLogin(values);
    setErrors(next);
    setValues((previous) => ({ ...previous, email: previous.email.trim() }));
    if (Object.keys(next).length) {
      setNotice("");
      document.getElementById(`login-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    const home = roleHome(values.role);
    if (!home) { setNotice(`${roleLabel} workspace is pending approval. Choose Campus Admin to enter the available demo.`); return; }
    dispatch(demoLoggedIn({ email: values.email, role: values.role }));
    navigate(home, { replace: true });
  };
  const props = (field) => ({
    id: `login-${field}`,
    name: field,
    required: true,
    value: values[field],
    onChange: (event) => change(field, event.target.value),
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `login-${field}-error` : undefined,
  });
  return (
    <AuthLayout
      login
      eyebrow="SCHOOL ACCESS"
      title="Welcome back"
      subtitle="Select your role to continue to the right workspace."
    >
      <form noValidate onSubmit={submit} className="login-form">
        <RoleSelector options={roles} value={values.role} onChange={(role) => change('role', role)} className="login-roles" />
        <div className="signup-field">
          <Label htmlFor="login-email">Email address</Label>
          <div className="signup-icon-input">
            <Mail size={18} aria-hidden="true" />
            <Input
              {...props("email")}
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
            />
          </div>
          {errors.email && (
            <p className="signup-error" id="login-email-error">
              {errors.email}
            </p>
          )}
        </div>
        <div className="signup-field">
          <Label htmlFor="login-password">Password</Label>
          <PasswordInput
            {...props("password")}
            label="password"
            autoComplete="current-password"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="signup-error" id="login-password-error">
              {errors.password}
            </p>
          )}
        </div>
        <Alert className="login-demo" role="note"><ShieldCheck aria-hidden="true" /><AlertDescription>Demo mode: no account or payment details are sent anywhere.</AlertDescription></Alert>
        <Button type="submit" className="signup-submit">
          Continue as {roleLabel}
        </Button>
        <p className="signup-notice" role="status">
          {notice}
        </p>
        <div className="signup-divider"><span>OR</span></div>
        <Button type="button" variant="outline" className="signup-google" disabled title="Google sign-in is not configured"><span className="signup-google-mark" aria-hidden="true">G</span>Continue with Google</Button>
        <p className="login-footer">
          <span className="signup-unavailable-link" aria-disabled="true" title="Password reset is not configured">Forgot password?</span>
          <Link className="signup-link" to="/signup">
            Create account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

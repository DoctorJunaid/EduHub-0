import RoleSelector from './components/RoleSelector';
import { useState } from "react";
import { Building2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/common/PasswordInput";
import { validateSignup } from "./signupValidation";
import AuthLayout from "./components/AuthLayout";
import { Link } from "react-router-dom";

export default function Signup() {
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "institute-admin",
  });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const change = (field, value) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
      ...(field === "password" ? { confirmPassword: undefined } : {}),
    }));
    setNotice("");
  };
  const submit = (event) => {
    event.preventDefault();
    const next = validateSignup(values);
    setErrors(next);
    setValues((previous) => ({
      ...previous,
      fullName: previous.fullName.trim(),
      email: previous.email.trim(),
    }));
    if (Object.keys(next).length) {
      setNotice("");
      document.getElementById(`signup-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    setNotice(
      "Your form is valid. Account creation is not connected yet; no account has been created.",
    );
  };
  const fieldProps = (field) => ({
    id: `signup-${field}`,
    name: field,
    value: values[field],
    onChange: (event) => change(field, event.target.value),
    required: true,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field]
      ? `signup-${field}-error`
      : field === "password"
        ? "signup-password-hint"
        : undefined,
  });
  const error = (field) =>
    errors[field] && (
      <p className="signup-error" id={`signup-${field}-error`}>
        {errors[field]}
      </p>
    );

  return (
    <AuthLayout
      eyebrow="CREATE ACCOUNT"
      title="Create your account"
      subtitle="Choose a path to begin your EduHub journey."
    >
      <form noValidate onSubmit={submit}>
        <RoleSelector options={[["institute-admin", "Institute Admin", Building2], ["student", "Student", UserRound]]} value={values.role} onChange={(role) => change("role", role)} />
        {error("role")}
        <div className="signup-field">
          <Label htmlFor="signup-fullName">Full name</Label>
          <div className="signup-icon-input">
            <UserRound size={18} aria-hidden="true" />
            <Input
              {...fieldProps("fullName")}
              autoComplete="name"
              placeholder="Enter your full name"
            />
          </div>
          {error("fullName")}
        </div>
        <div className="signup-field">
          <Label htmlFor="signup-email">Email address</Label>
          <div className="signup-icon-input">
            <Mail size={18} aria-hidden="true" />
            <Input
              {...fieldProps("email")}
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
            />
          </div>
          {error("email")}
        </div>
        <div className="signup-field">
          <Label htmlFor="signup-password">Password</Label>
          <PasswordInput
            {...fieldProps("password")}
            label="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="Create a password"
          />
          <span id="signup-password-hint" className="signup-password-hint">
            Use at least 8 characters.
          </span>
          {error("password")}
        </div>
        <div className="signup-field">
          <Label htmlFor="signup-confirmPassword">Confirm password</Label>
          <PasswordInput
            {...fieldProps("confirmPassword")}
            label="confirm password"
            autoComplete="new-password"
            placeholder="Confirm your password"
          />
          {error("confirmPassword")}
        </div>
        <div className="signup-terms">
          <ShieldCheck size={22} aria-hidden="true" />
          <p>
            By creating an account, you agree to our{" "}
            <span
              className="signup-unavailable-link"
              aria-disabled="true"
              title="Terms of Use destination pending"
            >
              Terms of Use
            </span>{" "}
            and{" "}
            <span
              className="signup-unavailable-link"
              aria-disabled="true"
              title="Privacy Policy destination pending"
            >
              Privacy Policy
            </span>
            .
          </p>
        </div>
        <Button className="signup-submit" type="submit">
          Create my account
        </Button>
        <p className="signup-notice" role="status">
          {notice}
        </p>
        <div className="signup-divider">
          <span>OR</span>
        </div>
        <Button
          type="button"
          variant="outline"
          className="signup-google"
          disabled
          title="Google sign-in is not configured"
        >
          <span className="signup-google-mark" aria-hidden="true">
            G
          </span>
          Continue with Google
        </Button>
        <p className="signup-signin">
          Already have an account?{" "}
          <Link className="signup-link" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

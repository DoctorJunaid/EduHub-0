export function validateLogin(values) {
  const errors = {};
  if (!values.email.trim()) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "Enter a valid email address.";
  if (!values.password) errors.password = "Enter your password.";
  return errors;
}

export function validateSignup(values) {
  const errors = {};
  if (!values.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!values.email.trim()) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "Enter a valid email address.";
  if (!values.password) errors.password = "Create a password.";
  else if (values.password.length < 8)
    errors.password = "Use at least 8 characters.";
  if (!values.confirmPassword)
    errors.confirmPassword = "Confirm your password.";
  else if (values.confirmPassword !== values.password)
    errors.confirmPassword = "Passwords must match.";
  if (!["institute-admin", "student"].includes(values.role))
    errors.role = "Choose a signup role.";
  return errors;
}

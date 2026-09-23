import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';

export default function PasswordInput({ label, ...props }) {
  const [visible, setVisible] = useState(false);
  return <div className="password-input relative">
    <LockKeyhole size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
    <Input {...props} type={visible ? 'text' : 'password'} className="pl-11 pr-12" />
    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2" aria-label={`${visible ? 'Hide' : 'Show'} ${label}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </Button>
  </div>;
}

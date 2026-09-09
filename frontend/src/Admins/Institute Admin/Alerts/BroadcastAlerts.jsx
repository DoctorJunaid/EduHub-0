import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Info, TriangleAlert, CircleAlert, FileText, Send, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { selectInstituteCampuses } from '@/store/Slices/campusesSlice';
import { selectInstituteStudents } from '@/store/selectors/instituteStudents';
import { selectCurrentUser } from '@/store/Slices/authSlice';
import { broadcastSaved } from '@/store/Slices/broadcastsSlice';
import { selectInstituteFaculty } from '../Staff/staffData';
import { audienceOptions, severities, validateBroadcast } from './broadcastData';
import './BroadcastAlerts.css';

const icons = { Info, Warning: TriangleAlert, Critical: CircleAlert };
export default function BroadcastAlerts() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const campuses = useSelector(selectInstituteCampuses);
  const students = useSelector(selectInstituteStudents);
  const faculty = useSelector(selectInstituteFaculty);
  const options = audienceOptions(campuses, students, faculty);
  const [audience, setAudience] = useState('all');
  const [severity, setSeverity] = useState('Info');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState(null);
  useEffect(() => {
    if (!feedback || feedback.error) return;
    const timer = setTimeout(() => setFeedback(null), 6000);
    return () => clearTimeout(timer);
  }, [feedback]);
  function submit(event) {
    event.preventDefault();
    const error = validateBroadcast({ audience, severity, message }, options);
    if (error) { setFeedback({ error: true, text: error }); return; }
    dispatch(broadcastSaved({ audience, severity, message, createdBy: user.id }));
    setMessage('');
    setAudience('all');
    setSeverity('Info');
    setFeedback({ error: false, text: 'Broadcast saved successfully. Demo only; no notifications were delivered.' });
  }
  return <section className="institute-broadcast">
    <div className="iba-heading"><h1>Broadcast Alerts</h1><p>Create alerts for staff and students across your campuses.</p></div>
    <Card className="iba-card">
      <form onSubmit={submit} noValidate>
        <div className="iba-field">
          <Label htmlFor="broadcast-audience">Target Audience</Label>
          <Select value={audience} onValueChange={(value) => { setAudience(value); setFeedback(null); }}>
            <SelectTrigger id="broadcast-audience" className="iba-select" aria-required="true"><Users aria-hidden="true" /><SelectValue placeholder="Select audience" /></SelectTrigger>
            <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <fieldset className="iba-field"><legend>Alert Severity</legend><div className="iba-severities">
          {severities.map((value) => { const Icon = icons[value]; return <label key={value} className={`iba-severity iba-${value.toLowerCase()} ${severity === value ? 'is-selected' : ''}`}>
            <Icon aria-hidden="true" /><span>{value}</span><input type="radio" name="severity" value={value} checked={severity === value} onChange={() => { setSeverity(value); setFeedback(null); }} />
          </label>; })}
        </div></fieldset>
        <div className="iba-field"><Label htmlFor="broadcast-message">Message Content</Label><div className="iba-message"><FileText aria-hidden="true" /><Textarea id="broadcast-message" placeholder="Type your alert message here..." value={message} onChange={(event) => { setMessage(event.target.value); setFeedback(null); }} aria-required="true" aria-invalid={feedback?.error || undefined} aria-describedby={feedback ? 'broadcast-feedback' : undefined} /></div></div>
        {feedback && <Alert id="broadcast-feedback" className={feedback.error ? '' : 'iba-success-toast'} role={feedback.error ? 'alert' : 'status'} variant={feedback.error ? 'destructive' : 'default'}>{feedback.error ? <CircleAlert aria-hidden="true" /> : <CheckCircle aria-hidden="true" />}<AlertDescription>{feedback.text}</AlertDescription></Alert>}
        <div className="iba-actions"><Button type="submit"><Send aria-hidden="true" />Broadcast Now</Button></div>
      </form>
    </Card>
  </section>;
}

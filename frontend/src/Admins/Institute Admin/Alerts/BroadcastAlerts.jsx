import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Info, TriangleAlert, CircleAlert, FileText, Send, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Alert as AlertBox, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { fetchCampuses, selectInstituteCampuses } from '@/store/Slices/campusesSlice';
import axiosInstance from '@/api/axiosInstance';
import { audienceOptions, severities, validateBroadcast } from './broadcastData';
import './BroadcastAlerts.css';

const icons = { Info, Warning: TriangleAlert, Critical: CircleAlert };

export default function BroadcastAlerts() {
  const dispatch = useDispatch();
  const campuses = useSelector(selectInstituteCampuses);
  const [alertsList, setAlertsList] = useState([]);
  const [audience, setAudience] = useState('all');
  const [severity, setSeverity] = useState('Info');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const options = audienceOptions(campuses, [], []);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/institute-admin/alerts');
      setAlertsList(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch broadcast alerts:', err);
    }
  }, []);

  useEffect(() => {
    dispatch(fetchCampuses());
    loadAlerts();
  }, [dispatch, loadAlerts]);

  useEffect(() => {
    if (!feedback || feedback.error) return;
    const timer = setTimeout(() => setFeedback(null), 6000);
    return () => clearTimeout(timer);
  }, [feedback]);

  async function submit(event) {
    event.preventDefault();
    const error = validateBroadcast({ audience, severity, message }, options);
    if (error) {
      setFeedback({ error: true, text: error });
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosInstance.post('/institute-admin/alerts', {
        audience,
        severity,
        message: message.trim(),
        campusId: audience.startsWith('campus:') ? audience.replace('campus:', '') : null,
      });
      setMessage('');
      setAudience('all');
      setSeverity('Info');
      setFeedback({ error: false, text: 'Broadcast notice published and delivered to all channels.' });
      await loadAlerts();
    } catch (err) {
      setFeedback({ error: true, text: err.response?.data?.message || 'Failed to dispatch broadcast alert.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="institute-broadcast">
      <div className="iba-heading">
        <h1>Broadcast Alerts</h1>
        <p>Publish announcements and emergency notices for staff and students across your campuses.</p>
      </div>

      <Card className="iba-card">
        <form onSubmit={submit} noValidate>
          <div className="iba-field">
            <Label htmlFor="broadcast-audience">Target Audience</Label>
            <Select value={audience} onValueChange={(value) => { setAudience(value); setFeedback(null); }}>
              <SelectTrigger id="broadcast-audience" className="iba-select" aria-required="true">
                <Users aria-hidden="true" />
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="iba-field">
            <legend>Alert Severity</legend>
            <div className="iba-severities">
              {severities.map((value) => {
                const Icon = icons[value];
                return (
                  <label
                    key={value}
                    className={`iba-severity iba-${value.toLowerCase()} ${severity === value ? 'is-selected' : ''}`}
                  >
                    <Icon aria-hidden="true" />
                    <span>{value}</span>
                    <input
                      type="radio"
                      name="severity"
                      value={value}
                      checked={severity === value}
                      onChange={() => { setSeverity(value); setFeedback(null); }}
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="iba-field">
            <Label htmlFor="broadcast-message">Message Content</Label>
            <div className="iba-message">
              <FileText aria-hidden="true" />
              <Textarea
                id="broadcast-message"
                placeholder="Type your alert announcement here..."
                value={message}
                onChange={(event) => { setMessage(event.target.value); setFeedback(null); }}
                aria-required="true"
                aria-invalid={feedback?.error || undefined}
                aria-describedby={feedback ? 'broadcast-feedback' : undefined}
              />
            </div>
          </div>

          {feedback && (
            <AlertBox
              id="broadcast-feedback"
              className={feedback.error ? '' : 'iba-success-toast'}
              role={feedback.error ? 'alert' : 'status'}
              variant={feedback.error ? 'destructive' : 'default'}
            >
              {feedback.error ? <CircleAlert aria-hidden="true" /> : <CheckCircle aria-hidden="true" />}
              <AlertDescription>{feedback.text}</AlertDescription>
            </AlertBox>
          )}

          <div className="iba-actions">
            <Button type="submit" disabled={isSubmitting}>
              <Send aria-hidden="true" />
              {isSubmitting ? 'Publishing...' : 'Broadcast Now'}
            </Button>
          </div>
        </form>
      </Card>

      {alertsList.length > 0 && (
        <Card className="iba-card" style={{ marginTop: '24px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} />
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Recent Broadcasts</h2>
          </div>
          <Table aria-label="Recent broadcast notices">
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Published</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertsList.map((alert) => (
                <TableRow key={alert._id || alert.id}>
                  <TableCell>
                    <Badge variant="outline" className={`iba-${alert.severity?.toLowerCase()}`}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ maxWidth: '360px', overflowWrap: 'break-word' }}>
                    {alert.message}
                  </TableCell>
                  <TableCell>
                    <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                      {alert.campusId?.name ? alert.campusId.name : alert.audience}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: '12px', color: '#71717a' }}>
                    {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : 'Just now'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </section>
  );
}

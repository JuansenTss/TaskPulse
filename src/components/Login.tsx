import { useEffect, useState } from 'react';
import { login, signup, resetPassword } from '../utils/auth';

interface Props {
  onLoggedIn: () => void;
}

export default function Login({ onLoggedIn }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [resetStep, setResetStep] = useState<'email'|'otp'|'newpass'>('email');
  const [isOtp, setIsOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [otpCooldownUntil, setOtpCooldownUntil] = useState<number | null>(null);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 5);
  };

  // Clear error messages when navigating between modes/steps
  useEffect(() => {
    setError(null);
  }, [isSignUp, isReset, isOtp, resetStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const u = username.trim();

      // 1) Sign-up OTP verification step
      if (isOtp) {
        if (!otp || otp.length !== 6) {
          setError('Enter the 6-digit code');
          return;
        }
        await signup(u, password, email);
        setToast('Account created. Please sign in.');
        setIsOtp(false);
        setIsSignUp(false);
        setOtp('');
        setConfirmPassword('');
        setPassword('');
        return;
      }

      // 2) Forgot password multi-step flow
      if (isReset) {
        if (resetStep === 'email') {
          if (!email) {
            setError('Please enter your email');
            return;
          }
          if (!isValidEmail(email)) {
            setError('Please enter a valid email');
            return;
          }
          setResetStep('otp');
          return;
        }
        if (resetStep === 'otp') {
          if (!otp || otp.length !== 6) {
            setError('Enter the 6-digit code');
            return;
          }
          setResetStep('newpass');
          setOtp('');
          return;
        }
        if (resetStep === 'newpass') {
          if (!password || !confirmPassword) {
            setError('Please fill in all required fields');
            return;
          }
          if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
          }
          await resetPassword(undefined, password, email);
          setIsReset(false);
          setResetStep('email');
          setConfirmPassword('');
          setPassword('');
          return;
        }
      }

      // 3) Sign-up initial step (request OTP): requires username, password, confirm match
      if (isSignUp) {
        if (!u || !email || !password || !confirmPassword) {
          setError('Please fill in all required fields');
          return;
        }
        if (!isValidEmail(email)) {
          setError('Please enter a valid email');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        setIsOtp(true);
        return;
      }

      // 4) Normal login requires username + password
      if (!u || !password) {
        setError('Please fill in all required fields');
        return;
      }
      if (lockUntil && Date.now() < lockUntil) {
        const secs = Math.ceil((lockUntil - Date.now()) / 1000);
        setError(`Too many attempts. Try again in ${secs}s`);
        return;
      }
      await login(u, password, rememberMe);
      onLoggedIn();
      setLoginAttempts(0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(isSignUp ? 'Username already in user' : (isReset ? msg : 'Invalid username or password'));
      if (!isSignUp && !isReset) {
        const attempts = loginAttempts + 1;
        setLoginAttempts(attempts);
        if (attempts >= 5) {
          setLockUntil(Date.now() + 30_000); // 30s lockout
          setLoginAttempts(0);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // timers for lockout/cooldown messaging cleanup
  if (lockUntil && Date.now() >= lockUntil) setLockUntil(null);
  if (otpCooldownUntil && Date.now() >= otpCooldownUntil) setOtpCooldownUntil(null);

  return (
    <div className="login-container">
      <h1 className="app-title" style={{ marginBottom: 16 }}>
        <img src="/src/assets/taskpulse-logo.svg" alt="TaskPulse Logo" className="app-logo" />
        Task Pulse
      </h1>
      <form onSubmit={handleSubmit} className="login-form">
        {!isOtp && !isReset && (
          <>
            <div className="form-row">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            {isSignUp && (
              <div className="form-row">
                <label>Email</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            )}

            <div className="form-row">
              <label>{isReset ? 'New Password' : 'Password'}</label>
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => setCapsOn((e.nativeEvent as KeyboardEvent).getModifierState?.('CapsLock') ?? false)}
                  onKeyDown={(e) => setCapsOn((e.nativeEvent as KeyboardEvent).getModifierState?.('CapsLock') ?? false)}
                  autoComplete={(isSignUp || isReset) ? 'new-password' : 'current-password'}
                  style={{ paddingRight: 32, width: '100%' }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(s => !s)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: '#888' }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.6-1.36 1.5-2.62 2.57-3.68M10.58 10.58a2 2 0 1 0 2.83 2.83"/>
                      <path d="M6.1 6.1C7.97 4.78 9.94 4 12 4c5 0 9.27 3.89 11 8-.53 1.22-1.27 2.35-2.17 3.32"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {capsOn && <div className="hint">Caps Lock is on</div>}
              {isSignUp && (
                <div className="strength-meter" style={{ marginTop: 6 }}>
                  <div style={{ width: `${(getStrength(password) / 5) * 100}%`, background: getStrength(password) >= 4 ? '#50c878' : getStrength(password) >= 3 ? '#ffd700' : '#ff6b6b' }} />
                </div>
              )}
            </div>
            {(isSignUp || isReset) && (
              <div className="form-row">
                <label>{isReset ? 'Confirm New Password' : 'Confirm Password'}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            )}
          </>
        )}

        {isReset && (
          <>
            {resetStep === 'email' && (
              <div className="form-row">
                <label>Email</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            )}
            {resetStep === 'otp' && (
              <div className="form-row">
                <label>Enter 6-digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="123456"
                />
              </div>
            )}
            {resetStep === 'newpass' && (
              <>
                <div className="form-row">
                  <label>New Password</label>
                  <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyUp={(e) => setCapsOn((e.nativeEvent as KeyboardEvent).getModifierState?.('CapsLock') ?? false)}
                      onKeyDown={(e) => setCapsOn((e.nativeEvent as KeyboardEvent).getModifierState?.('CapsLock') ?? false)}
                      autoComplete="new-password"
                      style={{ paddingRight: 32, width: '100%' }}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(s => !s)}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', color: '#888' }}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.6-1.36 1.5-2.62 2.57-3.68M10.58 10.58a2 2 0 1 0 2.83 2.83"/>
                          <path d="M6.1 6.1C7.97 4.78 9.94 4 12 4c5 0 9.27 3.89 11 8-.53 1.22-1.27 2.35-2.17 3.32"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {capsOn && <div className="hint">Caps Lock is on</div>}
                </div>
                <div className="form-row">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}
          </>
        )}

        {isOtp && (
          <div className="form-row">
            <label>Enter 6-digit OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="123456"
            />
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
        <div className="login-actions">
          <button type="submit" disabled={loading}>
            {loading
              ? (isOtp ? 'Verifying...' : isSignUp ? 'Requesting OTP...' : isReset ? (resetStep === 'email' ? 'Requesting OTP...' : resetStep === 'otp' ? 'Verifying...' : 'Resetting...') : 'Signing in...')
              : (isOtp ? 'Verify' : isSignUp ? 'Request OTP' : isReset ? (resetStep === 'email' ? 'Request OTP' : resetStep === 'otp' ? 'Verify' : 'Reset Password') : 'Sign In')}
          </button>
          {!isOtp && !isReset && !isSignUp && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me
            </label>
          )}
          <div className="hint">
            {isSignUp && !isOtp ? (
              <>
                Have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(false); setUsername(''); setPassword(''); setConfirmPassword(''); setEmail(''); setOtp(''); }}>Sign In</a>
              </>
            ) : isReset ? (
              resetStep === 'email' ? (
                <>
                  Remembered it?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsReset(false); setUsername(''); setPassword(''); setConfirmPassword(''); setEmail(''); setOtp(''); }}>Sign In</a>
                </>
              ) : (
                <>
                  Wrong email/code?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setResetStep('email'); setOtp(''); }}>Back</a>
                </>
              )
            ) : isOtp ? (
              <>
                Wrong email?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setIsOtp(false); setIsSignUp(true); setUsername(''); setPassword(''); setConfirmPassword(''); setEmail(''); }}>Back</a>
              </>
            ) : (
              <div className="hint-dual">
                <span>
                  New here?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(true); setIsReset(false); setUsername(''); setPassword(''); setConfirmPassword(''); }}>Create account</a>
                </span>
                <a className="forgot-link" href="#" onClick={(e) => { e.preventDefault(); setIsReset(true); setIsSignUp(false); setUsername(''); setPassword(''); setConfirmPassword(''); }}>Forgot password?</a>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}



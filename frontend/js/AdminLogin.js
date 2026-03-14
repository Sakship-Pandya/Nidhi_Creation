/* ══════════════════════════════
   NIDHI CREATION — admin_login.js
   ══════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const form       = document.getElementById('adminForm');
  const submitBtn  = document.getElementById('submitBtn');
  const btnText    = submitBtn.querySelector('.btn-text');
  const formNote   = document.getElementById('formNote');

  const fields = {
    username: { el: document.getElementById('username'), err: document.getElementById('usernameError') },
    password: { el: document.getElementById('password'), err: document.getElementById('passwordError') },
  };

  /* ── Show / hide password toggle ── */
  const toggleBtn = document.getElementById('togglePass');
  const eyeShow   = document.getElementById('eyeShow');
  const eyeHide   = document.getElementById('eyeHide');

  toggleBtn.addEventListener('click', () => {
    const isPassword = fields.password.el.type === 'password';
    fields.password.el.type = isPassword ? 'text' : 'password';
    eyeShow.style.display = isPassword ? 'none'  : 'block';
    eyeHide.style.display = isPassword ? 'block' : 'none';
  });

  /* ── Brute-force lockout (3 attempts, 30s cooldown) ── */
  let attempts = 0;
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_MS   = 30_000;

  function lockOut() {
    submitBtn.disabled = true;
    let remaining = LOCKOUT_MS / 1000;

    const tick = setInterval(() => {
      remaining--;
      btnText.textContent = `Try again in ${remaining}s`;
      if (remaining <= 0) {
        clearInterval(tick);
        attempts = 0;
        submitBtn.disabled = false;
        btnText.textContent = 'Verify & Enter';
        formNote.textContent = '';
        formNote.className = 'form-note';
      }
    }, 1000);
  }

  /* ── Validation ── */
  function validate() {
    let valid = true;

    const username = fields.username.el.value.trim();
    if (!username) {
      setError('username', 'Username is required.');
      valid = false;
    } else {
      clearError('username');
    }

    const password = fields.password.el.value;
    if (!password) {
      setError('password', 'Password is required.');
      valid = false;
    } else if (password.length < 6) {
      setError('password', 'Password must be at least 6 characters.');
      valid = false;
    } else {
      clearError('password');
    }

    return valid;
  }

  function setError(field, msg) {
    fields[field].el.classList.add('invalid');
    fields[field].err.textContent = msg;
  }

  function clearError(field) {
    fields[field].el.classList.remove('invalid');
    fields[field].err.textContent = '';
  }

  /* ── Clear errors on input ── */
  Object.keys(fields).forEach(key => {
    fields[key].el.addEventListener('input', () => clearError(key));
  });

  /* ── Submit ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formNote.textContent = '';
    formNote.className = 'form-note';

    if (!validate()) return;

    submitBtn.disabled = true;
    btnText.textContent = 'Verifying…';

    try {
      const res = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)),
      });

      if (res.ok) {
        formNote.textContent = 'Access granted. Redirecting…';
        formNote.classList.add('success');
        btnText.textContent = 'Verify & Enter';
        setTimeout(() => { window.location.href = '/admin/dashboard'; }, 800);

      } else if (res.status === 401) {
        attempts++;
        fields.password.el.value = '';   // clear password field

        if (attempts >= MAX_ATTEMPTS) {
          formNote.textContent = `Too many failed attempts. Locked for 30 seconds.`;
          lockOut();
        } else {
          const left = MAX_ATTEMPTS - attempts;
          formNote.textContent = `Incorrect credentials. ${left} attempt${left > 1 ? 's' : ''} remaining.`;
          submitBtn.disabled = false;
          btnText.textContent = 'Verify & Enter';
        }

      } else {
        throw new Error('Server error');
      }

    } catch {
      formNote.textContent = 'Something went wrong. Please try again.';
      submitBtn.disabled = false;
      btnText.textContent = 'Verify & Enter';
    }
  });

});
/* ══════════════════════════════
   NIDHI CREATION — contact.js
   ══════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  const form      = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText   = submitBtn.querySelector('.btn-text');
  const formNote  = document.getElementById('formNote');

  const fields = {
    name:    { el: document.getElementById('name'),    err: document.getElementById('nameError') },
    email:   { el: document.getElementById('email'),   err: document.getElementById('emailError') },
    message: { el: document.getElementById('message'), err: document.getElementById('messageError') },
  };

  /* ── Validation ── */
  function validate() {
    let valid = true;

    const name = fields.name.el.value.trim();
    if (!name || name.length < 2) {
      setError('name', 'Please enter your name.');
      valid = false;
    } else { clearError('name'); }

    const email = fields.email.el.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('email', 'Enter a valid email address.');
      valid = false;
    } else { clearError('email'); }

    const message = fields.message.el.value.trim();
    if (!message || message.length < 10) {
      setError('message', 'Please write a message (at least 10 characters).');
      valid = false;
    } else { clearError('message'); }

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
    btnText.textContent = 'Sending…';

    try {
      const res = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)),
      });

      if (res.ok) {
        formNote.textContent = "Message sent! We'll get back to you soon.";
        formNote.classList.add('success');
        form.reset();
        btnText.textContent = 'Send Message';
        submitBtn.disabled = false;
      } else {
        throw new Error();
      }
    } catch {
      formNote.textContent = 'Something went wrong. Please try again.';
      btnText.textContent = 'Send Message';
      submitBtn.disabled = false;
    }
  });

});
const Auth = {
  current() {
    const id = DB.get('session', null);
    if (!id) return null;
    return Data.users().find(u => u.id === id) || null;
  },
  login(email, password) {
    const u = Data.users().find(u => u.email === email.trim().toLowerCase());
    if (!u) return { ok: false, error: 'No account found with this email address' };
    if (u.password !== password) return { ok: false, error: 'Incorrect password. Please try again' };
    DB.set('session', u.id);
    return { ok: true, user: u };
  },
  logout() {
    localStorage.removeItem('session');
  },
  validate(d) {
    const errs = {};
    const name = (d.name || '').trim();
    if (!name) errs.name = 'Full name is required';
    else if (!/^[A-Za-z\u0600-\u06FF ]+$/.test(name)) errs.name = 'Name can only contain letters and spaces';
    else if (name.length < 3 || name.length > 40) errs.name = 'Name must be between 3 and 40 characters';

    const email = (d.email || '').trim().toLowerCase();
    if (!email) errs.email = 'Email is required';
    else if (!EMAIL.test(email)) errs.email = 'Enter a valid email address, for example name@example.com';
    else if (Data.users().some(u => u.email === email)) errs.email = 'This email is already registered';

    const pw = d.password || '';
    if (!pw) errs.password = 'Password is required';
    else if (pw.length < 8) errs.password = 'Password must be at least 8 characters';
    else if (!/[a-z]/.test(pw)) errs.password = 'Password must contain a lowercase letter';
    else if (!/[A-Z]/.test(pw)) errs.password = 'Password must contain an uppercase letter';
    else if (!/\d/.test(pw)) errs.password = 'Password must contain a number';

    if (!d.confirm) errs.confirm = 'Please confirm your password';
    else if (d.confirm !== pw) errs.confirm = 'Passwords do not match';
    return errs;
  },
  create(d, role) {
    const users = Data.users();
    const user = { id: DB.nextId('users'), name: d.name.trim(), email: d.email.trim().toLowerCase(), password: d.password, role };
    users.push(user);
    DB.set('users', users);
    return user;
  }
};

function viewLogin() {
  app.innerHTML = `<section class="auth">
    <h1>Welcome back</h1>
    <p class="muted">Log in as a customer or an admin.</p>
    <form data-form="login" novalidate>
      <div class="form-err err" data-for="_form"></div>
      ${field('Email', 'email', 'email', '', 'autocomplete="username"')}
      ${field('Password', 'password', 'password', '', 'autocomplete="current-password"')}
      <button class="btn block" type="submit">Log in</button>
    </form>
    <p class="muted center">New here? <a href="#/register">Create an account</a></p>
  </section>`;
}

function viewRegister() {
  app.innerHTML = `<section class="auth">
    <h1>Create your account</h1>
    <p class="muted">Register to shop, save favourites and track orders.</p>
    <form data-form="register" novalidate>
      ${field('Full name', 'name', 'text', '', 'autocomplete="name"')}
      ${field('Email', 'email', 'email', '', 'autocomplete="email"')}
      ${field('Password', 'password', 'password', '', 'autocomplete="new-password"')}
      <p class="hint">At least 8 characters with uppercase, lowercase and a number.</p>
      ${field('Confirm password', 'confirm', 'password', '', 'autocomplete="new-password"')}
      <button class="btn block" type="submit">Register</button>
    </form>
    <p class="muted center">Already registered? <a href="#/login">Log in</a></p>
  </section>`;
}

const authForms = {
  login(f, d) {
    const errs = {};
    const email = (d.email || '').trim();
    if (!email) errs.email = 'Email is required';
    else if (!EMAIL.test(email)) errs.email = 'Enter a valid email address';
    if (!d.password) errs.password = 'Password is required';
    if (!setErrors(f, errs)) return;
    const r = Auth.login(email, d.password);
    if (!r.ok) {
      setErrors(f, { _form: r.error });
      return;
    }
    toast('Logged in as ' + r.user.name);
    location.hash = r.user.role === 'admin' ? '#/admin/products' : '#/products';
  },
  register(f, d) {
    if (!setErrors(f, Auth.validate(d))) return;
    const u = Auth.create(d, 'customer');
    DB.set('session', u.id);
    toast('Account created. Welcome, ' + u.name);
    location.hash = '#/products';
  }
};

<section id="view-settings" class="page-view space-y-4">
  <p class="text-sm text-slate-500">Configure SMTP for low-stock email alerts. Passwords are stored encrypted in the database when available.</p>

  <div class="bg-white rounded-xl border border-slate-200 p-5 max-w-2xl space-y-4">
    <h2 class="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Email / SMTP</h2>

    <div id="settings-source" class="text-xs text-slate-400"></div>

    <div>
      <label class="form-label" for="mail-alert-recipient">Alert recipient *</label>
      <input id="mail-alert-recipient" type="email" class="form-input" placeholder="admin@company.com" autocomplete="off">
      <p class="text-[11px] text-slate-400 mt-1">Where low-stock alerts are sent.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="form-label" for="mail-smtp-host">SMTP host *</label>
        <input id="mail-smtp-host" type="text" class="form-input" placeholder="smtp.gmail.com" autocomplete="off">
      </div>
      <div>
        <label class="form-label" for="mail-smtp-port">Port</label>
        <input id="mail-smtp-port" type="number" class="form-input" value="465" min="1" max="65535">
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="form-label" for="mail-smtp-encryption">Encryption</label>
        <select id="mail-smtp-encryption" class="form-input">
          <option value="ssl">SSL (port 465)</option>
          <option value="tls">TLS (port 587)</option>
          <option value="none">None</option>
        </select>
      </div>
      <div>
        <label class="form-label" for="mail-cooldown">Alert cooldown (hours)</label>
        <input id="mail-cooldown" type="number" class="form-input" value="12" min="0" max="168">
      </div>
    </div>

    <div>
      <label class="form-label" for="mail-smtp-user">SMTP username *</label>
      <input id="mail-smtp-user" type="text" class="form-input" placeholder="you@gmail.com" autocomplete="off">
      <p class="text-[11px] text-slate-400 mt-1">Used as the From address for outgoing mail.</p>
    </div>

    <div>
      <label class="form-label" for="mail-smtp-pass">SMTP password / App password</label>
      <input id="mail-smtp-pass" type="password" class="form-input" placeholder="Leave blank to keep existing" autocomplete="new-password">
      <p id="mail-pass-hint" class="text-[11px] text-slate-400 mt-1">Leave blank to keep the currently saved password.</p>
    </div>

    <div class="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
      <strong>Gmail:</strong> use an <em>App Password</em> (Google Account → Security → 2-Step Verification → App passwords), not your normal password.
      Host <code class="font-mono">smtp.gmail.com</code>, SSL port <code class="font-mono">465</code> or TLS port <code class="font-mono">587</code>.
    </div>

    <div class="flex flex-wrap justify-end gap-2 pt-1">
      <button id="btn-test-low-stock" type="button" class="btn btn-secondary btn-sm">Run low-stock check</button>
      <button id="btn-save-email" type="button" class="btn btn-primary">Save email settings</button>
    </div>
    <p id="settings-msg" class="text-sm hidden"></p>
  </div>

  <div class="bg-white rounded-xl border border-slate-200 p-5 max-w-2xl space-y-2">
    <h2 class="text-sm font-semibold text-slate-900">How alerts work</h2>
    <ul class="text-sm text-slate-600 space-y-1 list-disc list-inside">
      <li>Low stock = quantity ≤ reorder level; out of stock = quantity ≤ 0.</li>
      <li>Alerts are triggered after issuances/deliveries and via the low-stock check button.</li>
      <li>Cooldown prevents repeat emails for the same item within the configured hours.</li>
      <li>SMTP settings are stored in <code class="font-mono text-xs">dbo.toner_email_settings</code> when the database is available.</li>
    </ul>
  </div>
</section>

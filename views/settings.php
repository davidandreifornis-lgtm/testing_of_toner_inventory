<section id="view-settings" class="page-view space-y-2">
  <p class="text-xs text-slate-500">System settings: email alerts and user accounts.</p>

  <!-- Tabs: visible only on small screens (CSS) -->
  <div id="settings-tabs-bar" class="settings-tabs-bar flex gap-1 rounded-lg bg-slate-100 p-1">
    <button type="button" id="settings-tab-email" class="settings-tab flex-1 rounded-md px-3 py-1.5 text-sm font-medium bg-white shadow-sm text-slate-900" data-tab="email">Email / SMTP</button>
    <button type="button" id="settings-tab-users" class="settings-tab flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600" data-tab="users">Users</button>
  </div>

  <!-- Side-by-side on lg+; stacked/tabbed on small screens -->
  <div id="settings-columns" class="settings-columns grid grid-cols-1 gap-3 items-start">

    <!-- Email column -->
    <div id="settings-panel-email" class="settings-panel space-y-2 min-w-0">
      <div class="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
        <h2 class="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-1.5">Email / SMTP</h2>

        <div id="settings-source" class="text-[11px] text-slate-400"></div>

        <div>
          <label class="form-label" for="mail-alert-recipient">Alert recipient *</label>
          <input id="mail-alert-recipient" type="email" class="form-input" placeholder="Alert email address" autocomplete="off">
          <p class="text-[11px] text-slate-400 mt-0.5">Where low-stock alerts are sent.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label class="form-label" for="mail-smtp-host">SMTP host *</label>
            <input id="mail-smtp-host" type="text" class="form-input" placeholder="SMTP host" autocomplete="off">
          </div>
          <div>
            <label class="form-label" for="mail-smtp-port">Port</label>
            <input id="mail-smtp-port" type="number" class="form-input" value="465" min="1" max="65535">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
          <input id="mail-smtp-user" type="text" class="form-input" placeholder="SMTP username" autocomplete="off">
          <p class="text-[11px] text-slate-400 mt-0.5">Used as the From address for outgoing mail.</p>
        </div>

        <div>
          <label class="form-label" for="mail-smtp-pass">SMTP password / App password</label>
          <input id="mail-smtp-pass" type="password" class="form-input" placeholder="Leave blank to keep existing" autocomplete="new-password">
          <p id="mail-pass-hint" class="text-[11px] text-slate-400 mt-0.5">Leave blank to keep the currently saved password.</p>
        </div>

        <div class="rounded-md bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-[11px] text-slate-600">
          <strong>Gmail:</strong> use an <em>App Password</em> (Account → Security → App passwords).
          Host <code class="font-mono">smtp.gmail.com</code>, SSL <code class="font-mono">465</code> or TLS <code class="font-mono">587</code>.
        </div>

        <div class="flex flex-wrap justify-end gap-2 pt-0.5">
          <button id="btn-test-low-stock" type="button" class="btn btn-secondary btn-sm">Run low-stock check</button>
          <button id="btn-save-email" type="button" class="btn btn-primary">Save email settings</button>
        </div>
        <p id="settings-msg" class="text-sm hidden"></p>
      </div>

      <div class="bg-white rounded-lg border border-slate-200 p-3 space-y-1">
        <h2 class="text-sm font-semibold text-slate-900">How alerts work</h2>
        <ul class="text-xs text-slate-600 space-y-0.5 list-disc list-inside">
          <li>Low stock = qty ≤ reorder; out of stock = qty ≤ 0.</li>
          <li>Triggered after movements and via the check button.</li>
          <li>Cooldown limits repeat emails per item.</li>
          <li>Stored in <code class="font-mono text-[10px]">dbo.toner_email_settings</code>.</li>
        </ul>
      </div>
    </div>

    <!-- Users column -->
    <div id="settings-panel-users" class="settings-panel space-y-2 min-w-0">
      <div class="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
          <h2 class="text-sm font-semibold text-slate-900">User management</h2>
</div>

        <p class="text-[11px] text-slate-500">Admins can create accounts and set roles. DB users are used when <code class="font-mono">dbo.toner_users</code> exists.</p>

        <div class="rounded-md border border-slate-100 bg-slate-50 p-2.5 space-y-2">
          <h3 class="text-[10px] font-semibold text-slate-700 uppercase tracking-wide">Add user</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="form-label" for="user-new-username">Username *</label>
              <input id="user-new-username" type="text" class="form-input font-mono" placeholder="jsmith" autocomplete="off">
            </div>
            <div>
              <label class="form-label" for="user-new-fullname">Full name</label>
              <input id="user-new-fullname" type="text" class="form-input" placeholder="Jane Smith" autocomplete="off">
            </div>
            <div>
              <label class="form-label" for="user-new-password">Password *</label>
              <input id="user-new-password" type="password" class="form-input" placeholder="Min. 6 characters" autocomplete="new-password">
            </div>
            <div>
              <label class="form-label" for="user-new-role">Role</label>
              <select id="user-new-role" class="form-input">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end">
            <button type="button" id="btn-add-user" class="btn btn-primary btn-sm">Add user</button>
          </div>
        </div>

        <p id="users-msg" class="text-sm hidden"></p>

        <div class="table-wrap overflow-auto max-h-[min(40vh,16rem)]">
          <table class="data-table text-sm">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full name</th>
                <th>Role</th>
                <th>Status</th>
                <th class="text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody id="users-tbody">
              <tr><td colspan="5" class="text-slate-400 text-center py-4">Loading…</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
        <h2 class="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-1.5">Change my password</h2>
        <p id="my-user-info" class="text-[11px] text-slate-500"></p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label class="form-label" for="user-self-current">Current password</label>
            <input id="user-self-current" type="password" class="form-input" autocomplete="current-password">
          </div>
          <div>
            <label class="form-label" for="user-self-new">New password</label>
            <input id="user-self-new" type="password" class="form-input" placeholder="Min. 6 chars" autocomplete="new-password">
          </div>
          <div>
            <label class="form-label" for="user-self-confirm">Confirm</label>
            <input id="user-self-confirm" type="password" class="form-input" autocomplete="new-password">
          </div>
        </div>
        <p id="self-pass-msg" class="text-sm hidden"></p>
        <div class="flex justify-end">
          <button type="button" id="btn-change-my-password" class="btn btn-primary btn-sm">Update password</button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Edit user modal -->
<div id="modal-edit-user" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-edit-user-title">
  <div class="modal-panel max-w-md">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <h2 id="modal-edit-user-title" class="text-sm font-semibold text-slate-900">Edit user</h2>
      <button type="button" class="modal-close p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" data-close="modal-edit-user" aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="p-4 space-y-2">
      <input type="hidden" id="edit-user-id">
      <div>
        <label class="form-label">Username</label>
        <input id="edit-user-username" type="text" class="form-input font-mono bg-slate-50" readonly>
      </div>
      <div>
        <label class="form-label" for="edit-user-fullname">Full name</label>
        <input id="edit-user-fullname" type="text" class="form-input">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="form-label" for="edit-user-role">Role</label>
          <select id="edit-user-role" class="form-input">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label class="form-label" for="edit-user-active">Status</label>
          <select id="edit-user-active" class="form-input">
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
      </div>
      <div>
        <label class="form-label" for="edit-user-password">New password (optional)</label>
        <input id="edit-user-password" type="password" class="form-input" placeholder="Leave blank to keep current" autocomplete="new-password">
      </div>
      <p id="edit-user-msg" class="text-sm hidden"></p>
      <div class="flex justify-end gap-2">
        <button type="button" class="btn btn-secondary modal-close" data-close="modal-edit-user">Cancel</button>
        <button type="button" id="btn-save-edit-user" class="btn btn-primary">Save</button>
      </div>
    </div>
  </div>
</div>

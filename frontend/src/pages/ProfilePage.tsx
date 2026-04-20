import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getApiKeys, createApiKey, deleteApiKey } from '../api/client'
import type { ApiKey } from '../types'

export default function ProfilePage() {
  const { user } = useAuth()

  // ── Profile fields ─────────────────────────────────────────
  const [firstName, setFirstName] = useState((user?.user_metadata?.first_name as string) ?? '')
  const [lastName, setLastName] = useState((user?.user_metadata?.last_name as string) ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function saveProfile() {
    setProfileSaving(true)
    setProfileMsg(null)
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName.trim(), last_name: lastName.trim() },
    })
    setProfileSaving(false)
    setProfileMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Profile saved.' })
  }

  // ── API keys ───────────────────────────────────────────────
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [keysLoading, setKeysLoading] = useState(true)

  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    getApiKeys()
      .then(setKeys)
      .finally(() => setKeysLoading(false))
  }, [])

  async function handleCreateKey() {
    if (!newKeyName.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const result = await createApiKey(newKeyName.trim())
      setKeys((prev) => [result.api_key, ...prev])
      setRevealedKey(result.key)
      setNewKeyName('')
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create key')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await deleteApiKey(revokeTarget.id)
      setKeys((prev) => prev.filter((k) => k.id !== revokeTarget.id))
      setRevokeTarget(null)
    } catch {
      // keep dialog open on error
    } finally {
      setRevoking(false)
    }
  }

  function handleCopy() {
    if (!revealedKey) return
    navigator.clipboard.writeText(revealedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      {/* ── Profile section ─────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-filos-primary font-headline mb-4">Profile</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <p className="text-sm text-gray-700">{user?.email}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-filos-primary/30"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-filos-primary/30"
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveProfile}
              disabled={profileSaving}
              className="px-5 py-2 bg-filos-primary text-white rounded-lg text-sm font-medium hover:bg-filos-primary/90 transition disabled:opacity-50"
            >
              {profileSaving ? 'Saving…' : 'Save'}
            </button>
            {profileMsg && (
              <span className={`text-sm ${profileMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                {profileMsg.text}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── API Keys section ─────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold text-filos-primary font-headline mb-1">API Keys</h2>
        <p className="text-sm text-gray-500 mb-4">
          Use API keys to call the backend from your own scripts or integrations. Pass the key in the{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">X-API-Key</code> header.
        </p>

        {/* Create key */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Create new key</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
              placeholder="Key name, e.g. My script"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-filos-primary/30"
            />
            <button
              onClick={handleCreateKey}
              disabled={creating || !newKeyName.trim()}
              className="px-4 py-2 bg-filos-primary text-white rounded-lg text-sm font-medium hover:bg-filos-primary/90 transition disabled:opacity-50 whitespace-nowrap"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
          {createError && <p className="text-sm text-red-500 mt-2">{createError}</p>}
        </div>

        {/* Key list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {keysLoading ? (
            <p className="px-5 py-4 text-sm text-gray-400">Loading…</p>
          ) : keys.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400">No API keys yet.</p>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{k.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{k.key_prefix}…</p>
                  <p className="text-xs text-gray-400">
                    Created {formatDate(k.created_at)}
                    {k.last_used_at ? ` · Last used ${formatDate(k.last_used_at)}` : ' · Never used'}
                  </p>
                </div>
                <button
                  onClick={() => setRevokeTarget(k)}
                  className="shrink-0 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                >
                  Revoke
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Revealed key modal ──────────────────────────────────── */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-filos-primary font-headline">API Key Created</h3>
            <p className="text-sm text-gray-600">
              Copy your key now — it won't be shown again.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <code className="flex-1 text-xs font-mono text-gray-800 break-all">{revealedKey}</code>
              <button
                onClick={handleCopy}
                className="shrink-0 text-xs text-filos-primary hover:text-filos-primary/80 font-medium px-2 py-1 rounded transition"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => { setRevealedKey(null); setCopied(false) }}
              className="w-full py-2 bg-filos-primary text-white rounded-lg text-sm font-medium hover:bg-filos-primary/90 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Revoke confirm dialog ───────────────────────────────── */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Revoke key?</h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{revokeTarget.name}</span> ({revokeTarget.key_prefix}…) will stop working immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeTarget(null)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
              >
                {revoking ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

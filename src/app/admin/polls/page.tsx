'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'

type AdminPoll = {
  id: string
  question: string
  options: Array<{ id?: number, label: string, count?: number } | string>
  is_active: boolean
  created_at: string
}

const emptyForm = {
  question: '',
  option_1: '',
  option_2: '',
  option_3: '',
  option_4: '',
  is_active: true,
}

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<AdminPoll[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadPolls() {
    setLoading(true)
    setError('')

    const response = await fetch('/api/admin/polls')
    const data = await response.json()

    if (!response.ok) {
      setError(data.error || 'Erro ao carregar enquetes.')
      setLoading(false)
      return
    }

    setPolls(data.polls || [])
    setLoading(false)
  }

  useEffect(() => {
    loadPolls()
  }, [])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const response = await fetch('/api/admin/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await response.json()

    if (!response.ok) {
      setError(data.error || 'Erro ao criar enquete.')
      setSaving(false)
      return
    }

    setForm(emptyForm)
    setMessage('Enquete criada.')
    setSaving(false)
    await loadPolls()
  }

  async function updateStatus(id: string, isActive: boolean) {
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/polls/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive }),
    })
    const data = await response.json()

    if (!response.ok) {
      setError(data.error || 'Erro ao atualizar enquete.')
      return
    }

    setMessage(isActive ? 'Enquete ativada.' : 'Enquete desativada.')
    await loadPolls()
  }

  async function deletePoll(id: string) {
    if (!window.confirm('Excluir esta enquete?')) return

    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/polls/${id}`, { method: 'DELETE' })
    const data = await response.json()

    if (!response.ok) {
      setError(data.error || 'Erro ao excluir enquete.')
      return
    }

    setMessage('Enquete excluída.')
    await loadPolls()
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-[#6B7280]">Admin</p>
          <h1 className="text-2xl font-black text-[#111827]">Enquetes da Copa</h1>
        </div>
        <Link href="/" className="rounded-full bg-[#F6F1FF] px-4 py-2 text-xs font-black uppercase text-[#6C3BFF]">Ver Home</Link>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]">
        <h2 className="text-sm font-black uppercase text-[#111827]">Criar enquete</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-3">
          <input value={form.question} onChange={event => setForm(prev => ({ ...prev, question: event.target.value }))} placeholder="Pergunta" className="rounded-xl border border-[#EEF0F4] px-3 py-3 text-sm font-semibold outline-none focus:border-[#6C3BFF]" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.option_1} onChange={event => setForm(prev => ({ ...prev, option_1: event.target.value }))} placeholder="Opção 1" className="rounded-xl border border-[#EEF0F4] px-3 py-3 text-sm font-semibold outline-none focus:border-[#6C3BFF]" />
            <input value={form.option_2} onChange={event => setForm(prev => ({ ...prev, option_2: event.target.value }))} placeholder="Opção 2" className="rounded-xl border border-[#EEF0F4] px-3 py-3 text-sm font-semibold outline-none focus:border-[#6C3BFF]" />
            <input value={form.option_3} onChange={event => setForm(prev => ({ ...prev, option_3: event.target.value }))} placeholder="Opção 3 opcional" className="rounded-xl border border-[#EEF0F4] px-3 py-3 text-sm font-semibold outline-none focus:border-[#6C3BFF]" />
            <input value={form.option_4} onChange={event => setForm(prev => ({ ...prev, option_4: event.target.value }))} placeholder="Opção 4 opcional" className="rounded-xl border border-[#EEF0F4] px-3 py-3 text-sm font-semibold outline-none focus:border-[#6C3BFF]" />
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-[#111827]">
            <input type="checkbox" checked={form.is_active} onChange={event => setForm(prev => ({ ...prev, is_active: event.target.checked }))} />
            Criar como ativa
          </label>
          <button disabled={saving} className="rounded-xl bg-[#6C3BFF] px-4 py-3 text-sm font-black uppercase text-white disabled:opacity-60">{saving ? 'Criando...' : 'Criar enquete'}</button>
        </form>
      </section>

      {(message || error) && (
        <div className={`rounded-xl px-4 py-3 text-sm font-bold ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {error || message}
        </div>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(17,24,39,0.06)] ring-1 ring-black/[0.03]">
        <h2 className="text-sm font-black uppercase text-[#111827]">Enquetes existentes</h2>
        {loading ? (
          <p className="mt-4 text-sm font-bold text-[#6B7280]">Carregando...</p>
        ) : polls.length === 0 ? (
          <p className="mt-4 text-sm font-bold text-[#6B7280]">Nenhuma enquete criada.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {polls.map(poll => (
              <div key={poll.id} className="rounded-xl border border-[#EEF0F4] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[#111827]">{poll.question}</p>
                    <p className="mt-1 text-xs font-bold text-[#6B7280]">{poll.is_active ? 'Ativa' : 'Inativa'} · {new Date(poll.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {poll.is_active ? (
                      <button onClick={() => updateStatus(poll.id, false)} className="rounded-full bg-[#F3F4F6] px-3 py-2 text-xs font-black uppercase text-[#111827]">Desativar</button>
                    ) : (
                      <button onClick={() => updateStatus(poll.id, true)} className="rounded-full bg-[#E8FFF0] px-3 py-2 text-xs font-black uppercase text-[#16C45B]">Ativar</button>
                    )}
                    <button onClick={() => deletePoll(poll.id)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black uppercase text-red-700">Excluir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

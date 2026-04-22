'use client'
import { useState } from 'react'
import type { PwdProfile } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  record: PwdProfile
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

export default function DeleteModal({ record, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handle() {
    setLoading(true)
    setError(null)

    try {
      const { error: dbError } = await supabase
        .from('pwd_profiles')
        .delete()
        .eq('id', record.id)

      if (dbError) throw dbError

      await onConfirm()
      onClose()
    } catch (err: any) {
      console.error('Error deleting record:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🗑</span>
        </div>
        <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Delete Record?</h3>
        <p className="text-sm text-gray-500 text-center mb-1">
          You are about to permanently delete the record of:
        </p>
        <p className="text-sm font-bold text-center text-gray-800 mb-5">
          {record.full_name_last}, {record.full_name_first} {record.full_name_middle ?? ''}
        </p>
        <p className="text-xs text-gray-400 text-center mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

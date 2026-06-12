'use client'

import { useState } from 'react'
import { postComment } from '@/app/actions/comments'

type Comment = {
  comment_id: string
  comment: string
  created_at: string
  user_name?: string
  user_role?: string
}

export default function CommentThread({
  comments,
  submissionId,
}: {
  comments: Comment[]
  submissionId: string
}) {
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [localComments, setLocalComments] = useState(comments)

  async function handlePost() {
    if (!newComment.trim()) return
    setPosting(true)
    const result = await postComment(submissionId, newComment)
    if (result.success) {
      setLocalComments(prev => [...prev, {
        comment_id: `temp-${Date.now()}`,
        comment: newComment.trim(),
        created_at: new Date().toISOString(),
        user_name: 'You',
        user_role: undefined,
      }])
      setNewComment('')
    }
    setPosting(false)
  }

  return (
    <div className="bg-white border rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Comments ({localComments.length})</h3>

      {localComments.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {localComments.map((c) => (
            <div key={c.comment_id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-900">{c.user_name ?? 'Unknown'}</span>
                  {c.user_role && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${c.user_role === 'psd' || c.user_role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-green-100 text-green-700'}`}>
                      {c.user_role === 'agency_hr' ? 'Agency' : 'PSD'}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-gray-700">{c.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {localComments.length === 0 && (
        <p className="text-sm text-gray-400 italic">No comments yet.</p>
      )}

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost() } }}
          placeholder="Add a comment..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handlePost}
          disabled={posting || !newComment.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {posting ? '...' : 'Post'}
        </button>
      </div>
    </div>
  )
}

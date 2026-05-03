'use client'

import { Printer, ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

interface Props {
  backHref: string
  backLabel: string
  markdownHref?: string
}

export default function PrintToolbar({ backHref, backLabel, markdownHref }: Props) {
  return (
    <div className="no-print flex items-center justify-between mb-6 print:hidden">
      <Link
        href={backHref}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {backLabel}
      </Link>
      <div className="flex items-center gap-2">
        {markdownHref && (
          <a
            href={markdownHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Markdown
          </a>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Printer className="h-4 w-4 mr-1.5" />
          Print / Save PDF
        </button>
      </div>
    </div>
  )
}

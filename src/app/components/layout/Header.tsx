import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b bg-white">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-800">
            HR Succession Planning
          </Link>
          <div className="flex items-center space-x-6">
            <Link 
              href="/positions" 
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Positions
            </Link>
            <Link 
              href="/officers" 
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Officers
            </Link>
            <Link 
              href="/competencies" 
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Competencies
            </Link>
            <Link 
              href="/stints" 
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Stints
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
} 
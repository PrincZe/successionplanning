export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            There was an error processing your sign in link. Please try to sign in again.
          </p>
          <div className="mt-4 text-center">
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Return to login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 
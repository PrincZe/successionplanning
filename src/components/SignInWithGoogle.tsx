"use client";

import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function SignInWithGoogle() {
  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) console.error('Error signing in with Google:', error)
  }

  return (
    <button
      onClick={handleSignIn}
      className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <Image
        src="/google-logo.svg"
        alt="Google logo"
        width={20}
        height={20}
        className="mr-2"
      />
      Sign in with Google
    </button>
  )
}

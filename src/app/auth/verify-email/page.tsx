import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-indigo-950/50 p-4 border border-indigo-800">
            <svg
              className="h-8 w-8 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 8.688V19a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 11l9 6 9-6"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-50">Check your email</h1>
        <p className="mt-4 text-slate-400">
          We have sent a verification link to your email address. Please click the link to verify your account and complete registration.
        </p>

        <div className="mt-8 flex flex-col gap-3 justify-center">
          <Link
            href="/auth/login"
            className="inline-flex justify-center items-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            Go to Login
          </Link>
          <Link
            href="/"
            className="inline-flex justify-center items-center rounded-xl border border-slate-800 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-slate-300 hover:border-slate-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

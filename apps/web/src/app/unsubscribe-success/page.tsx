import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';

export default function UnsubscribeSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <Logo className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Successfully Unsubscribed
          </h1>
          
          <p className="text-gray-600 mb-6">
            You have been successfully removed from our mailing list. You will no longer receive emails from us.
          </p>
          
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              If you change your mind, you can always subscribe again by visiting our newsletter signup page.
            </p>
            
            <Link 
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

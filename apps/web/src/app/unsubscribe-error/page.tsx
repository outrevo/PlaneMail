import Link from 'next/link';
import { XCircle, AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';

export default function UnsubscribeErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const { reason } = searchParams;
  
  const getErrorMessage = (reason: string | undefined) => {
    switch (reason) {
      case 'invalid-params':
        return 'The unsubscribe link is missing required information.';
      case 'invalid-token':
        return 'The unsubscribe link is invalid or has expired.';
      case 'not-found':
        return 'The subscriber was not found in our system.';
      case 'server-error':
        return 'A server error occurred while processing your request.';
      default:
        return 'An unknown error occurred while trying to unsubscribe.';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <Logo className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Unsubscribe Failed
          </h1>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-red-700 text-sm">
                {getErrorMessage(reason)}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              If you need assistance, please contact our support team or try using a more recent unsubscribe link from one of our emails.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="mailto:support@planemail.in"
                className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Contact Support
              </Link>
              
              <Link 
                href="/"
                className="inline-block border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

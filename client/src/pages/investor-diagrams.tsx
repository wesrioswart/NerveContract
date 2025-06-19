import { useEffect } from 'react';

export default function InvestorDiagrams() {
  useEffect(() => {
    // Redirect to the static HTML version
    window.location.href = '/investor-diagrams';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Loading Investor Diagrams...</h2>
        <p className="text-gray-600">Redirecting to interactive presentation...</p>
      </div>
    </div>
  );
}
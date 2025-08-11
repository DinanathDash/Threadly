import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AlertTriangle, RefreshCw, Home, Terminal } from 'lucide-react';
import img404 from '@/assets/error.png'; // Assuming you have an error image

export default function ErrorPage({ error, errorCode = "500" }) {
  const navigate = useNavigate();
  const [consoleErrors, setConsoleErrors] = useState([]);
  
  // Capture console errors
  useEffect(() => {
    const originalConsoleError = console.error;
    const errors = [];
    
    // Override console.error to capture errors
    console.error = (...args) => {
      // Call original console.error
      originalConsoleError.apply(console, args);
      
      // Add to our errors array
      const errorMessage = args.map(arg => 
        typeof arg === 'object' && arg !== null 
          ? (arg instanceof Error ? arg.stack || arg.message : JSON.stringify(arg))
          : String(arg)
      ).join(' ');
      
      errors.push(errorMessage);
      setConsoleErrors([...errors]);
    };
    
    // Restore original console.error on cleanup
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Determine if it's a 404 error or another type
  const is404 = errorCode === "404" || (error && error.message && error.message.includes("not found"));
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-3xl mx-auto text-center">
        {/* Error code visualization - inspired by the Batch 404 page */}
        <div className="flex justify-center items-center relative">
          <img src={img404} alt="Error"/>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          {is404 ? "Ooops! Looks like you're in the wrong place." : "Ooops! Something went wrong"}
        </h1>
        <p className="text-slate-600 max-w-md mx-auto mb-8">
          {is404 
            ? "We can't find the page you're looking for." 
            : "We encountered an error while processing your request. Our team has been notified."}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            variant="default" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
            onClick={() => navigate('/dashboard')}
          >
            <Home size={16} />
            Take me home
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={16} />
            Refresh Page
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline" 
                className="border-slate-200 hover:bg-slate-50 hover:border-slate-300 flex items-center gap-2"
              >
                <Terminal size={16} />
                View Error Details
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] max-h-[400px] overflow-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={16} />
                  <h4 className="font-medium">Error Details</h4>
                </div>
                
                {error ? (
                  <div className="bg-red-50 p-3 rounded border border-red-100 text-sm font-mono text-red-800 whitespace-pre-wrap break-all">
                    {error.toString()}
                    {error.stack && (
                      <>
                        <br /><br />
                        {error.stack}
                      </>
                    )}
                  </div>
                ) : (
                  consoleErrors.length > 0 ? (
                    <div className="space-y-2">
                      {consoleErrors.map((err, index) => (
                        <div 
                          key={index} 
                          className="bg-red-50 p-3 rounded border border-red-100 text-sm font-mono text-red-800 whitespace-pre-wrap break-all"
                        >
                          {err}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">No detailed error information available.</p>
                  )
                )}
                
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <p className="text-xs text-slate-500">
                    Please provide these details to support if needed.
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

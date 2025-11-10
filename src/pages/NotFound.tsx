import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <div className="text-center space-y-6 animate-fade-in glass-card-premium rounded-3xl p-8 md:p-12 border-2 border-primary/20 shadow-glass">
        <div className="space-y-3">
          <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">404</h1>
          <p className="text-2xl md:text-3xl font-semibold text-foreground">Page Not Found</p>
          <p className="text-muted-foreground text-lg">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <a 
          href="/" 
          className="inline-flex items-center justify-center h-11 px-8 py-2 bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground rounded-xl font-semibold shadow-glow hover:shadow-strong hover:scale-105 transition-all duration-300"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

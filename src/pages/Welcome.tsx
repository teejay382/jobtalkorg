import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import logoImage from '@/assets/logo.png';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-12 animate-in fade-in duration-700">
        {/* Logo Section */}
        <div className="flex justify-center animate-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-2xl opacity-30 animate-pulse" />
            <div className="relative p-6 rounded-3xl bg-card shadow-elegant border-2 border-border">
              <img src={logoImage} alt="JobTolk" className="h-24 w-24 md:h-32 md:w-32" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6 animate-in slide-in-from-bottom duration-700 delay-150">
          <h1 className="text-6xl md:text-8xl font-bold">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              JobTolk
            </span>
          </h1>
          
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Find work. Show your skill.
            </p>
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in slide-in-from-bottom duration-700 delay-300">
          <Button 
            size="lg" 
            className="text-lg px-12 py-7 rounded-2xl shadow-glow hover:shadow-strong hover:scale-105 transition-all duration-300 font-bold w-full sm:w-auto"
            onClick={() => navigate('/auth?signup=true')}
          >
            Get Started
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-12 py-7 rounded-2xl font-bold border-2 hover:bg-muted hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            onClick={() => navigate('/auth')}
          >
            Sign In
          </Button>
        </div>

        {/* Footer */}
        <p className="text-sm text-muted-foreground animate-in fade-in duration-700 delay-500">
          Powered by JobTolk community
        </p>
      </div>
    </div>
  );
};

export default Welcome;

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, UserPlus, Video, CheckCircle2, Eye, MessageSquare, BadgeCheck, Play, Users } from 'lucide-react';
import logoImage from '@/assets/logo.png';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="mx-auto max-w-6xl px-4">
        <section className="min-h-[80vh] flex flex-col items-center justify-center text-center gap-10 py-10">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-2xl opacity-30 animate-pulse" />
              <div className="relative p-6 rounded-3xl bg-card shadow-elegant border-2 border-border">
                <img src={logoImage} alt="JobTolk" className="h-20 w-20 md:h-28 md:w-28" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">Welcome to Jobtolk</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Where skills meet opportunity — connect, showcase, and get hired.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-4xl">
            <div className="glass-card-premium rounded-xl p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div className="font-semibold">Create Profile</div>
              <p className="text-sm text-muted-foreground mt-1">Craft a clean profile that highlights your strengths.</p>
            </div>
            <div className="glass-card-premium rounded-xl p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Video className="w-5 h-5 text-primary" />
              </div>
              <div className="font-semibold">Post Your Skill</div>
              <p className="text-sm text-muted-foreground mt-1">Share short videos or posts that show your work.</p>
            </div>
            <div className="glass-card-premium rounded-xl p-5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="font-semibold">Get Hired</div>
              <p className="text-sm text-muted-foreground mt-1">Clients discover you and start conversations fast.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="px-10 py-6 rounded-2xl shadow-glow hover:shadow-strong hover:scale-105 transition-all duration-300 font-bold" onClick={() => navigate('/auth?signup=true')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="px-10 py-6 rounded-2xl font-bold border-2 hover:bg-muted hover:scale-105 transition-all duration-300" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button size="lg" variant="secondary" className="px-10 py-6 rounded-2xl font-semibold hover:scale-105 transition-all duration-300" onClick={() => navigate('/onboarding')}>
              Learn How to Get Hired Faster
            </Button>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">How Jobtolk Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-2">A simpler way to get work: you showcase your skills, clients discover and reach out.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <div className="glass-card-premium rounded-xl p-5 border border-primary/15 hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center gap-2 font-semibold"><Eye className="w-4 h-4 text-primary" /> Visibility over applications</div>
              <p className="text-sm text-muted-foreground mt-2">Spend less time applying. Gain traction by being seen for your work.</p>
            </div>
            <div className="glass-card-premium rounded-xl p-5 border border-primary/15 hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center gap-2 font-semibold"><MessageSquare className="w-4 h-4 text-primary" /> Clients find you</div>
              <p className="text-sm text-muted-foreground mt-2">Your posts start conversations. Clients reach out based on real examples.</p>
            </div>
            <div className="glass-card-premium rounded-xl p-5 border border-primary/15 hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center gap-2 font-semibold"><BadgeCheck className="w-4 h-4 text-primary" /> Build credibility</div>
              <p className="text-sm text-muted-foreground mt-2">Grow trust with consistent posts and get matched intelligently.</p>
            </div>
          </div>
        </section>

        

        <section className="py-10">
          <div className="text-center">
            <div className="text-lg md:text-xl font-semibold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
              Talent deserves to be seen. Join Jobtolk today.
            </div>
          </div>
        </section>

        <footer className="py-10 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-6 mb-3">
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#how" className="hover:text-foreground">How It Works</a>
            <a href="/terms" className="hover:text-foreground">Terms</a>
            <a href="/privacy" className="hover:text-foreground">Privacy</a>
            <a href="/contact" className="hover:text-foreground">Contact</a>
          </div>
          <div>Built with <span className="text-primary">❤️</span> by the Jobtolk Team • © {new Date().getFullYear()} Jobtolk</div>
        </footer>
      </div>
    </div>
  );
};

export default Welcome;

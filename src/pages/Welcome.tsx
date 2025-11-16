import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Video, CheckCircle2, Eye, Target, Zap, Users, Star, Award } from 'lucide-react';
import logoImage from '@/assets/logo.png';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="mx-auto max-w-6xl px-4">
        {/* Hero Section */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center text-center gap-10 py-10">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-2xl opacity-30 animate-pulse" />
              <div className="relative p-6 rounded-3xl bg-card shadow-elegant border-2 border-border">
                <img src={logoImage} alt="Jobtolk" className="h-20 w-20 md:h-28 md:w-28" />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Show Your Skills.<br />Get Seen. Get Hired.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Jobtolk is the platform where talent proves ability with real demonstrations, not CV buzzwords.
            </p>
          </div>

          <Button 
            size="lg" 
            className="px-12 py-7 text-lg rounded-2xl shadow-glow hover:shadow-strong hover:scale-105 transition-all duration-300 font-bold"
            onClick={() => navigate('/auth?signup=true')}
          >
            Join Waitlist
          </Button>
        </section>

        {/* Problem Section */}
        <section className="py-16 md:py-24">
          <div className="glass-card-premium rounded-2xl p-8 md:p-12 border border-destructive/20">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-destructive" />
              <h2 className="text-2xl md:text-3xl font-bold">The Problem</h2>
            </div>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Traditional platforms hide talent behind generic profiles. Candidates boost posts and still stay invisible. 
              Employers struggle to verify real skill.
            </p>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-16 md:py-24">
          <div className="glass-card-premium rounded-2xl p-8 md:p-12 border border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold">The Solution</h2>
            </div>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Jobtolk turns your abilities into short, verifiable skill videos and mini-projects. 
              Visibility is earned through performance, not paid boosts.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground text-lg">Three simple steps to showcase your expertise</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="glass-card-premium rounded-xl p-6 border border-primary/20 hover:border-primary/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Record or Upload</h3>
              <p className="text-sm text-muted-foreground">Record or upload short skill demos that highlight your abilities.</p>
            </div>
            <div className="glass-card-premium rounded-xl p-6 border border-primary/20 hover:border-primary/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Share Results</h3>
              <p className="text-sm text-muted-foreground">Share your work results with employers who value proof over promises.</p>
            </div>
            <div className="glass-card-premium rounded-xl p-6 border border-primary/20 hover:border-primary/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Get Matched</h3>
              <p className="text-sm text-muted-foreground">Get matched through skill-first discovery, no generic applications.</p>
            </div>
          </div>
        </section>

        {/* Why It's Better */}
        <section className="py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Why It's Better</h2>
            <p className="text-muted-foreground text-lg">Real advantages that make a difference</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            <div className="glass-card-premium rounded-xl p-6 border border-accent/20 hover:border-accent/40 transition-all duration-300">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Faster Credibility</h3>
                  <p className="text-sm text-muted-foreground">Build trust instantly with real demonstrations</p>
                </div>
              </div>
            </div>
            <div className="glass-card-premium rounded-xl p-6 border border-accent/20 hover:border-accent/40 transition-all duration-300">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Higher Visibility</h3>
                  <p className="text-sm text-muted-foreground">Stand out based on performance, not paid ads</p>
                </div>
              </div>
            </div>
            <div className="glass-card-premium rounded-xl p-6 border border-accent/20 hover:border-accent/40 transition-all duration-300 md:col-span-2">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Real Proof. No Noise. No Connect Fees.</h3>
                  <p className="text-sm text-muted-foreground">Skip the pay-to-play model and let your work speak for itself</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Who It's For</h2>
            <p className="text-muted-foreground text-lg">Built for talented professionals at every stage</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="glass-card-premium rounded-xl p-6 border border-primary/15 hover:border-primary/30 transition-all duration-300 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Career Builders</h3>
              <p className="text-sm text-muted-foreground">Individuals building careers and showcasing growth</p>
            </div>
            <div className="glass-card-premium rounded-xl p-6 border border-primary/15 hover:border-primary/30 transition-all duration-300 text-center">
              <Star className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Freelancers</h3>
              <p className="text-sm text-muted-foreground">Freelancers needing exposure and credibility</p>
            </div>
            <div className="glass-card-premium rounded-xl p-6 border border-primary/15 hover:border-primary/30 transition-all duration-300 text-center">
              <Target className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Local Providers</h3>
              <p className="text-sm text-muted-foreground">Local service providers wanting trust and reach</p>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 md:py-24">
          <div className="glass-card-premium rounded-2xl p-8 md:p-12 border border-primary/20 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Success Stories Coming Soon</h2>
            <p className="text-muted-foreground text-lg">
              We're working with early creators to bring you inspiring profiles and success stories. 
              Join the waitlist to be among the first to showcase your skills.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24">
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Become an Early Creator
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Be part of the movement that puts skills first. Join our waitlist and start building your reputation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="px-12 py-7 text-lg rounded-2xl shadow-glow hover:shadow-strong hover:scale-105 transition-all duration-300 font-bold"
                onClick={() => navigate('/auth?signup=true')}
              >
                Join Waitlist
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="px-12 py-7 text-lg rounded-2xl font-bold border-2 hover:bg-muted hover:scale-105 transition-all duration-300"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 text-center text-sm text-muted-foreground border-t border-border">
          <div className="flex items-center justify-center gap-6 mb-3">
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
            <a href="#how" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <div>Built with <span className="text-primary">❤️</span> by the Jobtolk Team • © {new Date().getFullYear()} Jobtolk</div>
        </footer>
      </div>
    </div>
  );
};

export default Welcome;

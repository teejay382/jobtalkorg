import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function LoginPage() {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-6">Login to JobTalk</h1>
      <Button
        onClick={signInWithGoogle}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
      >
        Continue with Google
      </Button>
    </div>
  );
}



import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This component is now optional since useAuth handles OAuth callbacks automatically
const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home page - the useAuth hook will handle the OAuth session automatically
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Processing authentication...</p>
    </div>
  );
};

export default Callback;

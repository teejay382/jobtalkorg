-- Fix search path for existing functions to resolve security warnings

-- Update can_access_sensitive_profile_data function
CREATE OR REPLACE FUNCTION public.can_access_sensitive_profile_data(target_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $$
  SELECT auth.uid() = target_user_id;
$$;

-- Update update_conversation_timestamp function  
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
    -- Explicitly set a restrictive search path
    SET search_path TO pg_catalog, public;
    
    -- Your existing function logic here
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
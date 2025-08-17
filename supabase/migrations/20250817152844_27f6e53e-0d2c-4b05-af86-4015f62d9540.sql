-- Make account_type nullable during signup, will be set during onboarding
ALTER TABLE public.profiles 
ALTER COLUMN account_type DROP NOT NULL;
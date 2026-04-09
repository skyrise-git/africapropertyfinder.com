-- Fix handle_new_user trigger to not crash on unexpected errors
-- Wraps the INSERT in a nested exception handler so auth signup never rolls back
-- Also re-enables the agent profile trigger

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO profiles (id, email, name, role, status)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'role', 'user'),
      'active'
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user failed for %: % %', NEW.id, SQLERRM, SQLSTATE;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable the agent profile auto-creation trigger
ALTER TABLE profiles ENABLE TRIGGER trg_create_agent_profile;

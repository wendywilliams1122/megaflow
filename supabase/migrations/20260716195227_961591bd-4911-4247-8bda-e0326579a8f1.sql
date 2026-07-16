CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_username TEXT;
  final_username TEXT;
  n INT := 0;
  email_domain TEXT;
  ref_code TEXT;
  referrer_id UUID;
  provided_username BOOLEAN;
BEGIN
  email_domain := lower(split_part(NEW.email, '@', 2));
  IF EXISTS (SELECT 1 FROM public.blocked_email_domains bed WHERE lower(bed.domain) = email_domain) THEN
    RAISE EXCEPTION 'Signup blocked: disposable email addresses are not allowed';
  END IF;

  provided_username := NEW.raw_user_meta_data ? 'username'
    AND coalesce(NEW.raw_user_meta_data->>'username','') <> '';

  base_username := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'username',
             split_part(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), '@', 1),
             'user'),
    '[^a-z0-9_]', '', 'g'
  ));
  IF base_username = '' THEN base_username := 'user'; END IF;
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    n := n + 1;
    final_username := base_username || n::text;
  END LOOP;

  ref_code := upper(COALESCE(NEW.raw_user_meta_data->>'ref', ''));
  IF ref_code <> '' THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = ref_code;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, avatar_url, referred_by, referral_code, username_customized)
  VALUES (
    NEW.id, final_username,
    COALESCE(NEW.raw_user_meta_data->>'name', final_username),
    NEW.raw_user_meta_data->>'avatar_url',
    referrer_id,
    upper(substr(md5(NEW.id::text || random()::text), 1, 8)),
    provided_username
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  IF NEW.raw_user_meta_data->>'signup_ip' IS NOT NULL OR NEW.raw_user_meta_data->>'signup_user_agent' IS NOT NULL THEN
    INSERT INTO public.profile_ips (user_id, signup_ip, last_ip, signup_user_agent, last_user_agent, last_seen_at)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'signup_ip',
      NEW.raw_user_meta_data->>'signup_ip',
      NEW.raw_user_meta_data->>'signup_user_agent',
      NEW.raw_user_meta_data->>'signup_user_agent',
      now()
    );
  END IF;

  RETURN NEW;
END;
$function$;
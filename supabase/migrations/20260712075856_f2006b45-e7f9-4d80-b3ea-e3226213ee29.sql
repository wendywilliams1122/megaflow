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
  ref_points INT;
BEGIN
  email_domain := lower(split_part(NEW.email, '@', 2));
  IF EXISTS (SELECT 1 FROM public.blocked_email_domains bed WHERE lower(bed.domain) = email_domain) THEN
    RAISE EXCEPTION 'Signup blocked: disposable email addresses are not allowed';
  END IF;

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

  INSERT INTO public.profiles (id, username, display_name, avatar_url, referred_by, referral_code)
  VALUES (
    NEW.id, final_username,
    COALESCE(NEW.raw_user_meta_data->>'name', final_username),
    NEW.raw_user_meta_data->>'avatar_url',
    referrer_id,
    upper(substr(md5(NEW.id::text || random()::text), 1, 8))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  IF NEW.raw_user_meta_data->>'signup_ip' IS NOT NULL THEN
    INSERT INTO public.profile_ips (user_id, signup_ip, last_ip)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'signup_ip', NEW.raw_user_meta_data->>'signup_ip')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  IF referrer_id IS NOT NULL THEN
    SELECT points_referral INTO ref_points FROM public.site_settings WHERE id = true;
    UPDATE public.profiles SET points = points + COALESCE(ref_points, 25) WHERE id = referrer_id;
  END IF;

  RETURN NEW;
END; $function$;
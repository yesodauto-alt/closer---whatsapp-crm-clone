-- YesodCRM MVP foundation.
-- This migration intentionally does not modify any Evolution Edge Function.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'team_lead', 'agent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'agent',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#6366f1',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_leader boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'agent',
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.conversation_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contact_id)
);

CREATE TABLE IF NOT EXISTS public.assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  from_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  to_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'product' CHECK (item_type IN ('product', 'service')),
  sku text,
  name text NOT NULL,
  description text,
  category text,
  unit text NOT NULL DEFAULT 'un',
  cost numeric(14,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  price numeric(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'BRL',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (organization_id, sku)
);

CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.whatsapp_contacts(id) ON DELETE SET NULL,
  title text NOT NULL,
  stage text NOT NULL DEFAULT 'open',
  expected_close_date date,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.opportunity_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(14,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  discount_percent numeric(5,2) NOT NULL DEFAULT 0
    CHECK (discount_percent >= 0 AND discount_percent <= 100),
  total numeric(14,2) GENERATED ALWAYS AS
    (round((quantity * unit_price * (1 - discount_percent / 100.0))::numeric, 2)) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  text text NOT NULL CHECK (length(btrim(text)) > 0),
  scheduled_for timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  idempotency_key uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  sent_message_id text,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agents
  ALTER COLUMN gemini_api_key DROP NOT NULL,
  ALTER COLUMN is_active SET DEFAULT false,
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS agent_type text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'openai',
  ADD COLUMN IF NOT EXISTS model text NOT NULL DEFAULT 'gpt-4.1-mini',
  ADD COLUMN IF NOT EXISTS tone text,
  ADD COLUMN IF NOT EXISTS objectives text,
  ADD COLUMN IF NOT EXISTS restrictions text,
  ADD COLUMN IF NOT EXISTS knowledge_base_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.ai_agents.gemini_api_key IS
  'Legacy column kept temporarily for backward-compatible migrations. Do not use for new agents.';

CREATE TABLE IF NOT EXISTS public.ai_agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.whatsapp_contacts(id) ON DELETE SET NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  model text NOT NULL,
  input_text text NOT NULL,
  output_text text,
  input_tokens integer,
  output_tokens integer,
  status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION private.is_org_member(target_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = target_organization_id
      AND m.user_id = auth.uid()
      AND m.is_active
  );
$$;

CREATE OR REPLACE FUNCTION private.has_org_role(
  target_organization_id uuid,
  accepted_roles public.app_role[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = target_organization_id
      AND m.user_id = auth.uid()
      AND m.is_active
      AND m.role = ANY (accepted_roles)
  );
$$;

CREATE OR REPLACE FUNCTION private.can_access_team(target_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams t
    JOIN public.organization_members om
      ON om.organization_id = t.organization_id
     AND om.user_id = auth.uid()
     AND om.is_active
    LEFT JOIN public.team_members tm
      ON tm.team_id = t.id
     AND tm.user_id = auth.uid()
    WHERE t.id = target_team_id
      AND (
        om.role IN ('super_admin', 'admin')
        OR tm.user_id IS NOT NULL
      )
  );
$$;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_org_role(uuid, public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_access_team(uuid) TO authenticated;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_select_member
  ON public.organizations FOR SELECT TO authenticated
  USING (private.is_org_member(id));

CREATE POLICY organizations_insert_owner
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY organizations_update_admin
  ON public.organizations FOR UPDATE TO authenticated
  USING (private.has_org_role(id, ARRAY['super_admin', 'admin']::public.app_role[]))
  WITH CHECK (private.has_org_role(id, ARRAY['super_admin', 'admin']::public.app_role[]));

CREATE POLICY profiles_select_authenticated
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.organization_members mine
      JOIN public.organization_members theirs
        ON theirs.organization_id = mine.organization_id
      WHERE mine.user_id = auth.uid()
        AND mine.is_active
        AND theirs.user_id = profiles.id
        AND theirs.is_active
    )
  );

CREATE POLICY profiles_update_self
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_select_admin_directory
  ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.organization_members membership
    WHERE membership.user_id = auth.uid()
      AND membership.is_active
      AND membership.role IN ('super_admin', 'admin')
  ));

CREATE POLICY organization_members_select_member
  ON public.organization_members FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY organization_members_manage_admin
  ON public.organization_members FOR ALL TO authenticated
  USING (private.has_org_role(
    organization_id,
    ARRAY['super_admin', 'admin']::public.app_role[]
  ))
  WITH CHECK (private.has_org_role(
    organization_id,
    ARRAY['super_admin', 'admin']::public.app_role[]
  ));

CREATE POLICY teams_select_member
  ON public.teams FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY teams_manage_admin
  ON public.teams FOR ALL TO authenticated
  USING (private.has_org_role(
    organization_id,
    ARRAY['super_admin', 'admin']::public.app_role[]
  ))
  WITH CHECK (private.has_org_role(
    organization_id,
    ARRAY['super_admin', 'admin']::public.app_role[]
  ));

CREATE POLICY team_members_select_team
  ON public.team_members FOR SELECT TO authenticated
  USING (private.can_access_team(team_id));

CREATE POLICY team_members_manage_admin
  ON public.team_members FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = team_id
      AND private.has_org_role(
        t.organization_id,
        ARRAY['super_admin', 'admin']::public.app_role[]
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = team_id
      AND private.has_org_role(
        t.organization_id,
        ARRAY['super_admin', 'admin']::public.app_role[]
      )
  ));

CREATE POLICY organization_invites_select_admin
  ON public.organization_invites FOR SELECT TO authenticated
  USING (
    lower(email) = lower(COALESCE(auth.jwt()->>'email', ''))
    OR private.has_org_role(
      organization_id,
      ARRAY['super_admin', 'admin']::public.app_role[]
    )
  );

CREATE POLICY organization_invites_manage_admin
  ON public.organization_invites FOR ALL TO authenticated
  USING (private.has_org_role(
    organization_id,
    ARRAY['super_admin', 'admin']::public.app_role[]
  ))
  WITH CHECK (
    invited_by = auth.uid()
    AND role <> 'super_admin'
    AND private.has_org_role(
      organization_id,
      ARRAY['super_admin', 'admin']::public.app_role[]
    )
  );

CREATE POLICY assignments_select_team
  ON public.conversation_assignments FOR SELECT TO authenticated
  USING (private.can_access_team(team_id));

CREATE POLICY assignments_manage_lead
  ON public.conversation_assignments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = team_id
      AND (
        private.has_org_role(
          t.organization_id,
          ARRAY['super_admin', 'admin']::public.app_role[]
        )
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.team_id = t.id
            AND tm.user_id = auth.uid()
            AND tm.is_leader
        )
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = team_id
      AND (
        private.has_org_role(
          t.organization_id,
          ARRAY['super_admin', 'admin']::public.app_role[]
        )
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.team_id = t.id
            AND tm.user_id = auth.uid()
            AND tm.is_leader
        )
      )
  ));

CREATE POLICY assignment_history_select_team
  ON public.assignment_history FOR SELECT TO authenticated
  USING (
    (to_team_id IS NOT NULL AND private.can_access_team(to_team_id))
    OR (from_team_id IS NOT NULL AND private.can_access_team(from_team_id))
  );

CREATE POLICY assignment_history_insert_authenticated
  ON public.assignment_history FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid());

CREATE POLICY products_select_member
  ON public.products FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY products_manage_admin
  ON public.products FOR ALL TO authenticated
  USING (private.has_org_role(
    organization_id,
    ARRAY['super_admin', 'admin']::public.app_role[]
  ))
  WITH CHECK (private.has_org_role(
    organization_id,
    ARRAY['super_admin', 'admin']::public.app_role[]
  ));

CREATE POLICY opportunities_select_member
  ON public.opportunities FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY opportunities_write_member
  ON public.opportunities FOR ALL TO authenticated
  USING (private.is_org_member(organization_id))
  WITH CHECK (private.is_org_member(organization_id));

CREATE POLICY opportunity_items_member
  ON public.opportunity_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = opportunity_id
      AND private.is_org_member(o.organization_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.opportunities o
    WHERE o.id = opportunity_id
      AND private.is_org_member(o.organization_id)
  ));

CREATE POLICY scheduled_messages_select_team
  ON public.scheduled_messages FOR SELECT TO authenticated
  USING (
    private.has_org_role(
      organization_id,
      ARRAY['super_admin', 'admin']::public.app_role[]
    )
    OR EXISTS (
      SELECT 1
      FROM public.conversation_assignments ca
      WHERE ca.contact_id = scheduled_messages.contact_id
        AND private.can_access_team(ca.team_id)
    )
  );

CREATE POLICY scheduled_messages_create_team
  ON public.scheduled_messages FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND private.is_org_member(organization_id)
  );

CREATE POLICY scheduled_messages_update_creator_or_admin
  ON public.scheduled_messages FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR private.has_org_role(
      organization_id,
      ARRAY['super_admin', 'admin']::public.app_role[]
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR private.has_org_role(
      organization_id,
      ARRAY['super_admin', 'admin']::public.app_role[]
    )
  );

CREATE POLICY ai_agents_select_organization
  ON public.ai_agents FOR SELECT TO authenticated
  USING (
    organization_id IS NOT NULL
    AND private.is_org_member(organization_id)
  );

CREATE POLICY ai_agents_manage_organization_admin
  ON public.ai_agents FOR ALL TO authenticated
  USING (
    organization_id IS NOT NULL
    AND private.has_org_role(
      organization_id,
      ARRAY['super_admin', 'admin']::public.app_role[]
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND provider = 'openai'
    AND model IN ('gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4o')
    AND private.has_org_role(
      organization_id,
      ARRAY['super_admin', 'admin']::public.app_role[]
    )
  );

CREATE POLICY ai_agent_runs_select_organization
  ON public.ai_agent_runs FOR SELECT TO authenticated
  USING (private.is_org_member(organization_id));

CREATE POLICY ai_agent_runs_insert_member
  ON public.ai_agent_runs FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND private.is_org_member(organization_id)
  );

-- Team members may read contacts and messages assigned to one of their teams.
CREATE POLICY whatsapp_contacts_select_assigned_team
  ON public.whatsapp_contacts FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.conversation_assignments ca
    WHERE ca.contact_id = whatsapp_contacts.id
      AND private.can_access_team(ca.team_id)
  ));

CREATE POLICY whatsapp_messages_select_assigned_team
  ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.conversation_assignments ca
    WHERE ca.contact_id = whatsapp_messages.contact_id
      AND private.can_access_team(ca.team_id)
  ));

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.organizations,
  public.profiles,
  public.organization_members,
  public.teams,
  public.team_members,
  public.organization_invites,
  public.conversation_assignments,
  public.assignment_history,
  public.products,
  public.opportunities,
  public.opportunity_items,
  public.scheduled_messages,
  public.ai_agent_runs
TO authenticated;

CREATE INDEX IF NOT EXISTS idx_org_members_user
  ON public.organization_members(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user
  ON public.team_members(user_id, team_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email
  ON public.organization_invites(lower(email), status);
CREATE INDEX IF NOT EXISTS idx_assignments_team
  ON public.conversation_assignments(team_id, assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_products_org_active
  ON public.products(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_opportunities_org_stage
  ON public.opportunities(organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_due
  ON public.scheduled_messages(scheduled_for)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_ai_agent_runs_agent_created
  ON public.ai_agent_runs(agent_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.claim_scheduled_messages(batch_size integer DEFAULT 25)
RETURNS SETOF public.scheduled_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT sm.id
    FROM public.scheduled_messages sm
    WHERE sm.status = 'pending'
      AND sm.scheduled_for <= now()
      AND sm.attempts < sm.max_attempts
    ORDER BY sm.scheduled_for
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(batch_size, 1), 100)
  )
  UPDATE public.scheduled_messages sm
  SET status = 'processing',
      attempts = sm.attempts + 1,
      updated_at = now()
  FROM due
  WHERE sm.id = due.id
  RETURNING sm.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_scheduled_messages(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_scheduled_messages(integer) FROM anon;
REVOKE ALL ON FUNCTION public.claim_scheduled_messages(integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_scheduled_messages(integer) TO service_role;

-- Ensure profile rows exist for current and future users.
INSERT INTO public.profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email)
FROM auth.users u
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email;

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
  SELECT invite.organization_id, NEW.id, invite.role, true
  FROM public.organization_invites invite
  WHERE lower(invite.email) = lower(NEW.email)
    AND invite.status = 'pending'
    AND invite.expires_at > now()
  ON CONFLICT (organization_id, user_id) DO UPDATE
  SET role = EXCLUDED.role,
      is_active = true,
      updated_at = now();

  INSERT INTO public.team_members (team_id, user_id, is_leader)
  SELECT invite.team_id, NEW.id, invite.role = 'team_lead'
  FROM public.organization_invites invite
  WHERE lower(invite.email) = lower(NEW.email)
    AND invite.status = 'pending'
    AND invite.expires_at > now()
    AND invite.team_id IS NOT NULL
  ON CONFLICT (team_id, user_id) DO UPDATE
  SET is_leader = EXCLUDED.is_leader;

  UPDATE public.organization_invites
  SET status = 'accepted',
      accepted_by = NEW.id,
      accepted_at = now()
  WHERE lower(email) = lower(NEW.email)
    AND status = 'pending'
    AND expires_at > now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_yesod_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_yesod_profile
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

CREATE OR REPLACE FUNCTION private.guard_super_admin_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  root_user_id uuid;
BEGIN
  SELECT id INTO root_user_id
  FROM auth.users
  WHERE lower(email) = 'yesod.auto@gmail.com'
  ORDER BY created_at
  LIMIT 1;

  IF TG_OP = 'DELETE' THEN
    IF OLD.user_id = root_user_id THEN
      RAISE EXCEPTION 'A conta-raiz yesod.auto@gmail.com não pode ser removida';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.role = 'super_admin' AND NEW.user_id IS DISTINCT FROM root_user_id THEN
    RAISE EXCEPTION 'Somente yesod.auto@gmail.com pode ter a função super_admin';
  END IF;

  IF NEW.user_id = root_user_id
     AND (NEW.role <> 'super_admin' OR NOT NEW.is_active) THEN
    RAISE EXCEPTION 'A conta-raiz yesod.auto@gmail.com deve permanecer super_admin ativa';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_yesod_super_admin ON public.organization_members;
CREATE TRIGGER guard_yesod_super_admin
BEFORE INSERT OR UPDATE OR DELETE ON public.organization_members
FOR EACH ROW EXECUTE FUNCTION private.guard_super_admin_membership();

-- Bootstrap the Yesod organization and protected root account when it exists.
DO $$
DECLARE
  root_user_id uuid;
  yesod_org_id uuid;
BEGIN
  SELECT id INTO root_user_id
  FROM auth.users
  WHERE lower(email) = 'yesod.auto@gmail.com'
  ORDER BY created_at
  LIMIT 1;

  IF root_user_id IS NOT NULL THEN
    INSERT INTO public.organizations (name, slug, owner_user_id)
    VALUES ('Yesod CRM', 'yesod-crm', root_user_id)
    ON CONFLICT (slug) DO UPDATE SET owner_user_id = EXCLUDED.owner_user_id
    RETURNING id INTO yesod_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
    VALUES (yesod_org_id, root_user_id, 'super_admin', true)
    ON CONFLICT (organization_id, user_id)
    DO UPDATE SET role = 'super_admin', is_active = true;
  END IF;
END $$;

-- Exécution idempotente et traçable des actions approuvées.

ALTER TABLE agent_approvals
  DROP CONSTRAINT IF EXISTS agent_approvals_status_check;

ALTER TABLE agent_approvals
  ADD CONSTRAINT agent_approvals_status_check
  CHECK (status IN ('pending', 'approved', 'executing', 'rejected', 'expired', 'executed', 'failed'));

ALTER TABLE agent_approvals
  ADD COLUMN IF NOT EXISTS execution_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS executed_at timestamptz,
  ADD COLUMN IF NOT EXISTS execution_result jsonb,
  ADD COLUMN IF NOT EXISTS execution_error text;

CREATE INDEX IF NOT EXISTS agent_approvals_execution_idx
  ON agent_approvals (status, execution_started_at)
  WHERE status IN ('approved', 'executing', 'failed');

CREATE OR REPLACE FUNCTION public.agent_convert_radar_item(p_item_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item radar_items%ROWTYPE;
  v_client_id uuid;
  v_note text;
BEGIN
  SELECT * INTO v_item
  FROM radar_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Piste Radar introuvable';
  END IF;
  IF v_item.client_id IS NOT NULL THEN
    RETURN v_item.client_id;
  END IF;
  IF v_item.status = 'ecarte' OR v_item.fit = 'nogo' THEN
    RAISE EXCEPTION 'Piste Radar écartée ou non conforme';
  END IF;
  IF concat_ws(' ', v_item.title, v_item.subtitle) ~* '(NAF[[:space:]]*62|agence web|ESN|programmation de logiciels|services informatiques)' THEN
    RAISE EXCEPTION 'Conversion bloquée : concurrent informatique';
  END IF;

  v_note := concat_ws(E'\n\n',
    v_item.subtitle,
    array_to_string(v_item.reasons, E'\n'),
    v_item.next_action,
    v_item.approach_subject,
    v_item.approach_body,
    v_item.url
  );

  INSERT INTO clients (name, email, company, address, stage, source, updated_at)
  VALUES (
    COALESCE(NULLIF(v_item.contact_name, ''), v_item.title),
    NULL,
    v_item.title,
    COALESCE(v_item.payload ->> 'address', concat_ws(' ', v_item.city, v_item.department)),
    CASE WHEN v_item.kind = 'marche' THEN 'qualifié' ELSE 'prospect' END,
    concat_ws(':', 'radar', v_item.kind, v_item.external_id),
    now()
  )
  RETURNING id INTO v_client_id;

  INSERT INTO client_activities (client_id, kind, title, body, status, done_at)
  VALUES (
    v_client_id,
    'note',
    CASE WHEN v_item.kind = 'marche' THEN 'Piste marché public' ELSE 'Piste radar entreprises' END,
    v_note,
    'faite',
    now()
  );

  INSERT INTO client_activities (client_id, kind, title, body, due_at, status)
  VALUES (
    v_client_id,
    'relance',
    'Qualifier la piste Radar',
    'Relance créée automatiquement après approbation humaine.',
    current_date + 2,
    'ouverte'
  );

  UPDATE radar_items
  SET status = 'converti', client_id = v_client_id, updated_at = now()
  WHERE id = p_item_id;

  RETURN v_client_id;
END;
$$;

REVOKE ALL ON FUNCTION public.agent_convert_radar_item(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_convert_radar_item(uuid) TO service_role;

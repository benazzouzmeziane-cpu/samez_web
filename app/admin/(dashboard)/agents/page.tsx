export const dynamic = 'force-dynamic'

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AgentControlCenter from '@/components/admin/agents/AgentControlCenter'
import { isAgentPlatformConfigured } from '@/lib/agents/cloudflare'
import { agentDashboard } from '@/lib/agents/store'
import type { AgentDashboard } from '@/lib/agents/types'
import { createClient } from '@/lib/supabase/server'

const EMPTY: AgentDashboard = {
  runs: [],
  tasks: [],
  events: [],
  memories: [],
  approvals: [],
}

export default async function AgentsPage() {
  const supabase = await createClient()
  const dashboard = await agentDashboard(supabase).catch(() => EMPTY)

  return (
    <div>
      <AdminPageHeader
        title="Agents"
        description="Une mission en haut. Missions, journal, mémoire et validations dans les onglets."
      />
      <AgentControlCenter initial={dashboard} configured={isAgentPlatformConfigured()} />
    </div>
  )
}

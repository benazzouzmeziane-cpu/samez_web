import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar />
      <div className="flex-1 p-10 overflow-auto">
        {children}
      </div>
    </div>
  )
}

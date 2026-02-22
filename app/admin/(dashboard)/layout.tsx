import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-8 md:p-10">
          {children}
        </div>
      </div>
    </div>
  )
}

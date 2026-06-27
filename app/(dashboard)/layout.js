import DashboardShell from '../../components/DashboardShell';

// dashboard 路由组：带顶部导航 + 左侧子导航的后台框架
export default function DashboardLayout({ children }) {
    return <DashboardShell>{children}</DashboardShell>;
}

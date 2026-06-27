import '../styles/globals.css';
import { Toaster } from '../components/ui/sonner';

export const metadata = {
    title: 'admin后台',
    description: 'Admin Dashboard',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    shrinkToFit: false,
};

export default function RootLayout({ children }) {
    return (
        <html lang="zh-CN">
            <body>
                {children}
                <Toaster position="top-center" />
            </body>
        </html>
    );
}

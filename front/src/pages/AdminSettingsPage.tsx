import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AdminPlatformSettings } from '../components/admin/AdminPlatformSettings';
import { AdminCommissionSettings } from '../components/admin/AdminCommissionSettings';
import { AdminNotificationSettings } from '../components/admin/AdminNotificationSettings';
import { AdminSecuritySettings } from '../components/admin/AdminSecuritySettings';

const AdminSettingsPage: React.FC = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
				<Card>
					<CardHeader>
						<CardTitle>Paramètres Généraux</CardTitle>
					</CardHeader>
					<CardContent>
						<AdminPlatformSettings />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Commissions</CardTitle>
					</CardHeader>
					<CardContent>
						<AdminCommissionSettings />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Notifications</CardTitle>
					</CardHeader>
					<CardContent>
						<AdminNotificationSettings />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Sécurité & Permissions</CardTitle>
					</CardHeader>
					<CardContent>
						<AdminSecuritySettings />
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default AdminSettingsPage;


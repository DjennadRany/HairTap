import React from 'react';

export const AdminNotificationSettings: React.FC = () => {
	return (
		<div className="space-y-3">
			<label className="flex items-center space-x-3">
				<input type="checkbox" defaultChecked />
				<span>Emails de confirmation</span>
			</label>
			<label className="flex items-center space-x-3">
				<input type="checkbox" defaultChecked />
				<span>Notifications push</span>
			</label>
		</div>
	);
};

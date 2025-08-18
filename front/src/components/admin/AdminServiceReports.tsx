import React from 'react';

export const AdminServiceReports: React.FC = () => {
	return (
		<div className="space-y-3">
			<div className="p-3 border rounded">
				<div className="font-medium">Signalement #124</div>
				<div className="text-sm text-gray-500">Conflit sur un service non livré</div>
			</div>
			<div className="p-3 border rounded">
				<div className="font-medium">Signalement #125</div>
				<div className="text-sm text-gray-500">Photo inappropriée</div>
			</div>
		</div>
	);
};

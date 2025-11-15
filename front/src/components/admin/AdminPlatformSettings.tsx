import React from 'react';

export const AdminPlatformSettings: React.FC = () => {
	return (
		<form className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<label className="flex flex-col">
				<span className="text-sm text-gray-600 mb-1">Nom de la plateforme</span>
				<input className="border rounded px-3 py-2" defaultValue="TapHair" />
			</label>
			<label className="flex flex-col">
				<span className="text-sm text-gray-600 mb-1">Email support</span>
				<input className="border rounded px-3 py-2" defaultValue="support@taphair.com" />
			</label>
		</form>
	);
};













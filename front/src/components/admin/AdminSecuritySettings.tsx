import React from 'react';

export const AdminSecuritySettings: React.FC = () => {
	return (
		<div className="space-y-3">
			<label className="flex items-center space-x-3">
				<input type="checkbox" defaultChecked />
				<span>2FA obligatoire pour les admins</span>
			</label>
			<label className="flex items-center space-x-3">
				<input type="checkbox" />
				<span>Forcer la rotation des mots de passe</span>
			</label>
		</div>
	);
};

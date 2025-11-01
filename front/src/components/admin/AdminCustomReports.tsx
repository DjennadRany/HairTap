import React from 'react';

export const AdminCustomReports: React.FC = () => {
	return (
		<div className="p-4 border rounded">
			<div className="text-sm text-gray-500 mb-2">Sélection du rapport</div>
			<select className="border rounded px-3 py-2">
				<option>Rapport mensuel</option>
				<option>Top coiffeurs</option>
				<option>Revenus par ville</option>
			</select>
			<button className="ml-3 px-4 py-2 bg-accent text-white rounded">Générer</button>
		</div>
	);
};


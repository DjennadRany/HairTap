import React from 'react';

export const AdminCommissionSettings: React.FC = () => {
	return (
		<div className="flex items-center space-x-3">
			<span className="text-sm text-gray-600">Commission (en %)</span>
			<input type="number" className="border rounded px-3 py-2 w-24" defaultValue={7} />
			<button className="px-4 py-2 bg-accent text-white rounded">Enregistrer</button>
		</div>
	);
};

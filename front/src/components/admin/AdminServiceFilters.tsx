import React from 'react';

export const AdminServiceFilters: React.FC = () => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			<select className="border rounded px-3 py-2">
				<option>Catégorie</option>
				<option>Coupe</option>
				<option>Coloration</option>
			</select>
			<select className="border rounded px-3 py-2">
				<option>Statut</option>
				<option>Actif</option>
				<option>En attente</option>
			</select>
			<input className="border rounded px-3 py-2" placeholder="Rechercher..." />
		</div>
	);
};

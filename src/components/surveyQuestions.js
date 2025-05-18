export const questions = [
	{
		id: "interviewInfo",
		text: "Informations sur l'interview",
		options: [
			{ text: "Interview MATIN", next: "Q1" },
			{ text: "Interview SOIR", next: "Q1" },
		],
	},
	{
		id: "Q1",
		text: "La personne enquêtée... :",
		options: [
			{ text: "Accède à la gare (va monter dans un train) -- entrant", next: "Q2a" },
			{ text: "Sort de la gare (descend d'un train) -- sortant", next: "Q2b" },
		],
	},
	{
		id: "Q2a",
		text: "Venez-vous du nord ou du sud de la gare ?",
		options: [
			{ text: "Nord de la gare", next: "Q3a" },
			{ text: "Sud de la gare", next: "Q3a" },
		],
	},
	{
		id: "Q2b",
		text: "Vous rendez-vous au sud ou au nord de la gare ?",
		options: [
			{ text: "Nord de la gare", next: "Q3b" },
			{ text: "Sud de la gare", next: "Q3b" },
		],
	},
	{
		id: "Q3a",
		text: "De quelle commune venez-vous ?",
		options: [
			{ text: "Trappes", next: "Q4" },
			{ text: "Autre Commune", next: "Q3a_precision", requiresPrecision: true },
		],
	},
	{
		id: "Q3a_precision",
		text: "Préciser le nom de la commune :",
		freeText: true,
		next: "Q5",
	},
	{
		id: "Q3b",
		text: "Dans quelle commune allez-vous vous rendre après avoir quitté la gare ?",
		options: [
			{ text: "Trappes", next: "Q4" },
			{ text: "Autre Commune", next: "Q3b_precision", requiresPrecision: true },
		],
	},
	{
		id: "Q3b_precision",
		text: "Préciser le nom de la commune :",
		freeText: true,
		next: "Q5",
	},
	{
		id: "Q4",
		text: "Dans quel quartier de Trappes ?",
		options: [
			{ text: "La Plaine de Neauphle (nord)", next: "Q5" },
			{ text: "Les Merisiers (centre)", next: "Q5" },
			{ text: "La Boissière (ouest)", next: "Q5" },
			{ text: "Le Village - Aérostat - Sand Pergaud Verlaine (nord-est)", next: "Q5" },
			{ text: "Centre-ville (entre RN10 et voies ferrées)", next: "Q5" },
			{ text: "Jean Macé (sud des voies ferrées)", next: "Q5" },
			{ text: "Autre", next: "Q4_precision", requiresPrecision: true },
		],
	},
	{
		id: "Q4_precision",
		text: "Préciser le quartier :",
		freeText: true,
		next: "Q5",
	},
	{
		id: "Q5",
		text: "Quel est le motif de votre déplacement en train ?",
		options: [
			{ text: "Domicile <> Travail" },
			{ text: "Autre déplacement professionnel" },
			{ text: "Domicile <> Etudes" },
			{ text: "Domicile <> Achats, loisirs, visite de la famille/amis" },
			{ text: "Domicile <> rdv médical ou administratif" },
			{ text: "Autre", next: "Q5_precision", requiresPrecision: true },
		],
		conditionalNext: {
			condition: "Q1",
			routes: [
				{ value: 1, next: "Q6a" },
				{ value: 2, next: "Q6b" }
			]
		}
	},
	{
		id: "Q5_precision",
		text: "Préciser le motif :",
		freeText: true,
		conditionalNext: {
			condition: "Q1",
			routes: [
				{ value: 1, next: "Q6a" },
				{ value: 2, next: "Q6b" }
			]
		}
	},
	{
		id: "Q6a",
		text: "Par quel mode de déplacement êtes-vous arrivés en Gare ?",
		options: [
			{ text: "Marche à pied seule", next: "Q9" },
			{ text: "Bus/Car", next: "Q9" },
			{ text: "Voiture conducteur", next: "Q7" },
			{ text: "Voiture passager", next: "Q9" },
			{ text: "Vélo stationné en gare", next: "Q8" },
			{ text: "Vélo embarqué dans le train", next: "Q9" },
			{ text: "Deux roues motorisées", next: "Q9" },
			{ text: "Autre", next: "Q6a_precision", requiresPrecision: true },
		],
	},
	{
		id: "Q6a_precision",
		text: "Préciser le mode de déplacement (par exemple : trottinette, monoroues, hoverboard, etc.) :",
		freeText: true,
		next: "Q9",
	},
	{
		id: "Q6b",
		text: "Par quel mode de déplacement allez-vous quitter la Gare ?",
		options: [
			{ text: "Marche à pied seule", next: "Q9" },
			{ text: "Bus/Car", next: "Q9" },
			{ text: "Voiture conducteur", next: "Q9" },
			{ text: "Voiture passager", next: "Q9" },
			{ text: "Vélo stationné en gare", next: "Q9" },
			{ text: "Vélo embarqué dans le train", next: "Q9" },
			{ text: "Deux roues motorisées", next: "Q9" },
			{ text: "Autre", next: "Q6b_precision", requiresPrecision: true },
		],
	},
	{
		id: "Q6b_precision",
		text: "Préciser le mode de déplacement (par exemple : trottinette, monoroues, hoverboard, etc.) :",
		freeText: true,
		next: "Q9",
	},
	{
		id: "Q7",
		text: "Si vous êtes venus en voiture, ou êtes-vous stationnés ?",
		options: [
			{ text: "Parking de la gare Nord", next: "Q9" },
			{ text: "Parking de la gare Sud", next: "Q9" },
			{ text: "Sur voirie au nord de la gare", next: "Q9" },
			{ text: "Sur voirie au sud de la gare", next: "Q9" },
		],
	},
	{
		id: "Q8",
		text: "Si vous êtes venus à vélo, ou l'avez-vous stationné ?",
		options: [
			{ text: "Sur un arceau vélo proche de la gare", next: "Q9" },
			{ text: "Dans le parking sécurisé de la gare", next: "Q9" },
			{ text: "Sur du mobilier urbain à proximité de la gare", next: "Q9" },
			{ text: "Autre", next: "Q8_precision", requiresPrecision: true },
		],
	},
	{
		id: "Q8_precision",
		text: "Préciser l'emplacement du vélo :",
		freeText: true,
		next: "Q9",
	},
	{
		id: "Q9",
		text: "A quelle fréquence faites-vous le même trajet qu'aujourd'hui ?",
		options: [
			{ text: "4 à 5 jours par semaine", next: "Q10" },
			{ text: "2 à 3 fois par semaine", next: "Q10" },
			{ text: "1 fois par semaine", next: "Q10" },
			{ text: "Moins d'une fois par semaine", next: "Q10" },
		],
	},
	{
		id: "Q10",
		text: "Quel est votre âge ?",
		options: [
			{ text: "Moins de 18 ans", next: "end" },
			{ text: "18-24 ans", next: "end" },
			{ text: "25-34 ans", next: "end" },
			{ text: "35-44 ans", next: "end" },
			{ text: "45-54 ans", next: "end" },
			{ text: "55-64 ans", next: "end" },
			{ text: "65 ans et plus", next: "end" },
		],
	},
];
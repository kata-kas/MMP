import { lazy } from "react";

const ProjectPage = lazy(() =>
	import("./components/project-page/ProjectPage.tsx").then((m) => ({
		default: m.ProjectPage,
	})),
);
const ProjectsPage = lazy(() =>
	import("./components/projects-page/ProjectsPage.tsx").then((m) => ({
		default: m.ProjectsPage,
	})),
);
const CreateProject = lazy(() =>
	import(
		"./components/projects-page/parts/create-project/CreateProject.tsx"
	).then((m) => ({ default: m.CreateProject })),
);
const ImportProject = lazy(() =>
	import(
		"./components/projects-page/parts/import-project/ImportProject.tsx"
	).then((m) => ({ default: m.ImportProject })),
);
const ProjectsList = lazy(() =>
	import(
		"./components/projects-page/parts/projects-list/ProjectsList.tsx"
	).then((m) => ({ default: m.ProjectsList })),
);

export const routes = [
	{
		path: "",
		element: <ProjectsPage />,
		children: [
			{
				path: "",
				index: true,
				element: <ProjectsList />,
			},
			{
				path: "list",
				element: <ProjectsList />,
			},
			{
				path: "import",
				element: <ImportProject />,
			},
			{
				path: "new",
				element: <CreateProject />,
			},
		],
	},
	{
		path: ":id",
		element: <ProjectPage />,
	},
];

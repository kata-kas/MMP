export type NodeKind = "root" | "file" | "dir" | "bundle" | "bundled";

export interface Asset {
	id: string;
	label?: string;
	description?: string;
	path?: string;
	root: string;
	fs_kind: string;
	fs_name: string;
	extension?: string;
	kind?: string;
	node_kind: NodeKind;
	parent_id?: string;
	parent?: Asset;
	nested_assets?: Asset[];
	thumbnail?: string;
	seen_on_scan?: boolean;
	properties: Record<string, any>;
	tags: Tag[];
	created_at: string;
	updated_at: string;
}

export interface Tag {
	value: string;
}

export interface AssetType {
	name: string;
	label: string;
	extensions: string[];
	order: number;
}

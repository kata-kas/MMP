import type { Meta, StoryObj } from "@storybook/react";
import { AssetDetails } from "@/assets/components/asset-details/AssetDetails";
import type { Asset } from "@/assets/entities/Assets";

const mockAsset: Asset = {
	id: "1",
	name: "test-model.stl",
	label: "Test Model",
	origin: "upload",
	project_uuid: "project-1",
	path: "/path/to/file",
	mod_time: "2024-01-01T12:00:00Z",
	size: 1024000,
	asset_type: "model",
	extension: ".stl",
	mime_type: "model/stl",
	image_id: "img-1",
	properties: {},
};

const mockAssetWithProperties: Asset = {
	...mockAsset,
	properties: {
		width: "100mm",
		height: "50mm",
		depth: "25mm",
		material: "PLA",
		layer_height: "0.2mm",
	},
};

const meta: Meta<typeof AssetDetails> = {
	title: "Features/AssetDetails",
	component: AssetDetails,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof AssetDetails>;

export const Default: Story = {
	args: {
		asset: mockAsset,
	},
};

export const WithProperties: Story = {
	args: {
		asset: mockAssetWithProperties,
	},
};

export const LargeFile: Story = {
	args: {
		asset: {
			...mockAsset,
			size: 1073741824,
		},
	},
};

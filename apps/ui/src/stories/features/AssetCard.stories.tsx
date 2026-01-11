import type { Meta, StoryObj } from "@storybook/react";
import { AssetCard } from "@/assets/components/asset-card/AssetCard";
import type { Asset } from "@/assets/entities/Assets";
import { SettingsProvider } from "@/core/settings/settingsProvider";

const mockAsset: Asset = {
	id: "1",
	name: "test-model.stl",
	label: "Test Model",
	origin: "upload",
	project_uuid: "project-1",
	path: "/path/to/file",
	mod_time: "2024-01-01",
	size: 1024,
	asset_type: "model",
	extension: ".stl",
	mime_type: "model/stl",
	image_id: "img-1",
	properties: {},
};

const meta: Meta<typeof AssetCard> = {
	title: "Features/AssetCard",
	component: AssetCard,
	decorators: [
		(Story) => (
			<SettingsProvider loading={<div>Loading...</div>}>
				<Story />
			</SettingsProvider>
		),
	],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof AssetCard>;

export const Default: Story = {
	args: {
		asset: mockAsset,
		focused: false,
		onFocused: () => {},
		onDelete: () => {},
		onChange: () => {},
		view3d: false,
		onView3dChange: () => {},
	},
};

export const Focused: Story = {
	args: {
		...Default.args,
		focused: true,
	},
};

export const WithImage: Story = {
	args: {
		...Default.args,
		asset: {
			...mockAsset,
			image_id: "img-1",
		},
	},
};

export const WithoutImage: Story = {
	args: {
		...Default.args,
		asset: {
			...mockAsset,
			image_id: "",
		},
	},
};

export const Loading: Story = {
	args: {
		...Default.args,
	},
	render: (args) => (
		<div className="relative">
			<div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
				<div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
			</div>
			<AssetCard {...args} />
		</div>
	),
};

export const With3DView: Story = {
	args: {
		...Default.args,
		asset: {
			...mockAsset,
			extension: ".stl",
		},
		view3d: true,
	},
};
